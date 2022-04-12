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

    let obj = scene.getObjectByName(obConf.objId);
    if(!obj) {
      console.log(JSON.stringify(['obstacle not found', obConf.objId]));
      
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

    this.body = new CANNON.Body({ mass: 0, material: physicsMaterial })
    this.body.addShape(collisionShape)
    this.body.position.copy(obj.position);
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
