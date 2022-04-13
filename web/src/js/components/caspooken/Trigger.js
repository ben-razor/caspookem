import * as THREE from 'three'
import * as CANNON from 'cannon-es'

export class Trigger {
  constructor(world, scene, obConf) {
    this.obConf = obConf;
    this.world = world;
    this.scene = scene;
    this.enabled = false;
    this.id = obConf.id;

    console.log(JSON.stringify(['obst', obConf]));

    this.body = new CANNON.Body({ mass: 0, isTrigger: true })
    this.body.objId = obConf.id;
    this.body.classes = obConf.classes;

    if(obConf.positionType === 'object') {
      this.obj = scene.getObjectByName(obConf.objId);
      if(!this.obj) {
        console.log(JSON.stringify(['obstacle not found', obConf.objId]));
      }
      this.body.position.copy(this.obj.position);
    }
    else if(obConf.positionType === 'position') {
      this.body.position.set(obConf.position[0], obConf.position[1], obConf.position[2]);
    }

    let geometry = obConf.geometry;
    let shapeType = geometry.type;
    let collisionShape = null;

    if(shapeType === 'box') {
      let dims = geometry.dims;
      collisionShape = new CANNON.Box(new CANNON.Vec3(dims[0], dims[1], dims[2]))
    }
    else if(shapeType === 'sphere') {
      collisionShape = new CANNON.Sphere(geometry.radius)
    }
    else if(shapeType === 'plane') {
      let orientation = geometry.orientation;
      collisionShape = new CANNON.Plane()
      this.body.quaternion.setFromEuler(orientation[0], orientation[1], orientation[2]);
    }

    this.body.addShape(collisionShape)
  }

  enable() {
    if(!this.enabled) {
      this.world.addBody(this.body)
      this.enabled = true;

      if(this.obj) {
        this.obj.visible = true;
      }
    }
  }

  disable() {
    if(this.enabled) {
      this.world.removeBody(this.body);
      this.enabled = false;

      if(this.obj) {
        this.obj.visible = false;
      }
    }
  }
}
