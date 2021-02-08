import * as THREE from "three";
import * as utils from "./utils.js";
import { BufferGeometryUtils } from "./BufferGeometryUtils.js";

var offset = 0;

export default class TwinLoader {

    constructor(center, scene) {
        this.center = center; // in meters
        this.scene = scene;
    }

    //Load Layers
    loadLayer(geojson, properties, geojsonType) {
        if (geojson == null || geojson.features == null) return;

        var geo = utils.convertGeoJsonToWorldUnits(geojson);
        var shape = null;
        var geometries = [];
        var feature;

        if (geojsonType == "Point") {
            return this.loadLayerInstancedMesh(geojson, properties);
        } else {

            for (feature of geo.features) {
                feature.properties = Object.assign({}, properties, feature.properties);
                shape = this.createShape(feature);
                geometries.push(shape);
                shape.dispose();
            }

            return this.mergeGeometries(geometries, properties);
        }
    }

    async loadLayerInstancedMesh(geojson, properties) {
        if (geojson == null || geojson.features == null) return;

        let count = geojson.features.length;

        const geometry = await this.loadGeometry(properties.model);
        let material = new THREE.MeshBasicMaterial({
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
            let units = utils.convertCoordinatesToUnits(coordX, coordY);
            dummy.position.set(units[0] - this.center.x, 0, -(units[1] - this.center.y));
            dummy.updateMatrix();
            mesh.setMatrixAt(i++, dummy.matrix);
        }

        mesh.geometry.dispose();
        mesh.material.dispose();
        return mesh;
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
            text.wrapS = THREE.RepeatWrapping;
            text.wrapT = THREE.RepeatWrapping;
            text.flipY = false;
            material.map = text;
        }

        var mergedMesh = new THREE.Mesh(mergedGeometries, material);
        mergedMesh.rotateOnAxis(new THREE.Vector3(1, 0, 0), - Math.PI / 2);
        mergedMesh.updateMatrix();

        if (properties.material.texture) this.adjustTextureSideRepeat(mergedMesh, 256);

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
        console.log(repeatValX, repeatValY);

        /*
        if (repeatValX < 0.1) {
            repeatValX *= 10;
        } else if (repeatValX > 0.45) {
            repeatValX /= 2;
        }
        if (repeatValY < 0.1) {
            repeatValY *= 10;
        }
        */

        mesh.material.map.repeat.set(0.2, 0.2);
    }

    createShape(feature) {

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

}