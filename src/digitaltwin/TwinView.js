import * as THREE from "three";
import CameraControls from "camera-controls";
import Containers from "./Containers";
import { MapView } from "./GeoThree/MapView";
import { MapBoxProvider } from "./GeoThree/providers/MapBoxProvider";
import { UnitsUtils } from "./GeoThree/utils/UnitsUtils";
import TwinEvent from "./TwinEvent";
import TwinLoader from './TwinLoader';
import * as utils from "./utils.js";
import { point } from "@turf/helpers";
import * as turf from "@turf/turf";
import { TilesRenderer } from './3DTilesRendererJS/three/TilesRenderer';


const tileSetURL = "https://raw.githubusercontent.com/NASA-AMMOS/3DTilesRendererJS/master/example/data/tileset.json";
const KEY = "pk.eyJ1IjoidHJpZWRldGkiLCJhIjoiY2oxM2ZleXFmMDEwNDMzcHBoMWVnc2U4biJ9.jjqefEGgzHcutB1sr0YoGw";
const TILE_LEVEL = 18;
const REMOVE_DISTANCE = 1000;
const FAR = 2500;

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
        this.url = this.configs.url;
        //Init map
        this.map = null;
        this.initMap();

        this.init3DTiles();

        //Fog
        this.scene.fog = new THREE.Fog(0xFFFFFF, FAR / 3, FAR / 2);

        //Events
        window.addEventListener('resize', this.onResize.bind(this), false);
        this.animate();

        //Loader
        this.loader = new TwinLoader(this.coords, this.scene);

        this.tiles = new Map();

        this.layers = layerProps;

        this.containers = new Containers(this.coords, this.scene);

        
    }

    init3DTiles() {
        this.tilesRenderer = new TilesRenderer( tileSetURL );
        this.tilesRenderer.setCamera( this.camera );
        this.tilesRenderer.setResolutionFromRenderer( this.camera, this.renderer );
        this.scene.add( this.tilesRenderer.group );
        console.log(this.tilesRenderer);
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
        var provider = new MapBoxProvider(KEY, "mapbox/streets-v10", MapBoxProvider.STYLE);

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
        this.tilesRenderer.update();
        this.camera.updateMatrixWorld();
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
        if (tile.zoom != TILE_LEVEL) {
            return;
        }

        for (let i = 0; i < this.layers.length; ++i) {

            // Layers with many objects
            let url = `${this.url}${this.layers[i].url}/${TILE_LEVEL}/${x}/${y}.geojson`;

            await fetch(url)
                .then((response) => {
                    return response.json();
                })
                .then(async (geojson) => {

                    if (!geojson || !geojson.features || geojson.features.length == 0) {
                        return;
                    }

                    let mesh;

                    if (this.layers[i].type == "GLTF" || this.layers[i].type == "KMZ") {
                        mesh = this.loadSingleObject(this.layers[i]);
                        this.scene.add(mesh);
                        this.storeMesh(mesh, x, y);

                    } else if (this.layers[i].type == "CLONED") {
                        this.loader.loadLayer(geojson, this.layers[i].properties, this.layers[i].type);

                    } else {
                        mesh = await this.loader.loadLayer(geojson, this.layers[i].properties, this.layers[i].type);
                        this.scene.add(mesh);
                        this.storeMesh(mesh, x, y);
                    }
                })
                .catch((error) => console.log(error))

        }

        this.removeFARawayTiles(x, y);
    }

    // Removes meshes on tiles that are 1km away
    removeFARawayTiles(x, y) {
        let lon = utils.tile2long(x, TILE_LEVEL);
        let lat = utils.tile2lat(y, TILE_LEVEL);

        let center = point([lon, lat]);
        let buffered = turf.buffer(center, REMOVE_DISTANCE, { units: 'meters' });

        for (let [KEY, value] of this.tiles.entries()) {

            let currentX = KEY.split(",")[0];
            let currentY = KEY.split(",")[1];
            let currentLon = utils.tile2long(currentX, TILE_LEVEL);
            let currentLat = utils.tile2lat(currentY, TILE_LEVEL);
            let point = turf.point([currentLon, currentLat])
            let poly = turf.polygon(buffered.geometry.coordinates);

            if (!turf.booleanPointInPolygon(point, poly)) {
                for (let i = 0; i < value.length; ++i) {
                    this.scene.remove(value[i]);
                }
                this.tiles.set(KEY, []);
                this.map.childrenClear(currentX, currentY);
            }
        }
    }

    storeMesh(mesh, x, y) {

        let KEY = x + "," + y;
        if (!this.tiles.has(KEY)) {
            this.tiles.set(KEY, [mesh]);

        } else {
            let tile = this.tiles.get(KEY);
            tile.push(mesh);
            this.tiles.set(KEY, tile);
        }
    }

    loadSingleObject(objectInfo, coordinates) {
        let type = objectInfo.split('.').pop();
        if (type == "glb" || type == "kmz") {
            this.loader.loadModel(objectInfo, coordinates, objectInfo.split('.').pop());
        }
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