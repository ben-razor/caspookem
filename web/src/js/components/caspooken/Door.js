import * as THREE from 'three'

export class Door {

  constructor(id, world, scene) {
    this.world = world;
    this.scene = scene;
    this.id = id;
    this.opening = false;
    this.speed = 1.4;
    this.openDist = 2;
    this.dist = 0;

    this.doorLeft = scene.getObjectByName(id + 'L');
    this.doorRight = scene.getObjectByName(id + 'R');

    this.doorLeftPos = this.doorLeft.position.clone();
    this.doorRightPos = this.doorRight.position.clone();

    this.lVel = new THREE.Vector3(-this.speed, 0, 0);
    this.rVel = new THREE.Vector3(this.speed, 0, 0);
  }

  open() {
    this.opening = true;
  }

  update(dt, totalTime) {
    if(this.opening) {
      let d = this.speed * dt;
      this.dist += d;

      if(this.dist >= this.openDist) {
        d = this.openDist - this.dist;
        this.opening = false;
      }

      this.lVel.set(-d, 0, 0);
      this.rVel.set(d, 0, 0);

      this.doorLeft.position.add(this.lVel);
      this.doorRight.position.add(this.rVel);
    }
  }

  close() {
    this.doorLeft.position.copy(this.doorLeftPos);
    this.doorRight.position.copy(this.doorRightPos);
    this.dist = 0;
    this.opening = false;
  }

  disable() {
    if(this.enabled) {
      this.doorLeft.visible = false;
      this.doorRight.visible = false;
    }
  }

  enable() {
    if(!this.enabled) {
      this.doorLeft.visible = true;
      this.doorRight.visible = true;
    }
  }
}
