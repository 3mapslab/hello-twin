import * as THREE from "three";
import * as utils from "./utils.js"

export default class TwinContainers extends THREE.InstancedMesh {

    constructor(geometry, material, count, worldCenter) {
        super(geometry, material, count);

        this.center = worldCenter;
        this.containers = new Map();
    }

    addContainer(container) {
        container.index = this.containers.size;
        let lon = container.geometry.coordinates[0];
        let lat = container.geometry.coordinates[1];
        let units = utils.convertCoordinatesToUnits(lon, lat);

        const dummy = new THREE.Object3D();
        dummy.position.set(
            units[0] - this.center.x,
            container.height + 2,
            -(units[1] - this.center.y)
        );

        dummy.rotation.set(0, Math.PI / 4.5, 0);
        dummy.updateMatrix();
        this.setMatrixAt(this.containers.size, dummy.matrix);

        this.instanceMatrix.needsUpdate = true;
        this.containers.set(container.code, container);
    }

    removeContainer(container) {
        let currentContainer = this.containers.get(container.code);
        const matrix = new THREE.Matrix4();

        matrix.set(0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0);

        this.setMatrixAt(currentContainer.index, matrix);
        this.instanceMatrix.needsUpdate = true;
        this.containers.delete(currentContainer.code);
        
    }

}