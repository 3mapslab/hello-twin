import { reproject } from "reproject";
import proj4 from "proj4";
import * as THREE from "three"
import { BufferGeometryUtils } from "./BufferGeometryUtils.js";


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
    let attributesUsed = new Set(Object.keys(geometries[0].attributes));
    let attributes = {};
    let topNormal = [];
    let sideNormal = [];
    let topPosition = [];
    let sidePosition = [];
    let topUV = [];
    let sideUV = [];

    for (let i = 0; i < geometries.length; ++i ) {
        let geometry = geometries[ i ];

        for (let name in geometry.attributes ) {
            if (!attributesUsed.has(name)) {
                console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed with geometry at index ' + i + '. All geometries must have compatible attributes; make sure "' + name + '" attribute exists among all geometries, or in none of them.' );
                return null;
            }

            if ( attributes[name] === undefined ) {
                attributes[name] = [];
            }

            attributes[name].push(geometry.attributes[name]);

        }

        // iterate through normals and check if horizontal or vertical
        if(geometry.attributes.normal) {

            let normal = geometry.attributes.normal.array;
            let position = geometry.attributes.position.array;
            let uv = geometry.attributes.uv.array;

            for(let j = 0; j < normal.length; j+=3) {

                // vertex is in a face perpendicular to terrain
                if(normal[j+1] == 0) {
                    sideNormal.push([normal[j], normal[j+1], normal[j+2]])
                    sidePosition.push([position[j], position[j+1], position[j+2]])
                    sideUV.push([uv[j], uv[j+1], uv[j+2]])

                // face is parallel to terrain
                } else {
                    topNormal.push([normal[j], normal[j+1], normal[j+2]])
                    topPosition.push([position[j], position[j+1], position[j+2]])
                    topUV.push([uv[j], uv[j+1], uv[j+2]])
                }
            }
        }
    }

    let normal = topNormal.concat(sideNormal)
    let position = topPosition.concat(sidePosition)
    let uv = topUV.concat(sideUV)

    attributes.normal.array = normal;
    attributes.position.array = position;
    attributes.uv.array = uv;

    
    for ( var name in attributes ) {
        var mergedAttribute =
            BufferGeometryUtils.mergeBufferAttributes( attributes[ name ] );

        if ( ! mergedAttribute ) {
            console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed while trying to merge the ' + name + ' attribute.' );
            return null;
        }

        mergedGeometry.setAttribute( name, mergedAttribute );

    }
    
    return mergedGeometry;
}
