import * as THREE from "three";
import CameraControls from "camera-controls";
import { MapView } from "./GeoThree/MapView";
import { MapBoxProvider } from "./GeoThree/providers/MapBoxProvider";
import { UnitsUtils } from "./GeoThree/utils/UnitsUtils";
import geojsonvt from 'geojson-vt';

const key = "pk.eyJ1IjoidHJpZWRldGkiLCJhIjoiY2oxM2ZleXFmMDEwNDMzcHBoMWVnc2U4biJ9.jjqefEGgzHcutB1sr0YoGw";

CameraControls.install({ THREE: THREE });

export default class TwinView {

    constructor(canvas, configs) {
        //Keep canvas and configs references
        this.canvas = canvas;
        this.configs = configs;

        //Creation of Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x96CDCD);

        //Creation of Camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            10000
        );
        this.camera.position.set(0, 350, 0);

        //Creation of Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas, antialias: true,
            powerPreference: "high-performance",
            physicallyCorrectLights: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        //Lights
        this.light = new THREE.AmbientLight(0xffffff, 0.65);
        this.scene.add(this.light);

        //Camera Controls
        this.controls = new CameraControls(this.camera, this.renderer.domElement);
        this.controls.verticalDragToForward = true;
        this.controls.dollyToCursor = false;
        this.clock = new THREE.Clock();

        // Create a map tiles provider object
        var provider = new MapBoxProvider(key, "mapbox/streets-v10", MapBoxProvider.STYLE);

        // Create the map view and add it to your THREE scene
        this.map = new MapView(MapView.PLANAR, provider);
        // Puxar o mapa da posição original para o centro do mundo (0,0,0)
        var coords = UnitsUtils.datumsToSpherical(this.configs.initialPosition.lat, this.configs.initialPosition.lng);
        this.map.position.set(-coords.x, 0, coords.y);
        this.map.updateMatrixWorld(true);
        this.scene.add(this.map);

        //Events
        window.addEventListener('resize', this.onResize.bind(this), false);

        this.animate();
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