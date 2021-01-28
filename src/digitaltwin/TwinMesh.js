import * as THREE from "three";
import * as utils from "./utils.js";
import { BufferGeometryUtils } from "./BufferGeometryUtils.js";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KMZLoader } from 'three/examples/jsm/loaders/KMZLoader.js';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js';
import { OBJLoader2 } from 'three/examples/jsm/loaders/OBJLoader2.js';

export default class TwinMesh extends THREE.Mesh {

    constructor() {
        super();
    }

    //Load Layers
    loadLayer(layerCode, geojson, properties, point, coords) {

        if (geojson == null || geojson.features == null) return;

        var geo = utils.convertGeoJsonToWorldUnits(geojson);
        var shape = null;
        var values = [];
        var feature;

        for (feature of geo.features) {
            feature.layerCode = layerCode;
            feature.properties = Object.assign({}, properties, feature.properties);

            if (point) {
                for (let i = 1; i < feature.length; i++) {
                    let lng = feature[i].geometry.coordinates[0];
                    let lat = feature[i].geometry.coordinates[1];
                    let z_fromGeoJson = feature[i].properties.Z;
                    z_fromGeoJson = z_fromGeoJson * 5;
                    shape = this.createAnotherShape(lng, lat, z_fromGeoJson);
                    values.push(shape.geometry);
                }

            } else {
                shape = this.createShape(feature, coords);
                values.push(shape);
            }

            //if (shape) {
            //this.scene.add(shape);
            //shape.geometry.dispose();
            //}
        }


        return this.mergeGeometries(values, properties.material.color);
    }

    mergeGeometries(geometries) {
        var mergedGeometries = BufferGeometryUtils.mergeBufferGeometries(geometries, false);
        //var material = new THREE.MeshPhongMaterial({ color: color });
        let material = new THREE.MeshBasicMaterial({
            vertexColors: true,
        });
        var mergedMesh = new THREE.Mesh(mergedGeometries, material);
        mergedMesh.rotateOnAxis(new THREE.Vector3(1, 0, 0), - Math.PI / 2);
        mergedMesh.updateMatrix();

        return mergedMesh;
    }

    createShape(feature, coords) {

        var shapearray = this.calcVertices(feature);

        var extrudeSettings = {
            depth: feature.properties.depth,
            bevelEnabled: false,
            bevelSegments: 1,
            steps: 5,
            bevelSize: 0,
            bevelThickness: 1
        };


        var shape3D = new THREE.ExtrudeBufferGeometry(shapearray, extrudeSettings);
        shape3D.translate(-coords.x, -coords.y, feature.properties.altitude);

        //var material = new THREE.MeshPhongMaterial({ color: 0x372596 });

        // compute a color
        let color = new THREE.Color();
        let hue = THREE.MathUtils.lerp(0.7, 0.3, (Math.floor(Math.random() * 100)) / 100);
        let saturation = 1;
        let lightness = THREE.MathUtils.lerp(0.4, 1.0, (Math.floor(Math.random() * 100)) / 100);
        color.setHSL(hue, saturation, lightness);
        // get the colors as an array of values from 0 to 255
        let rgb = color.toArray().map(v => v * 255);

        // make an array to store colors for each vertex
        let numVerts = shape3D.getAttribute('position').count;
        let itemSize = 3;  // r, g, b
        let colors = new Uint8Array(itemSize * numVerts);

        // copy the color into the colors array for each vertex
        colors.forEach((v, ndx) => {
            colors[ndx] = rgb[ndx % 3];
        });

        let normalized = true;
        let colorAttrib = new THREE.BufferAttribute(colors, itemSize, normalized);
        shape3D.setAttribute('color', colorAttrib);



        /*var mesh = new THREE.Mesh(shape3D, material);

        mesh.matrixAutoUpdate = false;
        mesh.receiveShadow = false;
        mesh.rotateOnAxis(new THREE.Vector3(1, 0, 0), - Math.PI / 2);
        mesh.updateMatrix();

        shape3D.dispose();*/

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

        return vertices;
    }

