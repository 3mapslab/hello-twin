import * as THREE from "three";
import * as utils from "./utils.js";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KMZLoader } from 'three/examples/jsm/loaders/KMZLoader.js';

var offset = 0;

export default class TwinLoader {

    constructor(center, scene) {
        this.center = center; // in meters
        this.scene = scene;
    }

    loadLayer(geojson, properties, type) {
        if (geojson == null || geojson.features == null) return;

        var geo = utils.convertGeoJsonToWorldUnits(geojson);
        var shape = null;
        var geometries = [];
        var feature;

        if (type == "INSTANCED") {
            return this.loadLayerInstancedMesh(geojson, properties);
        
        } else {

            for (feature of geo.features) {
                feature.properties = Object.assign({}, properties, feature.properties);
                shape = this.createShape(feature);
                geometries.push(shape);
                shape.dispose();
            }

            return this.mergeMeshes(geometries, properties);
        }
    }

    async loadLayerInstancedMesh(geojson, properties) {

        if (geojson == null || geojson.features == null) return;
        
        let count = geojson.features.length;
        let geometry;


        // Check if layer has a defined model
        if (properties.model) {
            // Check type of model
            if (properties.model.split('.').pop() == "json") {
                geometry = await this.loadGeometry(properties.model);
            }
        
        } else { // If model is not defined, display basic box of size 5x5x5
            geometry = new THREE.BoxBufferGeometry(5,5,5);
        }

        let material = new THREE.MeshStandardMaterial({
            'color': properties ? properties.material.color : 'red',
            'polygonOffset': true,
            'polygonOffsetUnits': -1 * offset,
            'polygonOffsetFactor': -1,
        });

        if (properties.material.texture) {
            let texture = new THREE.TextureLoader().load(properties.material.texture);
            material.color = null;
            material.map = texture;
        }

        let mesh = new THREE.InstancedMesh(geometry, material, count);

        const dummy = new THREE.Object3D();
        
        // Set position of every mesh in this instanced mesh
        for (let i = 1; i < count; i++) {

            let feature = geojson.features[i];
            let units = utils.convertCoordinatesToUnits(
                feature.geometry.coordinates[0],
                feature.geometry.coordinates[1]
            );

            dummy.position.set(units[0] - this.center.x, 0, -(units[1] - this.center.y));
            dummy.updateMatrix();
            mesh.setMatrixAt(i++, dummy.matrix);
        }

        mesh.geometry.dispose();
        mesh.material.dispose();
        return mesh;
    }

    mergeMeshes(geometries, properties) {

        var mergedGeometries = this.mergeBufferGeometries(geometries, false);
        ++offset;

        let materialTop = new THREE.MeshBasicMaterial({
            'color': properties.material.color,
            'polygonOffset': true,
            'polygonOffsetUnits': -1 * offset,
            'polygonOffsetFactor': -1,
        });

        let materialSide = materialTop.clone();

        if (properties.material.textureTop) {
            this.createMaterial(materialTop, properties.material.textureTop);
        }

        if (properties.material.textureSide) {
            this.createMaterial(materialSide, properties.material.textureSide);
        }

        let materials = [materialTop, materialSide];

        var mergedMesh = new THREE.Mesh(mergedGeometries, materials);
        mergedMesh.rotateOnAxis(new THREE.Vector3(1, 0, 0), - Math.PI / 2);
        mergedMesh.updateMatrix();

        mergedMesh.geometry.dispose();
        return mergedMesh;
    }

    mergeBufferGeometries(geometries) {

        const NORMAL_COORDS = 3;
        const UV_COORDS = 2;

        let mergedGeometry = new THREE.BufferGeometry();
        let topNormal = [];
        let sideNormal = [];
        let topPosition = [];
        let sidePosition = [];
        let topUV = [];
        let sideUV = [];

        for (let i = 0; i < geometries.length; ++i) {

            let geometry = geometries[i];
            if (geometry.attributes.normal == null) {
                return;
            }

            let normal = geometry.attributes.normal.array;
            let position = geometry.attributes.position.array;
            let uv = geometry.attributes.uv.array;

            // Iterate through faces - each face has 3 vertices with 3 positions each
            for (let j = 0; j < position.length; j += 9) {

                let z1 = position[j + 2],
                    z2 = position[j + 5],
                    z3 = position[j + 8];

                // If the 3 vertices have the same Z, it's a top/bottom face
                if ((z1 == z2) && (z2 == z3)) {

                    this.setAttributes(j, topPosition, topNormal, topUV,
                        position, normal, uv);

                // If the 3 vertices don't have the same Z, it's a side face
                } else {

                    this.setAttributes(j, sidePosition, sideNormal, sideUV,
                        position, normal, uv);
                }
            }
        }

        let verticesTop = topNormal.length / NORMAL_COORDS;
        let verticesSide = sideNormal.length / NORMAL_COORDS;
        let verticesTotal = (topNormal.length + sideNormal.length) / NORMAL_COORDS;

        // Concatenate top and side arrays
        let normal = new Float32Array(verticesTotal * NORMAL_COORDS);
        normal.set(topNormal);
        normal.set(sideNormal, verticesTop * NORMAL_COORDS);

        let position = new Float32Array(verticesTotal * NORMAL_COORDS);
        position.set(topPosition);
        position.set(sidePosition, verticesTop * NORMAL_COORDS);

        let uv = new Float32Array(verticesTotal * UV_COORDS);
        uv.set(topUV);
        uv.set(sideUV, verticesTop * UV_COORDS);

        mergedGeometry.setAttribute("position", new THREE.BufferAttribute(position, NORMAL_COORDS));
        mergedGeometry.setAttribute("normal", new THREE.BufferAttribute(normal, NORMAL_COORDS));
        mergedGeometry.setAttribute("uv", new THREE.BufferAttribute(uv, UV_COORDS));

        // Top faces get material 0, side faces get material 1
        mergedGeometry.addGroup(0, verticesTop, 0);
        mergedGeometry.addGroup(verticesTop, verticesSide, 1)

        return mergedGeometry;
    }

