import { reproject } from "reproject";
import proj4 from "proj4";
import * as THREE from "three"
//import { BufferGeometryUtils } from "./BufferGeometryUtils.js";


export function convertGeoJsonToWorldUnits(geojson) {
    return reproject(geojson, proj4.WGS84, proj4('EPSG:3785'));
}

export function convertCoordinatesToUnits(lng, lat) {
    return proj4('EPSG:3857', [lng, lat]);
}

export function tileToCoords(zoom, x, y) {
    let lon = x / Math.pow(2, zoom) * 360 - 180;
    let lat_rad = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / Math.pow(2, zoom))));
    let lat = lat_rad * (180 / Math.PI);
    return [lon, lat];
}

export function tile2long(x, z) {
    return (x / Math.pow(2, z) * 360 - 180);
}

export function tile2lat(y, z) {
    var n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
    return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
}


export function mergeBufferGeometries(geometries) {

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

            let z1 = position[j + 2], z2 = position[j + 5], z3 = position[j + 8];

            // Top and bottom faces
            if ((z1 == z2) && (z2 == z3)) {
                topPosition.push(position[j], position[j + 1], position[j + 2],
                    position[j + 3], position[j + 4], position[j + 5],
                    position[j + 6], position[j + 7], position[j + 8]
                );

                topNormal.push(normal[j], normal[j + 1], normal[j + 2],
                    normal[j + 3], normal[j + 4], normal[j + 5],
                    normal[j + 6], normal[j + 7], normal[j + 8]);

                topUV.push(uv[j], uv[j + 1], uv[j + 2],
                    uv[j + 3], uv[j + 4], uv[j + 5]);

            // Side faces
            } else {
                sidePosition.push(position[j], position[j + 1], position[j + 2],
                    position[j + 3], position[j + 4], position[j + 5],
                    position[j + 6], position[j + 7], position[j + 8]
                );

                sideNormal.push(normal[j], normal[j + 1], normal[j + 2],
                    normal[j + 3], normal[j + 4], normal[j + 5],
                    normal[j + 6], normal[j + 7], normal[j + 8]);

                sideUV.push(uv[j], uv[j + 1], uv[j + 2],
                    uv[j + 3], uv[j + 4], uv[j + 5]);
            }
        }
    }

    let verticesTop = topNormal.length / 3;
    let verticesTotal = (topNormal.length + sideNormal.length)/3;

    let normal = new Float32Array(verticesTotal*3);
    normal.set(topNormal);
    normal.set(sideNormal, verticesTop*3);

    let position = new Float32Array(verticesTotal*3);
    position.set(topPosition);
    position.set(sidePosition, verticesTop*3);

    let uv = new Float32Array(verticesTotal*2);
    uv.set(topUV);
    uv.set(sideUV, verticesTop*2);

    mergedGeometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
    mergedGeometry.setAttribute("normal", new THREE.BufferAttribute(normal, 3));
    mergedGeometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));

    // Top faces get material 0, side faces get material 1
    mergedGeometry.addGroup(0, verticesTop, 0);
    mergedGeometry.addGroup(verticesTop, sideNormal.length/3, 1)

    return mergedGeometry;
}
