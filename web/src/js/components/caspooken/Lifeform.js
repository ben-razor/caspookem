import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { TimeTrigger } from './TimeTrigger';
import { Vec3 } from 'cannon-es';

export class Lifeform {

  constructor(world, scene, physicsMaterial) {
    this.world = world;
    this.scene = scene;

    this.positioner = scene.getObjectByName('EmptyLifeform');
    this.positioner.visible = false;
    const lifeformShape = new CANNON.Sphere(1)
    this.body = new CANNON.Body({ mass: 5, fixedRotation: true, material: physicsMaterial })
    this.body.objId = 'lifeform';
    this.body.classes = [];
    this.body.addShape(lifeformShape)
  }
  
  getShootDirection() {
    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(this.positioner.quaternion);
    forward.normalize();
    return forward;
  }

  update() {

  }

  disable() {
    if(this.enabled) {
      this.positioner.visible = false;
      this.world.remove(this.body);
    }
  }

  enable(startPos) {
    if(!this.enabled) {
      if(!startPos) {
          startPos = new Vec3();
      }

      this.positioner.visible = true;
      this.world.addBody(this.body);
      this.body.position.copy(startPos);
      this.positioner.rotation.set(0, 0, 0);
    }
  }
}
