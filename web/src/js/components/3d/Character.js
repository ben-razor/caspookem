import * as THREE from 'three';
var tmp, tmpVec;

var Character = function (scene, world, template, inputHandler, camera) {
  this.inputHandler = inputHandler;
  this.camera = camera;
  this.dimensions = new THREE.Vector3(0.25, 0.5, 0.25);
  this.mass = 100;

  this.inputState = {
      left: false,
      right: false,
      up: false,
      down: false
  };
};

Character.prototype = _.extend({}, {
  keyDown: function (event) {
      var keyCodes = this.inputHandler.keyCodes;

      if (event.keyCode === keyCodes.leftArrow || event.keyCode === keyCodes.A) {
          this.inputState.left = true;
      } else if (event.keyCode === keyCodes.rightArrow || event.keyCode === keyCodes.D) {
          this.inputState.right = true;
      } else if (event.keyCode === keyCodes.upArrow || event.keyCode === keyCodes.W) {
          this.inputState.forward = true;
      } else if (event.keyCode === keyCodes.downArrow || event.keyCode === keyCodes.S) {
          this.inputState.back = true;
      }
  },

  keyUp: function (event) {
      var keyCodes = this.inputHandler.keyCodes;

      if (event.keyCode === keyCodes.leftArrow || event.keyCode === keyCodes.A) {
          this.inputState.left = false;
      } else if (event.keyCode === keyCodes.rightArrow || event.keyCode === keyCodes.D) {
          this.inputState.right = false;
      } else if (event.keyCode === keyCodes.upArrow || event.keyCode === keyCodes.W) {
          this.inputState.forward = false;
      } else if (event.keyCode === keyCodes.downArrow || event.keyCode === keyCodes.S) {
          this.inputState.back = false;
      }
  },

  preStep: function () {
      var velocity, worldPoint;

      if (this.inputState.forward) {
          this.body.quaternion.toEuler(tmpVec);
          tmp.setFromAxisAngle(new THREE.Vector3(0, 1, 0), tmpVec.y);
          velocity = tmp.vmult(new THREE.Vector3(0, 0, 1));
          velocity.copy(this.body.velocity);
      } else if (this.inputState.back) {
          this.body.quaternion.toEuler(tmpVec);
          tmp.setFromAxisAngle(new THREE.Vector3(0, 1, 0), tmpVec.y);
          velocity = tmp.vmult(new THREE.Vector3(0, 0, -0.8));
          velocity.copy(this.body.velocity);
      } else {
          this.body.velocity.set(0, 0, 0);
      }

      if (this.inputState.left) {
          this.body.angularVelocity.y = 2;
      } else if (this.inputState.right) {
          this.body.angularVelocity.y = -2;
      } else {
          this.body.angularVelocity.set(0, 0, 0);
      }

      // Switch to walk animation if player has enough angular or linear velocity
      if (this.body.angularVelocity.norm() > 0.5 || this.body.velocity.norm() > 0.5) {
          this.setAnimation('Walk');
      } else {
          this.setAnimation('Idle');
      }
  },

  postStep: function () {
      // Force player to stay in upright position
      this.body.quaternion.toEuler(tmpVec);
      tmp.setFromAxisAngle(new THREE.Vector3(0, 1, 0), tmpVec.y);
      this.body.quaternion.set(tmp.x, tmp.y, tmp.z, tmp.w);

      // Force player to stay on ground
      this.body.position.y = 0.5;
  },

  created: function () {
      this.setAnimation('Idle');
  },

  setAnimation: function (name) {
      if (this.animation !== name) {
          this.animation = name;
          this.instance.setAnimation(name);
          this.instance.playAnimation(true);
      }
  },

  update: function (delta) {

      // keep camera in a fixed position relative to the character
      this.camera.position.set(this.body.position.x, this.body.position.y + 1.5, this.body.position.z + 2);
      this.camera.lookAt(this.instance.threeData.position);
  }
});