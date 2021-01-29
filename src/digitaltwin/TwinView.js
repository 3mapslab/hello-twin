import * as THREE from "three";
import CameraControls from "camera-controls";
import { MapView } from "./GeoThree/MapView";
import { MapBoxProvider } from "./GeoThree/providers/MapBoxProvider";
import { UnitsUtils } from "./GeoThree/utils/UnitsUtils";
import TwinMesh from "./TwinMesh";
import TwinEvent from "./TwinEvent";
import * as utils from "./utils.js"
import intersect from '@turf/intersect';
import { polygon, multiPolygon } from "@turf/helpers";

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

        this.layers = [];
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

    loadLayerToScene(layerCode, geojson, properties, point) {
        this.layers.push( {
            "geojson": geojson,
            "properties": properties,
            "layerCode": layerCode,
            "point": point
        });
        
        //let twinMesh = new TwinMesh();
        //let mergedMeshes = twinMesh.loadLayer(layerCode, geojson, properties, point, this.coords);
        //this.scene.add(mergedMeshes);
        
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

    incrementalLoading(tile) {
        console.log(tile)
        
        if (! this.layers) return;

        for (let i = 0; i < this.layers.length; ++i) {
            let layer = this.layers[i];
            for (let j = 0; j < layer.geojson.features.length; ++j) {
                let feature = layer.geojson.features[j]
                let tilePolygon = polygon(tile.geometry.coordinates);
                let featurePolygon = multiPolygon(feature.geometry.coordinates);
                
                if (intersect(tilePolygon, featurePolygon)) {
                    let geojson = {
                        "type": "FeatureCollection",
                        "features": [feature],
                    }
                    this.loadLayerToScene(
                        null,
                        geojson,
                        layer.properties,
                        false
                    );

                    layer.geojson.features.splice(j,1);
                    --j;

                    let twinMesh = new TwinMesh();
                    let mergedMeshes = twinMesh.loadLayer(layer.layerCode, geojson, layer.properties, layer.point, this.coords);
                    this.scene.add(mergedMeshes);
                }
            } 
        }
        
    }

    loadTile(tile) {
        let zoom = tile.zoom;
        let x = tile.x;
        let y = tile.y;
        var polygon = this.calcTilePolygon(zoom, x, y);
        this.incrementalLoading(polygon);
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