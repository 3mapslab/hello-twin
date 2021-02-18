import * as THREE from "three";
import * as utils from "./utils.js"

export default class TwinContainers extends THREE.InstancedMesh {
    
    constructor(geometry, material, count, worldCenter) {
        super(geometry, material, count);

        this.center = worldCenter;
        this.containers = new Map();
    }
    
    addContainer(container) {

        this.containers.set(container.code, container);
        let lon = container.geometry.coordinates[0];
        let lat = container.geometry.coordinates[1];
        let units = utils.convertCoordinatesToUnits(lon, lat);

        const dummy = new THREE.Object3D();
        dummy.position.set(
            units[0] - this.center.x,
            10,
            -(units[1] - this.center.y)
        );

        dummy.rotation.set(0, Math.PI / 4.5, 0);
        dummy.updateMatrix();
        this.setMatrixAt(this.containers.size, dummy.matrix);

        this.instanceMatrix.needsUpdate = true;
    }

    removeContainer(container) {
        console.log(container)
        // find container in containers[], then
        // move it outside view ?
        // OR shift back the positions of containers added after it
    }

}