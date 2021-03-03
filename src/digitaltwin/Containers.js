import TwinDynamicObjects from "./TwinDynamicObjects";
import * as THREE from "three";
import * as utils from "./utils.js";

const CONTAINER_WIDTH = 6.06;
const CONTAINER_HEIGHT = 2.4;
const CONTAINER_DEPTH = 2.44;

// TODO - Receive coordinates on initial loading
const parkCoords = new Map();
parkCoords.set("TCN", [-8.701707154760918, 41.185679385734204]);
parkCoords.set("TCS", [-8.684494412026263, 41.19254609010651]);

export default class Containers {

    constructor(coords, scene) {
        this.coords = coords;
        this.scene = scene;
    }

    initContainers(companyName, parkName) {

        let geometry = new THREE.BoxBufferGeometry(
            CONTAINER_WIDTH, CONTAINER_HEIGHT, CONTAINER_DEPTH
        );

        let textBack = new THREE.TextureLoader().load("./containerTextures/back" + companyName + ".jpg");
        let textDoor = new THREE.TextureLoader().load("./containerTextures/door" + companyName + ".jpg");
        let textUp = new THREE.TextureLoader().load("./containerTextures/up" + companyName + ".jpg");
        let textSide = new THREE.TextureLoader().load("./containerTextures/side" + companyName + ".jpg");

        let material = [
            new THREE.MeshBasicMaterial({
                'map': textBack,
                'polygonOffset': true,
                'polygonOffsetUnits': -1,
                'polygonOffsetFactor': -1,
            }),
            new THREE.MeshBasicMaterial({
                'map': textDoor,
                'polygonOffset': true,
                'polygonOffsetUnits': -1,
                'polygonOffsetFactor': -1,
            }),
            new THREE.MeshBasicMaterial({
                'map': textUp,
                'polygonOffset': true,
                'polygonOffsetUnits': -1,
                'polygonOffsetFactor': -1,
            }),
            new THREE.MeshBasicMaterial({
                'map': textUp,
                'polygonOffset': true,
                'polygonOffsetUnits': -1,
                'polygonOffsetFactor': -1,
            }),
            new THREE.MeshBasicMaterial({
                'map': textSide,
                'polygonOffset': true,
                'polygonOffsetUnits': -1,
                'polygonOffsetFactor': -1,
            }),
            new THREE.MeshBasicMaterial({
                'map': textSide,
                'polygonOffset': true,
                'polygonOffsetUnits': -1,
                'polygonOffsetFactor': -1,
            }),
        ];

        let count = 5000;

        let instancedMesh = new TwinDynamicObjects(geometry, material, count, this.coords);

        // Adding 2 levels of detail
        const lod = new THREE.LOD();
        lod.addLevel(instancedMesh, 0);
        // empty cube 
        const cubeGeometry = new THREE.BoxGeometry(0.01, 0.01, 0.01);
        const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

        // Obtain coordinates of respective park
        let coords = parkCoords.get(parkName);
        let units = utils.convertCoordinatesToUnits(coords[0], coords[1]);
        var targetPosition = new THREE.Vector3(units[0] - this.coords.x, 3, -(units[1] - this.coords.y));

        lod.addLevel(cube, 1200);
        lod.position.copy(targetPosition);
        this.scene.add(lod);
        return instancedMesh;
    }

}
