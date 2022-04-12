import * as THREE from 'three'
import * as CANNON from 'cannon-es'

export class Obstacle {
  constructor(world, scene, obConf, physicsMaterial) {
    this.obConf = obConf;
    this.world = world;
    this.scene = scene;
    this.enabled = false;
    this.physicsMaterial = physicsMaterial;

    console.log(JSON.stringify(['obst', obConf]));

    this.body = new CANNON.Body({ mass: 0, material: physicsMaterial })

    if(obConf.positionType === 'object') {
      let obj = scene.getObjectByName(obConf.objId);
      if(!obj) {
        console.log(JSON.stringify(['obstacle not found', obConf.objId]));
      }
      this.body.position.copy(obj.position);
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
    }
  }

  disable() {
    if(this.enabled) {
      this.world.removeBody(this.body);
      this.enabled = false;
    }
  }
}
