import TwinDynamicObjects from "./TwinDynamicObjects";
import * as THREE from "three";
import * as utils from "./utils.js";
import SocketServiceHelper from "../helpers/realtime/socketservicehelper";

const CONTAINER_WIDTH = 6.06;
const CONTAINER_HEIGHT = 2.4;
const CONTAINER_DEPTH = 2.44;

// TODO - Receive coordinates on initial loading
const parkCoords = new Map();
parkCoords.set("TCN", [-8.701707154760918, 41.185679385734204]);
parkCoords.set("TCS", [-8.684494412026263, 41.19254609010651]);

//The channels to subscribe for realtime updates
const CONTAINERS_CHANNEL = "containers";

// TODO - Connection to tos-simulator happens twice
var alreadyLoadedInitialCells = false;

export default class Containers {

    constructor(coords, scene) {
        this.coords = coords;
        this.scene = scene;
        this.constructContainers();
        this.activateSockets();
    }

    // TODO - Improve hard-coded lines
    constructContainers() {

        this.containers = new Map();
        let containersTCN = new Map();
        this.containers.set("TCN", containersTCN);
        let containersTCS = new Map();
        this.containers.set("TCS", containersTCS);

        for (let [name, park] of this.containers.entries()) {
            park.set("EVERGREEN", this.initContainers("evergreen", name));
            park.set("apl", this.initContainers("apl", name));
            park.set("msc", this.initContainers("msc", name));
            park.set("uniglory", this.initContainers("uniglory", name));
            park.set("Hamburg Sud", this.initContainers("hamburg", name));
            park.set("hapag", this.initContainers("hapag", name));
            park.set("hanjin", this.initContainers("hanjin", name));
            park.set("ttc", this.initContainers("ttc", name));
            park.set("maersk", this.initContainers("maersk", name));
            park.set("one", this.initContainers("one", name));
            park.set("maersknew", this.initContainers("maersknew", name));
            park.forEach((company) => {
                this.scene.add(company);
            });
        }
    }

    activateSockets() {
        SocketServiceHelper.initialize();

        let that = this;

        SocketServiceHelper._connection.on(CONTAINERS_CHANNEL, (message) => {
            if (message.operation == "INITIAL_CELLS" && alreadyLoadedInitialCells == false) {

                alreadyLoadedInitialCells = true;
                let data = {};
                for (let i = 0; i < message.occupiedCells.length; i++) {
                    let cell = message.occupiedCells[i];
                    let parkName = cell.code.split("-")[0];

                    for (let j = 0; j < cell.containers.length; j++) {
                        data.code = cell.containers[j].info.code;
                        data.operator = cell.containers[j].info.operator;
                        data.level = cell.containers[j].level;
                        data.height = cell.containers[j].height;
                        data.geometry = cell.geometry;
                        let park = that.containers.get(parkName);
                        park.get(data.operator).addObject(data);
                        data = {};
                    }
                }
            }
            else if (message.operation == "ADD") {
                let parkName = message.cell.split("-")[0];
                let company = message.operator;
                let park = that.containers.get(parkName);
                park.get(company).addObject(message);
            }
            else if (message.operation == "REMOVE") {
                let parkName = message.cell.split("-")[0];
                let company = message.operator;
                let park = that.containers.get(parkName);
                park.get(company).removeObject(message);
            }

        });
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