    // Concats the values of position, normal and uvs to the new respective arrays
    setAttributes(index, curPosition, curNormal, curUV, position, normal, uv) {

        curPosition.push.apply(curPosition, position.slice(index, index + 9));
        curNormal.push.apply(curNormal, normal.slice(index, index + 9));

        // UVs only have 2 coordinates instead of 3
        // so the UV array is 2/3rds the size of the normals/position arrays
        let k = index * 2 / 3;
        curUV.push.apply(curUV, uv.slice(k, k + 6));
    }

    createShape(feature) {

        var shapearray = this.calcVertices(feature);

        var extrudeSettings = {
            depth: feature.properties.depth,
            bevelEnabled: false,
            bevelSegments: 1,
            steps: 1,
            bevelSize: 0,
            bevelThickness: 1
        };

        var shape3D = new THREE.ExtrudeBufferGeometry(shapearray, extrudeSettings);
        shape3D.translate(-this.center.x, -this.center.y, feature.properties.altitude);

        return shape3D;
    }

    calcVertices(feature) {
        var vecs2 = [];
        var vertices = [];

        for (var P of feature.geometry.coordinates) {

            outerP = P;

            if (feature.geometry.type === "MultiPolygon") {
                var outerP = P[0];
            }

            // check if there is outer ring
            if (outerP) {
                var p0 = new THREE.Vector2(outerP[0][0], outerP[0][1]);
                for (let i = 1; i < outerP.length; ++i) {

                    var p1 = new THREE.Vector2(outerP[i][0], outerP[i][1]);
                    vecs2.push(p0, p1);
                    p0 = p1;
                }

                var shape = new THREE.Shape(vecs2)

                // iterate through holes
                for (let i = 1; i < P.length; ++i) {

                    let hole = P[i];
                    let points = [];

                    for (let j = 0; j < hole.length; ++j) {
                        points.push(new THREE.Vector2(hole[j][0], hole[j][1]))
                    }

                    let path = new THREE.Path(points);
                    shape.holes.push(path);
                }

                vertices.push(shape);
                vecs2 = [];
            }
        }

        return vertices;
    }

    loadGeometry(objectPath) {
        return new Promise((resolve) => {
            new THREE.BufferGeometryLoader().load(
                objectPath,

                // onLoad callback
                (geometry) => {
                    resolve(geometry);
                },

                undefined,

                // onError callback
                (err) => {
                    console.log("An error happened", err);
                }
            );
        });
    }

    async loadModel(path, coordinates, type) {

        let loader;

        // Create corresponding loader for this type of file
        if (type == "kmz") {
            loader = new KMZLoader();
        }
        else if (type == "glb") {
            loader = new GLTFLoader();
        }

        let altitude = 0;

        await new Promise(() => {
            loader.load(
                path,

                (model) => {

                    var units = utils.convertCoordinatesToUnits(coordinates[0], coordinates[1]);
                    var targetPosition = new THREE.Vector3(units[0] - this.center.x, altitude, -(units[1] - this.center.y));

                    // Adding 2 levels of detail
                    const lod = new THREE.LOD();
                    lod.addLevel(model.scene, 0);
                    // empty cube 
                    const geometry = new THREE.BoxGeometry(0.01, 0.01, 0.01);
                    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
                    const cube = new THREE.Mesh(geometry, material);
                    lod.addLevel(cube, 1000);
                    lod.position.copy(targetPosition);
                    this.scene.add(lod);

                },

                undefined, // onProgress callback

                (error) => {
                    console.error(error);
                }
            );
        });
    }

    createMaterial(material, texturePath) {

        let texture = new THREE.TextureLoader().load(texturePath);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.flipY = false;
        texture.minFilter = THREE.LinearFilter;

        material.color = null;
        material.map = texture;
        material.map.repeat.set(0.05, 0.2);

    }

}