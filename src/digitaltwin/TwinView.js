import * as THREE from "three";
import CameraControls from "camera-controls";
import { MapView } from "./GeoThree/MapView";
import { MapBoxProvider } from "./GeoThree/providers/MapBoxProvider";
import { UnitsUtils } from "./GeoThree/utils/UnitsUtils";
import TwinEvent from "./TwinEvent";
import TwinLoader from './TwinLoader'
import * as utils from "./utils.js"
//import intersect from '@turf/intersect';
//import { multiPolygon } from "@turf/helpers";
//import { bbox } from '@turf/bbox';
//import centroid from "@turf/centroid";
//import { polygon } from "@turf/helpers";


const key = "pk.eyJ1IjoidHJpZWRldGkiLCJhIjoiY2oxM2ZleXFmMDEwNDMzcHBoMWVnc2U4biJ9.jjqefEGgzHcutB1sr0YoGw";

CameraControls.install({ THREE: THREE });
//const far = 3500;

export default class TwinView {

    constructor(canvas, configs) {
        //Keep canvas and configs references
        this.canvas = canvas;
        this.configs = configs;

        //Creation of Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x96CDCD);

        //Init Camera
        this.camera = null;
        this.initCamera();

        //Init Renderer
        this.renderer = null;
        this.initRenderer();

        //Init Lights
        this.light = null;
        this.initLights();

        //Init Camera Controls
        this.controls = null;
        this.initCameraControls();
        this.clock = new THREE.Clock();

        this.fetchEvent = new TwinEvent("fetchTiles");

        // Puxar o mapa da posição original para o centro do mundo (0,0,0)
        this.coords = UnitsUtils.datumsToSpherical(this.configs.initialPosition.lat, this.configs.initialPosition.lng);
        //Init map
        this.map = null;
        this.initMap();

        // Nevoeiro
        //this.scene.fog = new THREE.Fog(0xFFFFFF, far / 3, far / 2);

        //Events
        window.addEventListener('resize', this.onResize.bind(this), false);
        this.animate();

        this.layers = new Map();
        this.tiles = new Map();

        //Loader
        this.loader = new TwinLoader(this.coords, this.scene);
    }

    initCamera() {
        //Creation of Camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            10000
        );
        this.camera.position.set(0, 350, 0);
    }

    initRenderer() {
        //Creation of Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas, antialias: true,
            powerPreference: "high-performance",
            physicallyCorrectLights: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
    }

    storeGeojsonLayer(id, geojson, properties) {

        for (let feature of geojson.features) {
            feature.loaded = false;

            for (let j = 0; j < feature.geometry.coordinates.length; ++j) {
                for (let k = 0; k < feature.geometry.coordinates[j].length; ++k) {
                let coordinates = feature.geometry.coordinates[j][k];
                    for (let i = 0; i < coordinates.length; ++i) {
                        

                        let lon = coordinates[i][0];
                        let lat = coordinates[i][1];
                        let xy = this.coordsToTile(lon, lat, 18);
                        let x = xy[0];
                        let y = xy[1]
            
                        let arrayaux = x + " " + y + " " + id;
            
                        // key: x,y,layer
                        // value: features of that layer and tile
            
                        if (!this.tiles.has(arrayaux)) {
                            this.tiles.set(arrayaux, []);
                        }
            
                        let tile = this.tiles.get(arrayaux);
                        tile.push(feature);
                        this.tiles.set(arrayaux, tile);
                    }
                }
            }
        }

        this.layers.set(id, {
            "geojson": geojson,
            "properties": properties
        });

    }

    initLights() {
        //Lights
        this.light = new THREE.AmbientLight(0xffffff, 0.65);
        this.scene.add(this.light);
    }

    initCameraControls() {
        //Camera Controls
        this.controls = new CameraControls(this.camera, this.renderer.domElement);
        this.controls.verticalDragToForward = true;
        this.controls.dollyToCursor = false;
        //Inclination(Vertical Rotation)
        this.controls.maxPolarAngle = Math.PI / 2.5;
        //Zoom
        this.controls.maxDistance = 350;
    }

    initMap() {
        // Create a map tiles provider object
        var provider = new MapBoxProvider(key, "mapbox/streets-v10", MapBoxProvider.STYLE);

        // Create the map view and add it to your THREE scene
        this.map = new MapView(MapView.PLANAR, provider, this.fetchEvent);

        this.map.position.set(-this.coords.x, 0, this.coords.y);
        this.map.updateMatrixWorld(true);
        this.scene.add(this.map);

        this.onFetchTile((tile) => {
            this.loadTile(tile);
        })
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.render();
    }

    render() {
        const delta = this.clock.getDelta();
        this.controls.update(delta);
        this.renderer.render(this.scene, this.camera);
    }

    incrementalLoading(x, y) {

        if (!this.layers) return;

        for (var [key, value] of this.layers.entries()) {
            let geojson = {
                "type": "FeatureCollection",
                "features": [],
            }
            /*
            for (let j = 0; j < layer.geojson.features.length; ++j) {
                let feature = layer.geojson.features[j];
                let tilePolygon = polygon(tile.geometry.coordinates);
                let featurePolygon = multiPolygon(feature.geometry.coordinates);

                if (intersect(tilePolygon, featurePolygon)) {
                    geojson.features.push(feature);
                    layer.geojson.features.splice(j, 1);
                    --j;
                }
            }
            */

            let first_part_key = x + " " + y;
            let second_part_key = key;
            let key_tiles = first_part_key + " " + second_part_key;

            if (this.tiles.has(key_tiles)) {
                for (let i = 0; i < this.tiles.get(key_tiles).length; i++) {
                    let feature = this.tiles.get(key_tiles)[i];
                    if (!feature.loaded) {

                        geojson.features.push(feature);
                        feature.loaded = true;

                    }
                }
            }

            if (geojson.features.length > 0) {
                console.log("maior q 0")
                let mergedMeshes = this.loader.loadLayer(geojson, value.properties);
                this.scene.add(mergedMeshes);
            }

            /*
            if (geojson.features.length > 0) {
                let mesh = this.loader.loadLayerInstancedMesh(geojson);
                console.log(mesh, "mesh");
                this.scene.add(mesh);
            }
            */
        }

    }

    loadTile(tile) {
        let zoom = tile.zoom;
        let x = tile.x;
        let y = tile.y;
        if (zoom >= 18) {
            // var polygon = this.calcTilePolygon(zoom, x, y);
            this.incrementalLoading(x, y);
        }
    }

    coordsToTile(lon, lat, zoom) {
        let x = Math.floor((lon + 180) / 360 * Math.pow(2, zoom))
        let y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))
        return [x, y];
    }

    calcTilePolygon(zoom, x, y) {
        let topLeft = utils.tileToCoords(zoom, x, y);
        let topRight = utils.tileToCoords(zoom, x + 1, y);
        let bottomLeft = utils.tileToCoords(zoom, x, y + 1);
        let bottomRight = utils.tileToCoords(zoom, x + 1, y + 1);

        let geojson = {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[bottomLeft, bottomRight, topRight, topLeft, bottomLeft]]
            },
            "properties": {}
        }

        return geojson;
    }
    dispatch(eventName, data) {
        const event = this.events[eventName];
        if (event) {
            event.fire(data);
        }
    }

    onFetchTile(callback) {
        this.fetchEvent.registerCallback(callback);
    }

}