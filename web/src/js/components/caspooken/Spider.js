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
        this.speed = 1;
        this.vTo = new THREE.Vector3(0,0,0);

        this.positioner = scene.getObjectByName('Empty');
        
        this.enable();
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

    setTarget(position) {
        this.target = position;
        this.curve = null;
        this.vTo.copy(this.target);
        this.vTo.sub(this.body.position);
        this.vTo.normalize();
        this.vTo.multiplyScalar(this.speed * 0.1);
        this.vTo.y = 0;
    }

    setCurve(curve) {
        this.curve = curve;
        this.target = null;
    }

    update(dt, totalTime) {
        if(this.enabled) {
            if(this.target) {
                this.body.position.addScaledVector(1, this.vTo, this.body.position);
            }
            else if(this.curve) {
                let point = this.curve.getPointAt((totalTime / 20) % 1.0);
                let baddyPos = new THREE.Vector3(point.x, point.y, 0);
                var euler = new THREE.Euler( -Math.PI/2, 0, 0, 'XYZ' );
                baddyPos.applyEuler(euler);
                this.body.position.copy(baddyPos);
            }

            this.debugMesh.position.copy(this.body.position);
            this.positioner.position.copy(this.body.position);
        }
    }
}