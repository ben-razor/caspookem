import * as THREE from 'three'
import * as CANNON from 'cannon-es'

export class Curve {
  constructor(world, scene) {
    this.world  = world;
    this.scene = scene;

    const baddyCurve = new THREE.SplineCurve( [
      new THREE.Vector2( -10, 0 ),
      new THREE.Vector2( -5, 5 ),
      new THREE.Vector2( 0, 0 ),
      new THREE.Vector2( 5, -5 ),
      new THREE.Vector2( 10, 0 )
    ] );
    
    const points = baddyCurve.getPoints( 50 );
    const geometry = new THREE.BufferGeometry().setFromPoints( points );
    
    const lineMaterial = new THREE.LineBasicMaterial( { color: 0xff0000 } );
    
    // Create the final object to add to the scene
    const baddySpline = new THREE.Line( geometry, lineMaterial );
    scene.add(baddySpline);
  }
}