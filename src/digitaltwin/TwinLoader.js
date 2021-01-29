import * as THREE from "three";
import * as utils from "./utils.js";
import { BufferGeometryUtils } from "./BufferGeometryUtils.js";

var offset = 0;

export default class TwinLoader {

    constructor(center) {
        this.center = center; // in meters
    }

//Load Layers
loadLayer(geojson, properties) {

    if (geojson == null || geojson.features == null) return;

    var geo = utils.convertGeoJsonToWorldUnits(geojson);
    var shape = null;
    var geometries = [];
    var feature;

    for (feature of geo.features) {
        feature.properties = Object.assign({}, properties, feature.properties);
        shape = this.createShape(feature);
        geometries.push(shape);
    }

    return this.mergeGeometries(geometries);
}

mergeGeometries(geometries) {
    var mergedGeometries = BufferGeometryUtils.mergeBufferGeometries(geometries, false);
    //var material = new THREE.MeshPhongMaterial({ color: color });
    ++offset;
    let material = new THREE.MeshBasicMaterial({
        vertexColors: true,
        polygonOffset: true,
        polygonOffsetUnits: -1*offset,
        polygonOffsetFactor: -1,
    });
    var mergedMesh = new THREE.Mesh(mergedGeometries, material);
    mergedMesh.rotateOnAxis(new THREE.Vector3(1, 0, 0), - Math.PI / 2);
    mergedMesh.updateMatrix();

    return mergedMesh;
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

}