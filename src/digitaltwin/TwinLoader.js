import * as THREE from "three";
import * as utils from "./utils.js";
import { BufferGeometryUtils } from "./BufferGeometryUtils.js";
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
        }
        if (type == "CLONED") {
            return this.loadLayerMultiGLB(geojson, properties);
        } else {

            for (feature of geo.features) {
                feature.properties = Object.assign({}, properties, feature.properties);
                shape = this.createShape(feature);
                geometries.push(shape);
                shape.dispose();
            }

            //utils.mergeBufferGeometries(geometries);

            return this.mergeGeometries(geometries, properties);
        }
    }

    async loadLayerInstancedMesh(geojson, properties) {

        if (geojson == null || geojson.features == null) return;
        let count = geojson.features.length;

        let geometry;
        if (properties.model) {
            if (properties.model.split('.').pop() == "json") geometry = await this.loadGeometry(properties.model);
        }
        else {
            geometry = new THREE.BoxBufferGeometry(
                properties.width, properties.height, properties.depth
            );
        }

        let material = new THREE.MeshStandardMaterial({
            'color': properties.material.color,
            'polygonOffset': true,
            'polygonOffsetUnits': -1 * offset,
            'polygonOffsetFactor': -1,
        });

        if (properties.material.texture) {
            let text = new THREE.TextureLoader().load(properties.material.texture);
            material.color = null;
            material.map = text;
        }

        let mesh = new THREE.InstancedMesh(geometry, material, count);

        const dummy = new THREE.Object3D();
        for (let i = 1; i < count; i++) {
            let feature = geojson.features[i];
            let coordX = feature.geometry.coordinates[0];
            let coordY = feature.geometry.coordinates[1];
            let coordZ = feature.geometry.coordinates[2] || Math.floor(Math.random() * 5) * (properties.height + 0.2);
            if (properties.model) coordZ = properties.altitude || 0;

            let units = utils.convertCoordinatesToUnits(coordX, coordY);
            dummy.position.set(units[0] - this.center.x, coordZ, -(units[1] - this.center.y));
            dummy.rotation.set(0, Math.PI / 4.5, 0);
            dummy.updateMatrix();
            mesh.setMatrixAt(i++, dummy.matrix);
        }

        mesh.geometry.dispose();
        mesh.material.dispose();
        return mesh;
    }

    async loadLayerMultiGLB(geojson, properties) {

        if (geojson == null || geojson.features == null) return;
        let count = geojson.features.length;

        for (let i = 1; i < count; i++) {
            new GLTFLoader().load(
                properties.model,

                // onLoad callback
                (gltf) => {
                        let feature = geojson.features[i];
                        let coordX = feature.geometry.coordinates[0];
                        let coordY = feature.geometry.coordinates[1];
                        let units = utils.convertCoordinatesToUnits(coordX, coordY);
                        var targetPosition = new THREE.Vector3(units[0] - this.center.x, 3, -(units[1] - this.center.y));

                        // Adding 2 levels of detail
                        const lod = new THREE.LOD();
                        lod.addLevel(gltf.scene, 0);
                        // empty cube 
                        const geometry = new THREE.BoxGeometry(0.01, 0.01, 0.01);
                        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
                        const cube = new THREE.Mesh(geometry, material);
                        lod.addLevel(cube, 380);
                        lod.position.copy(targetPosition);
                        this.scene.add(lod);
                },

                undefined,

                // onError callback
                function (err) {
                    console.log("An error happened", err);
                }
            );
        }

    }


    mergeGeometries(geometries, properties) {
        var mergedGeometries = BufferGeometryUtils.mergeBufferGeometries(geometries, false);
        ++offset;
        
        let material = new THREE.MeshBasicMaterial({
                'color': properties.material.color,
                'polygonOffset': true,
                'polygonOffsetUnits': -1 * offset,
                'polygonOffsetFactor': -1,
        });

        if (properties.material.texture) {
            let text = new THREE.TextureLoader().load(properties.material.texture);
            material.color = null;
            text.wrapS = text.wrapT = THREE.RepeatWrapping;
            text.flipY = false;
            text.minFilter = THREE.LinearFilter;
            material.map = text;
        }

        console.log(material.map)

        var mergedMesh = new THREE.Mesh(mergedGeometries, material);
        mergedMesh.rotateOnAxis(new THREE.Vector3(1, 0, 0), - Math.PI / 2);
        mergedMesh.updateMatrix();

        if (properties.material.texture) {
            this.adjustTextureSideRepeat(mergedMesh, 256);
        }

        mergedMesh.geometry.dispose();
        mergedMesh.material.dispose();

        return mergedMesh;
    }

    adjustTextureSideRepeat(mesh, textureSize) {

        mesh.geometry.computeBoundingBox();
        let max = mesh.geometry.boundingBox.max;
        let min = mesh.geometry.boundingBox.min;

        let height = max.z - min.z;
        let width = max.x - min.x;

        let repeatValX = width / textureSize;
        let repeatValY = height / textureSize;

        if (repeatValX < 0.1) {
            repeatValX *= 10;
        } else if (repeatValX > 0.45) {
            repeatValX /= 2;
        }
        if (repeatValY < 0.1) {
            repeatValY *= 10;
        }

        mesh.material.map.repeat.set(0.05, 0.2);
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
                function (err) {
                    console.log("An error happened", err);
                }
            );
        });
    }

    async loadGLB(object, coordinates) {

        let altitude = 0;

        await new Promise(() => {
            const loader = new GLTFLoader();
            loader.load(
                object,

                (gltf) => {

                    var units = utils.convertCoordinatesToUnits(coordinates[0], coordinates[1]);
                    var targetPosition = new THREE.Vector3(units[0] - this.center.x, altitude, -(units[1] - this.center.y));

                    // Adding 2 levels of detail
                    const lod = new THREE.LOD();
                    lod.addLevel(gltf.scene, 0);
                    // empty cube 
                    const geometry = new THREE.BoxGeometry(0.01, 0.01, 0.01);
                    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
                    const cube = new THREE.Mesh(geometry, material);
                    lod.addLevel(cube, 1000);
                    lod.position.copy(targetPosition);
                    this.scene.add(lod);

                },
                undefined,

                (error) => {
                    console.error(error);
                }
            );
        });
    }

    async loadKMZ(object, coordinates) {

        let altitude = 0;

        await new Promise(() => {
            const loader = new KMZLoader();
            loader.load(
                object,

                (kmz) => {

                    var units = utils.convertCoordinatesToUnits(coordinates[0], coordinates[1]);
                    var targetPosition = new THREE.Vector3(units[0] - this.center.x, altitude, -(units[1] - this.center.y));

                    // Adding 2 levels of detail
                    const lod = new THREE.LOD();
                    lod.addLevel(kmz.scene, 0);
                    // empty cube 
                    const geometry = new THREE.BoxGeometry(0.01, 0.01, 0.01);
                    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
                    const cube = new THREE.Mesh(geometry, material);
                    lod.addLevel(cube, 1000);
                    lod.position.copy(targetPosition);
                    this.scene.add(lod);

                },
                undefined,

                (error) => {
                    console.error(error);
                }
            );
        });
    }

}