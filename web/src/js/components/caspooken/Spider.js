import * as THREE from 'three'
import * as CANNON from 'cannon-es'

export class Spider {
    constructor(world, scene, physicsMaterial) {
        this.world = world;
        this.scene = scene;
        this.physicsMaterial = physicsMaterial;
        this.debug = true;
        this.size = 1;
        this.enabled = false;

        this.positioner = scene.getObjectByName('Empty');
        
        this.enable();
    }

    setCurve(curve) {
        this.curve = curve;
    }

    enable() {
        const geometry = new THREE.SphereBufferGeometry(this.size, 32, 32)
        let debugMaterial = new THREE.MeshBasicMaterial({ color: '#aa22aa' })
        this.debugMesh = new THREE.Mesh(geometry, debugMaterial);
        this.scene.add(this.debugMesh);

        const shape = new CANNON.Sphere(this.size);
        this.body = new CANNON.Body({ mass: 0, material: this.physicsMaterial })
        this.body.objId = 'spider';
        this.body.addShape(shape);
        this.world.addBody(this.body);
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
        this.world.removeBody(this.body);
        this.positioner.visible = false;
        this.debugMesh.visible = false;
    }

    update(dt, totalTime) {
        if(this.enabled) {
            if(this.curve) {
                let point = this.curve.getPointAt((totalTime / 20) % 1.0);
                let baddyPos = new THREE.Vector3(point.x, point.y, 0);
                this.debugMesh.position.copy(baddyPos);
                var euler = new THREE.Euler( -Math.PI/2, 0, 0, 'XYZ' );
                this.debugMesh.position.applyEuler(euler);
                this.body.position.copy(this.debugMesh.position);
            }

            this.positioner.position.copy(this.body.position);
        }
    }
}