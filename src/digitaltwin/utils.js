import { reproject } from "reproject";
import proj4 from "proj4";

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