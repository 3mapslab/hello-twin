import * as THREE from "three";
import * as utils from "./utils.js"

export default class TwinDynamicObjects extends THREE.InstancedMesh {

    constructor(geometry, material, count, worldCenter) {
        super(geometry, material, count);

        this.center = worldCenter;
        this.objects = new Map();
    }

    addObject(object) {
        object.index = this.objects.size;
        let lon = object.geometry.coordinates[0];
        let lat = object.geometry.coordinates[1];
        let units = utils.convertCoordinatesToUnits(lon, lat);

        const dummy = new THREE.Object3D();
        dummy.position.set(
            units[0] - this.center.x,
            object.height + 2,
            -(units[1] - this.center.y)
        );

        dummy.rotation.set(0, Math.PI / 4.5, 0);
        dummy.updateMatrix();
        this.setMatrixAt(this.objects.size, dummy.matrix);

        this.instanceMatrix.needsUpdate = true;
        this.objects.set(object.code, object);
    }

    removeObject(object) {
        let currentContainer = this.objects.get(object.code);
        const matrix = new THREE.Matrix4();

        matrix.set(0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0);

        this.setMatrixAt(currentContainer.index, matrix);
        this.instanceMatrix.needsUpdate = true;
        this.objects.delete(currentContainer.code);
    }

    /*
    updatePosition(object, newPosition) {
        // TODO
    }
    */

}