    createAnotherShape(lng, lat, z) {

        var material = new THREE.MeshPhongMaterial({ color: 0x372596 });

        var boxWidth = 6.06;
        var boxHeight = 2.6;
        var boxDepth = 2.44;

        let geometry = new THREE.BoxBufferGeometry(
            boxWidth,
            boxHeight,
            boxDepth
        );

        geometry.position.set(lng, lat, z);
        var mesh = new THREE.Mesh(geometry, material);

        mesh.matrixAutoUpdate = false;
        mesh.receiveShadow = false;
        mesh.rotateOnAxis(new THREE.Vector3(1, 0, 0), - Math.PI / 2);
        mesh.updateMatrix();

        geometry.dispose();

        return mesh;
    }

    /**
     * Adds an object to the scene in the given coordinates, given a path
     * @param {string} modelPath - File path or URL of the object
     * @param {Array} coordinates - Real world coordinates of the object
     * @param {Object} rotation - Rotation of object in the 3 axes e.g. {x:1,y:0,z:0}
     * @param {number} scale - Scale of the object
     * @param {number} altitude - Altitude of the object
     */
    _loadModel(modelPath, coordinates, rotation, scale, altitude, lod_distance) {

        var extensionValue = modelPath.split('.').pop();
        var loader;

        switch (extensionValue) {
            case ("kmz"):
                loader = new KMZLoader();
                break;

            case ("gltf"):
                loader = new GLTFLoader();
                break;

            case ("obj"):
                new OBJLoader2().load(modelPath,

                    (model) => {

                        var units = utils.convertCoordinatesToUnits(coordinates[0], coordinates[1]);
                        var targetPosition = new THREE.Vector3(units[0] - this.centerInMeters[0], altitude || 0, -(units[1] - this.centerInMeters[1]));

                        if (rotation) {
                            model.rotation.x = rotation.x;
                            model.rotation.y = rotation.y;
                            model.rotation.z = rotation.z;
                        }

                        if (scale) {
                            model.scale.copy(new THREE.Vector3(scale, scale, scale));
                        }

                        // Adding 2 levels of detail
                        const lod = new THREE.LOD();
                        lod.addLevel(model.scene, 0);
                        // empty cube 
                        const geometry = new THREE.BoxGeometry(0.01, 0.01, 0.01);
                        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
                        const cube = new THREE.Mesh(geometry, material);
                        if (lod_distance == "low") lod.addLevel(cube, 500);
                        else lod.addLevel(cube, 1500);
                        lod.position.copy(targetPosition);

                        this.scene.add(lod);
                    },

                    undefined,

                    // onError callback
                    (error) => {
                        console.log('Error with model', modelPath);
                        console.log(error);
                    });
                return;

            case ("dae"):
                loader = new ColladaLoader();
                break;

            default:
                break;
        }

        loader.load(
            // resource URL
            modelPath,
            // onLoad callback
            (model) => {

                var units = utils.convertCoordinatesToUnits(coordinates[0], coordinates[1]);
                var targetPosition = new THREE.Vector3(units[0] - this.centerInMeters[0], altitude || 0, -(units[1] - this.centerInMeters[1]));

                if (rotation) {
                    model.rotation.x = rotation.x;
                    model.rotation.y = rotation.y;
                    model.rotation.z = rotation.z;
                }

                if (scale) {
                    model.scene.scale.copy(new THREE.Vector3(scale, scale, scale));
                }

                // Adding 2 levels of detail
                const lod = new THREE.LOD();
                lod.addLevel(model.scene, 0);
                // empty cube 
                const geometry = new THREE.BoxGeometry(0.01, 0.01, 0.01);
                const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
                const cube = new THREE.Mesh(geometry, material);
                if (lod_distance == "low") lod.addLevel(cube, 500);
                else lod.addLevel(cube, 1500);
                lod.position.copy(targetPosition);

                this.scene.add(lod);
            },

            // onProgress callback
            undefined,

            // onError callback
            (error) => {
                console.log('Error with model', modelPath);
                console.log(error);
            }
        );

    }
}