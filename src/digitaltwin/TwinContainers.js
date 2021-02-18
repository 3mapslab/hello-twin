import * as THREE from "three";
import * as utils from "./utils.js"

export default class TwinContainers extends THREE.InstancedMesh {
    
    constructor(geometry, material, count) {
        super(geometry, material, count);

        this.containers = [];
        this.lastIndex = 0; // Increment whenever a container is added
    }
    
    addContainer(container) {

        this.containers.push(container);
        let lon = container.geometry.coordinates[0];
        let lat = container.geometry.coordinates[1];
        let units = utils.convertCoordinatesToUnits(lon, lat);

        const dummy = new THREE.Object3D();
        dummy.position.set(
            units[0] - this.center.x,
            container.level*container.height,
            -(units[1] - this.center.y)
        );

        dummy.rotation.set(0, Math.PI / 4.5, 0);
        this.setMatrixAt(lastIndex++, dummy.matrix);
    }

    removeContainer(container) {

        // find container in containers[], then
        // move it outside view ?
        // OR shift back the positions of containers added after it
    }

}