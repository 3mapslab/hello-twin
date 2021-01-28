import * as THREE from "three";
import CameraControls from "camera-controls";
import { MapView } from "./GeoThree/MapView";
import { MapBoxProvider } from "./GeoThree/providers/MapBoxProvider";
import { UnitsUtils } from "./GeoThree/utils/UnitsUtils";
import TwinMesh from "./TwinMesh";
import geojsonvt from 'geojson-vt';

const key = "pk.eyJ1IjoidHJpZWRldGkiLCJhIjoiY2oxM2ZleXFmMDEwNDMzcHBoMWVnc2U4biJ9.jjqefEGgzHcutB1sr0YoGw";

CameraControls.install({ THREE: THREE });
const far = 3500;

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

        // Puxar o mapa da posição original para o centro do mundo (0,0,0)
        this.coords = UnitsUtils.datumsToSpherical(this.configs.initialPosition.lat, this.configs.initialPosition.lng);
        //Init map
        this.map = null;
        this.initMap();

        // Nevoeiro
        this.scene.fog = new THREE.Fog(0xFFFFFF, far/3, far/2);

        //Events
        window.addEventListener('resize', this.onResize.bind(this), false);

        this.animate();
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

    loadLayerToScene(layerCode, geojson, properties, point){
        let twinMesh = new TwinMesh();
        let mergedMeshes = twinMesh.loadLayer(layerCode, geojson, properties, point, this.coords);
        this.scene.add(mergedMeshes);
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
    }

    initMap() {
        // Create a map tiles provider object
        var provider = new MapBoxProvider(key, "mapbox/streets-v10", MapBoxProvider.STYLE);

        // Create the map view and add it to your THREE scene
        this.map = new MapView(MapView.PLANAR, provider);

        this.map.position.set(-this.coords.x, 0, this.coords.y);
        this.map.updateMatrixWorld(true);
        this.scene.add(this.map);
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

    geojsonVT() {

        fetch("bollards.geo.json")
            .then((res) => res.json())
            .then((out) => {
                // build an initial index of tiles
                var tileIndex = geojsonvt(out, {
                    maxZoom: 24,  // max zoom to preserve detail on; can't be higher than 24
                    tolerance: 3, // simplification tolerance (higher means simpler)
                    extent: 4096, // tile extent (both width and height)
                    buffer: 64,   // tile buffer on each side
                    debug: 0,     // logging level (0 to disable, 1 or 2)
                    lineMetrics: false, // whether to enable line metrics tracking for LineString/MultiLineString features
                    promoteId: null,    // name of a feature property to promote to feature.id. Cannot be used with `generateId`
                    generateId: false,  // whether to generate feature ids. Cannot be used with `promoteId`
                    indexMaxZoom: 20,       // max zoom in the initial tile index
                    indexMaxPoints: 100 // max number of points per tile in the index
                });
                console.log(tileIndex);

                // request a particular tile
                //var features = tileIndex.getTile(3, 0, 1).features;
                //console.log(features);

                // show an array of tile coordinates created so far
                console.log(tileIndex.tileCoords); // [{z: 0, x: 0, y: 0}, ...]
            })
            .catch((err) => {
                console.log(err);
            });

    }

}