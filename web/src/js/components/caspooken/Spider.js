import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { TimeTrigger } from './TimeTrigger';

export class Spider {
    constructor(id, world, scene, physicsMaterial, options={ speed: 0.5, spiderSenses: 0.5}) {
        this.id = id;
        this.positioner = scene.getObjectByName(id);
        if(!this.postioner) {
            console.log(JSON.stringify(['Cant find object with id: ', this.id]));
        }

        this.world = world;
        this.scene = scene;
        this.physicsMaterial = physicsMaterial;
        this.debug = true;
        this.size = 0.7;
        this.enabled = false;
        this.speed = options.speed;
        this.vTo = new THREE.Vector3(0,0,0);

        this.timeTrigger = new TimeTrigger(options.spiderSenses);
        this.timeTrigger.addCallback(this)

        this.positioner.visible = false;
    }

    enable(startPos) {
        if(!this.enabled) {
            const geometry = new THREE.SphereBufferGeometry(this.size, 32, 32)
            let debugMaterial = new THREE.MeshBasicMaterial({ color: '#aa22aa' })
            this.debugMesh = new THREE.Mesh(geometry, debugMaterial);
            this.scene.add(this.debugMesh);

            const shape = new CANNON.Sphere(this.size);
            this.body = new CANNON.Body({ mass: 1, material: this.physicsMaterial })
            this.body.objId = this.id;
            this.body.addShape(shape);
            if(startPos) {
                this.body.position.copy(startPos);
            }
            this.world.addBody(this.body);
            this.enabled = true;
            this.positioner.visible = true;
        }
    }

    disable() {
        if(this.enabled) {
            this.enabled = false;
            this.world.removeBody(this.body);
            this.body = null;
            this.positioner.visible = false;
            this.debugMesh.visible = false;
        }
    }

    setSpeed(speed) {
        this.speed = speed;
    }

    setSpiderSenses(interval) {
        this.timeTrigger.setTimeout(interval);
    }

    setTarget(position) {
        this.target = position;
        this.curve = null;
        this.vTo.copy(this.target);
        this.vTo.sub(this.body.position);
        this.vTo.normalize();
        this.vTo.multiplyScalar(this.speed * 10);
        this.vTo.y = this.size + 0.01;

        console.log(JSON.stringify(['starget', this.vTo]));
        
        this.body.velocity.x = this.vTo.x;
        this.body.velocity.y = this.vTo.y;
        this.body.velocity.z = this.vTo.z;
    }

    timeTriggered(timeout) {
        console.log(JSON.stringify(['Timetriggered!', timeout]));
        if(this.targetObj) {
            this.setTarget(this.targetObj.position);
        }
    }

    setTargetObj(obj) {
        this.targetObj = obj;
    }

    setCurve(curve) {
        this.curve = curve;
        this.target = null;
    }

    update(dt, totalTime) {
        if(this.enabled) {
            this.timeTrigger.update(dt);

            if(this.target) {
                // this.body.position.addScaledVector(1, this.vTo, this.body.position);
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
            this.positioner.position.y = this.body.position.y - this.size;
        }
    }
}