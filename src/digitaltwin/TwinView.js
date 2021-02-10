import * as THREE from "three";
import CameraControls from "camera-controls";
import { MapView } from "./GeoThree/MapView";
import { MapBoxProvider } from "./GeoThree/providers/MapBoxProvider";
import { UnitsUtils } from "./GeoThree/utils/UnitsUtils";
import TwinEvent from "./TwinEvent";
import TwinLoader from './TwinLoader'
import * as utils from "./utils.js"
import { point } from "@turf/helpers"
import * as turf from "@turf/turf"

const key = "pk.eyJ1IjoidHJpZWRldGkiLCJhIjoiY2oxM2ZleXFmMDEwNDMzcHBoMWVnc2U4biJ9.jjqefEGgzHcutB1sr0YoGw";
const tileLevel = 18;
const removeDistance = 1000;
const far = 2500;

CameraControls.install({ THREE: THREE });

export default class TwinView {

    constructor(canvas, configs, layerProps) {
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
        this.scene.fog = new THREE.Fog(0xFFFFFF, far / 3, far / 2);

        //Events
        window.addEventListener('resize', this.onResize.bind(this), false);
        this.animate();

        //Loader
        this.loader = new TwinLoader(this.coords, this.scene);

        this.tiles = new Map();

        this.layers = layerProps;
    }

    initCamera() {
        //Creation of Camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            10000
        );
        this.camera.position.set(0, 250, 0);
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
        this.controls.maxPolarAngle = Math.PI / 3.2;
        this.controls.minPolarAngle = Math.PI / 4.5;
        this.controls.polarAngle = Math.PI / 4.5;
        //Zoom
        this.controls.maxDistance = 250;
        this.controls.minDistance = 0;

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
        this.renderer.renderLists.dispose();
    }

    render() {
        const delta = this.clock.getDelta();
        this.controls.update(delta);
        this.renderer.render(this.scene, this.camera);
    }



    // Loads meshes contained in tile x,y,z and proceeds to delete distant meshes
    // Meshes are stored in a map indexed by tile
    async loadTile(tile) {

        let x = tile.x;
        let y = tile.y;
        if (tile.zoom != tileLevel) {
            return;
        }

        for (let i = 0; i < this.layers.length; ++i) {

            let url = `http://localhost:8123/${this.layers[i].url}/${tileLevel}/${x}/${y}.geojson`

            await fetch(url)
                .then((response) => {
                    return response.json();
                })
                .then(async (geojson) => {

                    if (!geojson || !geojson.features || geojson.features.length == 0) {
                        return;
                    }

                    let geojsonType = turf.getType(geojson.features[0]);
                    let mesh = await this.loader.loadLayer(geojson, this.layers[i].properties, geojsonType);
                    this.scene.add(mesh);
                    this.storeMesh(mesh,x,y);
                    mesh.geometry.dispose();
                    mesh.material.dispose();
                });
        }

        this.removeFarawayTiles(x, y);
    }

    removeFarawayTiles(x, y) {
        let lon = utils.tile2long(x, tileLevel);
        let lat = utils.tile2lat(y, tileLevel);

        let center = point([lon, lat]);
        let buffered = turf.buffer(center, removeDistance, { units: 'meters' });

        for (let [key, value] of this.tiles.entries()) {

            let x2 = key.split(",")[0];
            let y2 = key.split(",")[1];
            let lon2 = utils.tile2long(x2,tileLevel);
            let lat2 = utils.tile2lat(y2, tileLevel);
            let point = turf.point([lon2, lat2])
            let poly = turf.polygon(buffered.geometry.coordinates);

            if (!turf.booleanPointInPolygon(point, poly)) {
                for (let i = 0; i < value.length; ++i) {
                    value[i].geometry.dispose();
                    value[i].material.dispose();
                    this.scene.remove(value[i]);
                }
                this.tiles.set(key, []);
                this.map.childrenClear(x2, y2);
            }
        }
    }

    storeMesh(mesh, x, y) {

        let key = x + "," + y;
        if (!this.tiles.has(key)) {
            this.tiles.set(key, [mesh]);

        } else {
            let tile = this.tiles.get(key);
            tile.push(mesh);
            this.tiles.set(key, tile);
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

    loadSingleObject(objectPath, coordinates) {
        this.loader.loadGLB(objectPath, coordinates);
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