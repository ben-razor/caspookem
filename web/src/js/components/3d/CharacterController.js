import * as THREE from 'three';

class BasicCharacterController {
  constructor(target, keyMap) {
    this._target = target;

    if(keyMap) {
      this.keyMap = keyMap;
    }
    else {
      this.keyMap = {
        forward: 'arrowup',
        backward: 'arrowdown',
        left: 'arrowleft',
        right: 'arrowright',
        jump: 'd',
        fire: 'f',
        faster: 'shift'
      };
    }

    this._Init();
  }

  _Init() {
    this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
    this._acceleration = new THREE.Vector3(1, 0.25, 50.0);
    this._velocity = new THREE.Vector3(0, 0, 0);
    this._input = new BasicCharacterControllerInput(this.keyMap);
    this.prevPosition = new THREE.Vector3(0, 0, 0);
  }

  Update(timeInSeconds) {
    if (!this._target) {
      return;
    }

    const velocity = this._velocity;
    const frameDecceleration = new THREE.Vector3(
        velocity.x * this._decceleration.x,
        velocity.y * this._decceleration.y,
        velocity.z * this._decceleration.z
    );
    frameDecceleration.multiplyScalar(timeInSeconds);
    frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(
        Math.abs(frameDecceleration.z), Math.abs(velocity.z));

    velocity.add(frameDecceleration);

    const controlObject = this._target;
    const _Q = new THREE.Quaternion();
    const _A = new THREE.Vector3();
    const _R = controlObject.quaternion.clone();

    const acc = this._acceleration.clone();
    if (this._input._keys.shift) {
      acc.multiplyScalar(2.0);
    }

    if (this._input._keys.forward) {
      velocity.z += acc.z * timeInSeconds;
    }
    if (this._input._keys.backward) {
      velocity.z -= acc.z * timeInSeconds;
    }
    if (this._input._keys.left) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(_A, 4.0 * Math.PI * timeInSeconds * this._acceleration.y);
      _R.multiply(_Q);
    }
    if (this._input._keys.right) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(_A, 4.0 * -Math.PI * timeInSeconds * this._acceleration.y);
      _R.multiply(_Q);
    }

    controlObject.quaternion.copy(_R);

    const oldPosition = new THREE.Vector3();
    oldPosition.copy(controlObject.position);
    this.prevPosition = oldPosition;

    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(controlObject.quaternion);
    forward.normalize();

    const sideways = new THREE.Vector3(1, 0, 0);
    sideways.applyQuaternion(controlObject.quaternion);
    sideways.normalize();

    sideways.multiplyScalar(velocity.x * timeInSeconds);
    forward.multiplyScalar(velocity.z * timeInSeconds);

    // controlObject.position.add(forward);
    // controlObject.position.add(sideways);

    oldPosition.copy(controlObject.position);
  }
};

class BasicCharacterControllerInput {
  constructor(keyMap) {
    this._Init(keyMap);    
  }

  _Init(keyMap) {
    this.keyMap = keyMap;
    
    this._keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      space: false,
      shift: false,
    };
    document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
    document.addEventListener('keyup', (e) => this._onKeyUp(e), false);
    
  }


  _onKeyDown(event) {
    let km = this.keyMap;
    let handled = true;
    switch (event.key.toLowerCase()) {
      case km.forward:
        this._keys.forward = true;
        break;
      case km.left:
        this._keys.left = true;
        break;
      case km.backward: 
        this._keys.backward = true;
        break;
      case km.right: 
        this._keys.right = true;
        break;
      case km.jump:
        this._keys.space = true;
        break;
      case km.faster:
        this._keys.shift = true;
        break;
      default:
        handled = false;
        break;
    }

    if(handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  _onKeyUp(event) {
    let km = this.keyMap;
    let handled = true;

    switch(event.key.toLowerCase()) {
      case km.forward:
        this._keys.forward = false;
        break;
      case km.left:
        this._keys.left = false;
        break;
      case km.backward: 
        this._keys.backward = false;
        break;
      case km.right: 
        this._keys.right = false;
        break;
      case km.jump:
        this._keys.space = false;
        break;
      case km.faster:
        this._keys.shift = false;
        break;
      default:
        handled = false;
        break;
    }
    if(handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
};

export { BasicCharacterController };