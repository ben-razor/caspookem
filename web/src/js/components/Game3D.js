import React, {useEffect, useState, useCallback, Fragment} from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import lifeform from '../../data/models/ghost-7.gltf';
import imageFrame from '../../images/frame-dark-1.png';
import BrButton from './lib/BrButton';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { setAlphaToEmissive, loadImageToMaterial, hueToColor, hexColorToInt, intToHexColor, HitTester } from '../helpers/3d';
import { cloneObj, StateCheck, isLocal, localLog } from '../helpers/helpers';
import gameConfig, { getAssetURL, partIdToName } from '../../data/world/config';
import getText, { exclamation } from '../helpers/text';
import { CompactPicker } from 'react-color';
import { BasicCharacterController } from './3d/CharacterController';
import { ParticleSystem } from './3d/Particle';
import { Spider } from './caspooken/Spider';
import { TimeTrigger } from './caspooken/TimeTrigger';
import { getObstacle, getSceneConfig } from '../../data/world/scenes';
import { Obstacle } from './caspooken/Obstacle';
import { Lifeform } from './caspooken/Lifeform';
import { casperAttemptConnect, getHighScore } from '../helpers/casper';
import { Trigger } from './caspooken/Trigger';
import { Door } from './caspooken/Door';

const DEBUG_FAST_BATTLE = false;

const loader = new GLTFLoader();

const w = 1000;
const h = 540;

let textDelay = 2000;
let postBattleDelay = 3000;
if(DEBUG_FAST_BATTLE) {
  textDelay = 200;
}

const LIGHT_INTENSITY = 10;

const keysPressed = {};

document.addEventListener('keydown', e => {
  keysPressed[e.key.toLowerCase()] = true;
})
document.addEventListener('keyup', e => {
  keysPressed[e.key.toLowerCase()] = false;
});

const stateCheck = new StateCheck();

let gameScore = 0;
let gameHealth = 100;
let gameJustDied = false;
let gameJustStarted = false;
let gameLevelJustEnded = false;
let gameLevelJustStarted = false;
let gameLevel = 0;
let gameSpiders = 0;
let gameDoorTriggered = 0;
let gameEquipment = [];

function Game3D(props) {
  const showModal = props.showModal;
  const nftList = props.nftList;
  const nftData = props.nftData;
  const activeNFT = props.activeNFT;
  const execute = props.execute;
  const processingActions = props.processingActions;
  const toast = props.toast;
  const screens = props.screens;
  const screen = props.screen;
  const setScreen = props.setScreen;
  const getTextureURL = props.getTextureURL;
  const ipfsToBucketURL = props.ipfsToBucketURL;
  const requestMint = props.requestMint;
  const score = props.score;
  const setScore = props.setScore;
  const signedInInfo = props.signedInInfo;
  const getBucketURL = props.getBucketURL;

  window.nftData = nftData;

  const threeRef = React.createRef();

  const [scene, setScene] = useState();
  const [camera, setCamera] = useState();
  const [clock, setClock] = useState();
  const [sjScene, setSJScene] = useState();
  const [controlEntry, setControlEntry] = useState({ ...gameConfig.defaultEntry });
  const [styleInitialized, setStyleInitialized] = useState();

  const [prevScreen, setPrevScreen] = useState(screens.GAME);
  const [orbitControls, setOrbitControls] = useState(false);
  const [orbitControlsEnabled, setOrbitControlsEnabled] = useState(false);
  const [garagePanel, setGaragePanel] = useState('equip');
  const [showEquipControls, setShowEquipControls] = useState(false);
  const [showNFTList, setShowNFTList ] = useState(true);
  const [showNFTListHelp, setShowNFTListHelp ] = useState(false);
  const [threeElem, setThreeElem ] = useState();
  const [health, setHealth] = useState(100);
  const [hit, setHit] = useState(false);
  const [equipment, setEquipment] = useState([]);
  const [doorTriggered, setDoorTriggered ] = useState(0);
  const [gameText, setGameText] = useState('');
  const [levelEnded, setLevelEnded] = useState();
  const [level, setLevel] = useState(gameLevel);

  function characterChanged(nftData, prevNFTData) {
    if(!nftData || !prevNFTData) {
      return false;
    }

    let keys = Object.keys(gameConfig.baseNFTData);

    let changedKeys = [];

    for(let key of keys) {
      if(nftData[key] !== prevNFTData[key]) {
        changedKeys.push(key);
      }
    }

    return changedKeys;
  }

  function validDecal(decal) {
    let isValid = !decal || decal === '0' || controlEntry.unlockedDecals.includes(decal);
    return isValid;
  }

  function blendColorToHex(blendColor) {
    return '#' + blendColor.map(x => (Math.floor(x * 255)).toString(16).padStart(2, '0')).join('')
  }

  useEffect(() => {
    console.log(JSON.stringify(['ACM', activeNFT]));
    
    if(activeNFT && activeNFT?.eyewear) {
      let _controlEntry = {...controlEntry};

      _controlEntry.eyewear = 'Eyewear' + activeNFT.eyewear;
      _controlEntry.headwear = 'Headwear' + activeNFT.headwear;
      let blendColor = gameConfig.colors[activeNFT.skin_color];
      let hexColor = blendColorToHex(blendColor);
      _controlEntry.color = hexColor;

      blendColor = gameConfig.colors[activeNFT.eye_color];
      hexColor = blendColorToHex(blendColor);
      _controlEntry.eyeColor = hexColor;

      blendColor = gameConfig.colors[activeNFT.pupil_color];
      hexColor = blendColorToHex(blendColor);
      _controlEntry.pupilColor = hexColor;

      setControlEntry(_controlEntry);
    }
  }, [activeNFT]);

  function startHidden(name) {
    let hidden = false;
    for(let start of gameConfig.start_hidden) {
      if(name.startsWith(start)) {
        hidden = true;
      }
    }
    return hidden;
  }

  function sceneObjectStartHidden(name, hiddenNameStarts) {
    let hidden = false;
    for(let start of hiddenNameStarts) {
      if(name.startsWith(start)) {
        hidden = true;
      }
    }
    return hidden;
  }

  const getDoorText = useCallback(() => {
    let doorText = '';

    let hasEquip = gameEquipment.find(x => x.type === 'gem-pink-1');

    if(!hasEquip) {
      doorText = getText('text_door_possession', { 'object': getText('text_equip_pink_crystal')});
    }
    else if(gameSpiders < 3) {
      doorText = getText('text_door_mashup', { 'number': 3, 'lifeforms': getText('text_lifeform_spiders')});
    }
    else if(!nftList.length) {
      doorText = getText('text_door_mint_caspookies');
    }
    else {
      doorText = getText('text_door_is_pleased');
    }

    return 'Door: ' + doorText;
  }, [nftList]);

  const styleScene = useCallback((scene, controlEntry) => {
    scene.traverse(o => {
      if(startHidden(o.name)) {
        o.visible = false;
      }

      if(controlEntry.eyewear) {
        let name = controlEntry.eyewear;

        if(o.name.startsWith(name)) {
          o.visible = true;
        }
      }

      if(controlEntry.headwear) {
        let name = controlEntry.headwear;

        if(o.name.startsWith(name)) {
          o.visible = true;
        }
      }

      if(controlEntry.right) {
        let name = controlEntry.right;

        if(o.name === 'BotTurretR' && name.startsWith('Weapon') && !name.endsWith('Empty')) {
          o.visible = true;
        }

        if(o.name.startsWith(name + 'R')) {
          o.visible = true;
        }
      }

      if(controlEntry.front) {
        let name = controlEntry.front;

        if(o.name === 'BotTurretFront' && name.startsWith('Weapon') && !name.endsWith('Empty')) {
          o.visible = true;
        }

        if(o.name.startsWith(name)) {
          o.visible = true;
        }
      }

      if(controlEntry.transport) {
        if(o.name.startsWith(controlEntry.transport)) {
          o.visible = true;
        }
      }

      if(o.name === 'Eye') {
        let meshes = o.children.length ? o.children : [o];

        for(let child of meshes) {
          if(child.material.name === 'MatEye') {
            child.material.color = new THREE.Color(controlEntry.eyeColor);
          }
          if(child.material.name === 'MatPupil') {
            child.material.color = new THREE.Color(controlEntry.pupilColor);
          }
        }
      }

      if(o.name === 'Body') {
        let meshes = o.children.length ? o.children : [o];

        for(let child of meshes) {

          if(child.material.name === 'MatBodyDecal1') {
            loadImageToMaterial(child.material, getTextureURL('badge', controlEntry.decal1));
          }
          if(child.material.name === 'MatBody' || child.material.name === 'MatBodyDecal1') {
            child.material.color = new THREE.Color(controlEntry.color);
            child.material.emissiveIntensity = 5;

            if(controlEntry.skin === 'SkinPlastic') {
              child.material.flatShading = false;
              child.material.roughness = 0;
              child.material.metalness = 0;
            }
            if(controlEntry.skin === 'SkinCarbonFibre') {
              child.material.flatShading = true;
              child.material.roughness = 0.8;
              child.material.metalness = 0;
            }
            if(controlEntry.skin === 'SkinAluminium') {
              child.material.flatShading = true;
              child.material.roughness = 0.4;
              child.material.metalness = 0.5;
            }
            if(controlEntry.skin === 'SkinSteel') {
              child.material.flatShading = true;
              child.material.roughness = 0.2;
              child.material.metalness = 1;
            }

            child.material.needsUpdate = true;
          }
        }
      }

      setStyleInitialized(true);
    });
  }, []);

  useEffect(() => {
    if(sjScene) {
      styleScene(sjScene, controlEntry);
    }
  }, [sjScene, controlEntry, styleScene]);

  useEffect(() => {
    if(hit) {
      setHit(false);
    }
  }, [hit]);

  useEffect(() => {
    let changed = stateCheck.changed('health', health, 100);

    if(health === 0 && changed) {
      changeScreen(screens.GAME_OVER);
    }
  }, [health, changeScreen, screens]);


  useEffect(() => {
    let changed = stateCheck.changed('levelEnded', levelEnded, 100);

    if(levelEnded && changed) {
      setLevel(gameLevel);
      changeScreen(screens.GAME_LEVEL);
    }
  }, [levelEnded, changeScreen, screens]);
  
  useEffect(() => {
      console.log(JSON.stringify(['door triggered']));
    if(doorTriggered) {
      let doorText = getDoorText();
      console.log(JSON.stringify(['door triggered 2', doorText]));
      setGameText('');
      setTimeout(() => {
        setGameText(doorText);
      }, 10)
    }
  }, [doorTriggered, getDoorText]);

  useEffect(() => {
    if(scene && camera && threeElem) {
      loader.load(lifeform, function ( gltf ) {
        scene.add(gltf.scene);
        setSJScene(gltf.scene);

        const mixer = new THREE.AnimationMixer(gltf.scene);
        const clips = gltf.animations;

        let world = new CANNON.World()

        // Tweak contact properties.
        // Contact stiffness - use to make softer/harder contacts
        world.defaultContactMaterial.contactEquationStiffness = 1e9

        // Stabilization time in number of timesteps
        world.defaultContactMaterial.contactEquationRelaxation = 4

        const solver = new CANNON.GSSolver()
        solver.iterations = 7
        solver.tolerance = 0.1
        world.solver = new CANNON.SplitSolver(solver)
        // use this to test non-split solver
        // world.solver = solver

        world.gravity.set(0, -20, 0)

        // Create a slippery material (friction coefficient = 0.0)
        let physicsMaterial = new CANNON.Material('physics')
        const physics_physics = new CANNON.ContactMaterial(physicsMaterial, physicsMaterial, {
          friction: 0.04,
          restitution: 0.1,
        })

        // We must add the contact materials to the world
        world.addContactMaterial(physics_physics)

        const clipWalk = THREE.AnimationClip.findByName( clips, 'Walk2' );
        const clipThrow = THREE.AnimationClip.findByName( clips, 'Throw' );
        const walkAction = mixer.clipAction( clipWalk );
        const throwAction = mixer.clipAction( clipThrow );
        walkAction.play();

        for(let clip of clips) {
          if(clip.name === 'spider.walk') {
            const spiderWalkAction = mixer.clipAction( clip );
            spiderWalkAction.play();
          }
        }

        let lifeform = new Lifeform(world, scene, physicsMaterial);

        let obstacles = [];
        let triggers = [];

        function initLevel(nextLevel) {
          let sceneConf = getSceneConfig('Scene' + nextLevel);

          lifeform.enable(sceneConf.startPos);

          scene.traverse(o => {
            if(sceneObjectStartHidden(o.name, sceneConf.startHidden)) {
              o.visible = false;
            }
          });

          for(let obConf of sceneConf.objects) {
            let obj = scene.getObjectByName(obConf.id);
            console.log(JSON.stringify(['O', obj.visible]));
            obj.position.copy(obConf.pos);
            obj.visible = true;
          }

          for(let obConf of sceneConf.obstacles) {
            let ob = new Obstacle(world, scene, obConf, physicsMaterial);
            ob.enable();
            obstacles.push(ob);
          }

          for(let obConf of sceneConf.triggers) {
            let tr = new Trigger(world, scene, obConf);
            tr.enable();
            triggers.push(tr);
          }

          for(let i = 0; i < spiders.length; i++) {
            if(i < sceneConf.numSpiders) {
              spiders[i].paused = false;
            }
            else {
              spiders[i].paused = true;
            }
          }

          return sceneConf;
        }

        const groundShape = new CANNON.Plane()
        const groundBody = new CANNON.Body({ mass: 0, material: physicsMaterial })
        groundBody.objId = 'floor';
        groundBody.classes = [];
        groundBody.position.copy(new THREE.Vector3(0, 0, 0));
        groundBody.addShape(groundShape)
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
        world.addBody(groundBody)

        let controller = new BasicCharacterController(lifeform.positioner, {
          forward: 'w',
          backward: 's',
          left: 'a',
          right: 'd',
          jump: 'j',
          fire: 'n',
          faster: 'shift'
        });

        let cannonPhysics = true;

        let totalTime = 0;
        let jumping = false;

        let door = new Door('Door_Double', world, scene);

        lifeform.body.addEventListener('collide', a => {
          let b2 = a.body;

          if(b2.classes?.includes('spider')) {
            gameHealth = Math.floor(gameHealth - (5 + Math.random() * 5));
            if(gameHealth < 0) {
              gameHealth = 0;
              gameJustDied = true;
              gameEquipment = [];
            }
            setHealth(gameHealth);
            setHit(true);
          }
          if(b2.classes?.includes('gem-pink-1')) {
            console.log(JSON.stringify(['Collected Gem!!']));
            gameEquipment.push({ id: b2.objId, type: 'gem-pink-1' });
            setEquipment(gameEquipment);
            removeIds.push(b2.objId);
            gameScore += 1000;
            setScore(gameScore);
          }
          if(b2.classes?.includes('door')) {
            console.log(JSON.stringify(['it be door time', gameDoorTriggered]));
            setDoorTriggered(++gameDoorTriggered);
            door.open();
            gameLevelJustEnded = true;
            gameLevel += 1;
            setLevelEnded(gameLevelJustEnded);
          }
          if(!b2.classes?.includes('no-land')) {
            jumping = false;
          }
        })

        const shootVelocity = 20; 
        const ballShape = new CANNON.Sphere(0.28)
        const ballGeometry = new THREE.SphereBufferGeometry(ballShape.radius, 32, 32)

        const fireTexture = new THREE.TextureLoader().load(getAssetURL('fire-blue-dark.png', 'tex'));

        let balls = [];
        let ballMeshes = [];
        let material = new THREE.MeshToonMaterial({ color: '#0022aa', alphaMap: fireTexture, alphaBlend: THREE.AdditiveBlending, opacity: 1 })
        let ballIndex = 0;
        let toRemove = [];
        let removeIds = [];

        let particles = new ParticleSystem({
            parent: scene,
            camera,
            texture: fireTexture 
        });

        //threeElem.addEventListener('click', (event) => {
        document.addEventListener('keydown', (e) => {
          if(e.key.toLowerCase() !== controller.keyMap.fire) {
            return;
          }

          const ballBody = new CANNON.Body({ mass: 0.01, isTrigger: true })
          ballBody.addShape(ballShape)
          const ballMesh = new THREE.Mesh(ballGeometry, material)

          ballBody.addEventListener('collide', a => {
            let cOther = a.body;
            let cBall = a.target;

            if(cOther.classes?.includes('spider')) {
              console.log(JSON.stringify(['ro', cOther.objId]));
              removeIds.push(cOther.objId);
              gameScore = gameScore + 100;
              gameSpiders++;
              setScore(gameScore);
            }
           
            if(cOther.ballId) {
              console.log(JSON.stringify(['cOther coll']));
              let cOtheri = 0;
              for(let ballBody of balls) {
                if(ballBody.ballId === cOther.ballId) {
                  break;
                }
                cOtheri++;
              }
              toRemove.push(cOtheri);
              particles.trigger(cOther.position, 0.5);
            }

            if(cBall.ballId) {
              console.log(JSON.stringify(['cBall coll']));
              let cBalli = 0;
              for(let ballBody of balls) {
                if(ballBody.ballId === cBall.ballId) {
                  break;
                }
                cBalli++;
              }
              toRemove.push(cBalli);
              particles.trigger(cBall.position, 0.5);
            }
          })

          ballBody.ballId = ballIndex++;
          ballMesh.ballId = ballBody.ballId;

          ballMesh.castShadow = true;
          ballMesh.receiveShadow = true;

          world.addBody(ballBody)
          scene.add(ballMesh)
          balls.push(ballBody)
          ballMeshes.push(ballMesh)

          const shootDirection = lifeform.getShootDirection()
          ballBody.velocity.set(
            shootDirection.x * shootVelocity,
            shootDirection.y * shootVelocity,
            shootDirection.z * shootVelocity
          )

          // Move the ball outside the player sphere
          let offsetter = shootDirection.clone();
          let sider = shootDirection.clone();
          let rotY = new THREE.Euler(0, Math.PI / 2, 0);
          sider.applyEuler(rotY);
          offsetter.multiplyScalar(0.6);
          sider.multiplyScalar(0.8)
          offsetter.add(sider);
          const x = lifeform.body.position.x + offsetter.x;
          let y = lifeform.body.position.y + offsetter.y;
          const z = lifeform.body.position.z + offsetter.z;
          console.log(JSON.stringify(['lbp', lifeform.body.position]));
          
          y = y + 1.2;
          ballBody.position.set(x, y, z)
          ballMesh.position.copy(ballBody.position)

          throwAction.setDuration(0.8).stop().reset().setLoop(THREE.LoopOnce).play();
        })

        let spiders = [];
        let spiderTimers = [];

        for(let i = 1; i <= 5; i++) {
          let spider = new Spider('Emptyspider00' + i, ['spider'], world, scene);
          spider.setTargetObj(lifeform.positioner);
          spiders.push(spider);
          spider.paused = true;
          let spiderTimer = new TimeTrigger(5, 1);
          spiderTimers.push(spiderTimer);
        }

        for(let i = 1; i <= 5; i++) {
          let spider = new Spider('Emptytechnospider00' + i, ['spider'], world, scene);
          spider.setTargetObj(lifeform.positioner);
          spider.paused = true;
          spiders.push(spider);
          let spiderTimer = new TimeTrigger(5, 1);
          spiderTimers.push(spiderTimer);
        }

        function startSpiders() {
          for(let i = 0; i < spiders.length; i++) {
            let spiderTimer = spiderTimers[i];
            let spider = spiders[i];

            if(!spiderTimer.callbacks.length) {
              spiderTimer.addCallback({
                timeTriggered: (dt, t) => { 
                  spider.spawn();
                }
              });
            }

            spiderTimer.reset();
          }
        }

        function removeSpiders() {
          for(let i = 0; i < spiders.length; i++) {
            spiders[i].disable();
          }
        }

        function enableTriggers() {
          for(let i = 0; i < triggers.length; i++) {
            let trigger = triggers[i];
            trigger.enable();
          }
        }

        let removeObj = function(world, scene, mesh, body, spline) {
          scene.remove(mesh);
          mesh.geometry.dispose();
          mesh.material.dispose();

          if(body) {
            world.removeBody(body);
          }

          if(spline) {
            scene.remove(spline);
          }
        }

        var animateLifeform = function () {
          requestAnimationFrame( animateLifeform );

          let dt = clock.getDelta();
          totalTime += dt;
          
          for(let i = 0; i < spiders.length; i++) {
            spiders[i].update(dt, totalTime);
            spiderTimers[i].update(dt);
          }

          if(removeIds.length) {
            for(let removeId of removeIds) {
              for(let i = 0; i < spiders.length; i++) {
                if(spiders[i].id === removeId) {
                  spiders[i].disable();
                  spiders[i].spawn();
                  break;
                }
              }

              for(let i = 0; i < triggers.length; i++) {
                if(triggers[i].id === removeId) {
                  triggers[i].disable();
                }
              }
            }
            removeIds = [];
          }

          door.update(dt, totalTime);

          if(gameJustStarted) {
            gameJustStarted = false;
            gameLevelJustStarted = true;
          }

          if(gameJustDied) {
            for(let i = 0; i < balls.length; i++) {
              removeObj(world, scene, ballMeshes[i], balls[i]);
              balls.splice(i, 1);
              ballMeshes.splice(i, 1);
            }
            for(let i = 0; i < spiders.length; i++) {
              spiders[i].disable();
            }
            lifeform.disable();
            removeIds = [];
            gameJustDied = false;
          }

          if(gameLevelJustEnded) {
            for(let i = 0; i < balls.length; i++) {
              removeObj(world, scene, ballMeshes[i], balls[i]);
              balls.splice(i, 1);
              ballMeshes.splice(i, 1);
            }
            for(let i = 0; i < obstacles.length; i++) {
              let ob = obstacles[i];
              ob.disable();
            }
            for(let i = 0; i < triggers.length; i++) {
              let tr = triggers[i];
              tr.disable();
            }
            obstacles = [];
            triggers = [];
            removeSpiders();
            lifeform.disable(); 
            removeIds = [];
            gameLevelJustEnded = false;
          }

          if(gameLevelJustStarted) {
            console.log(JSON.stringify(['GLJS', gameLevel]));
            initLevel(gameLevel)
            door.close();
            startSpiders();
            enableTriggers();
            gameLevelJustStarted = false;
          }

          if(toRemove.length) {
            for(let objId of toRemove) {
              if(!balls[objId]) continue;
              removeObj(world, scene, ballMeshes[objId], balls[objId]);
              balls.splice(objId, 1);
              ballMeshes.splice(objId, 1);
            }
            toRemove = [];
          }

          if(cannonPhysics) {
            if(totalTime > 5) {
              world.step(Math.min(dt, 0.1));

              for (let i = 0; i < balls.length; i++) {
                ballMeshes[i].position.copy(balls[i].position)
                ballMeshes[i].quaternion.copy(balls[i].quaternion)
              }

              let height = lifeform.body.position.y - 1;
              lifeform.positioner.position.copy(lifeform.body.position);
              lifeform.positioner.position.y = height;
              let keys = controller._input._keys;

              if(keys.space) {
                if(!jumping) {
                  lifeform.body.velocity.y = 10;
                  if(keys.left) {
                    lifeform.body.velocity.x = -6;
                  }
                  if(keys.right) {
                    lifeform.body.velocity.x = 6;
                  }
                  if(keys.forward) {
                    lifeform.body.velocity.z = -6;
                  }
                  if(keys.backward) {
                    lifeform.body.velocity.z = 6;
                  }
                  jumping = true;
                }
              }

              if(keys.left) {
                if(!jumping) {
                  lifeform.body.velocity.x = -6;
                  lifeform.positioner.rotation.set(0, -Math.PI/2, 0);
                }
              }

              if(keys.right) {
                if(!jumping) {
                  lifeform.body.velocity.x = 6;
                  lifeform.positioner.rotation.set(0, Math.PI/2, 0);
                }
              }

              if(keys.backward) {
                if(!jumping) {
                  lifeform.body.velocity.z = 6;
                  if(keys.left) {
                    lifeform.positioner.rotation.set(0, -Math.PI/4, 0);
                  }
                  else if(keys.right) {
                    lifeform.positioner.rotation.set(0, Math.PI/4, 0);
                  }
                  else {
                    lifeform.positioner.rotation.set(0, 0, 0);
                  }
                }
              }

              if(keys.forward) {
                if(!jumping) {
                  lifeform.body.velocity.z = -6;
                  if(keys.left) {
                    lifeform.positioner.rotation.set(0, -3*Math.PI/4, 0);
                  }
                  else if(keys.right) {
                    lifeform.positioner.rotation.set(0, 3*Math.PI/4, 0);
                  }
                  else {
                    lifeform.positioner.rotation.set(0, Math.PI, 0);
                  }
                }
              }
            }
          }

          particles.Step(dt);
          mixer.update(dt);
        }

        animateLifeform();

      }, undefined, function ( error ) { console.error( error ); } );  
    }
  }, [scene, threeElem, camera]);

  const createScene = useCallback((threeElem, w, h, camPos, orbitControls=false, refreshEvery=1, camLookAt=[0,0,0]) => {
    var clock = new THREE.Clock();
    setClock(clock);
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera( 50, w/h, 1, 1000 );
    camera.position.copy(camPos);
    camera.lookAt(camLookAt[0], camLookAt[1], camLookAt[2]);

    let controls;

    if(orbitControls) {
      controls = new OrbitControls( camera, threeElem );
      controls.target.set(0, 0.4, 0);
      //controls.minDistance = 3;
      //controls.maxDistance = 4.5;
      controls.minPolarAngle = 0;
      controls.maxPolarAngle = Math.PI / 2.1;
      controls.autoRotate = false;
      setOrbitControls(controls);
    }

    var renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true, preserveDrawingBuffer: true });
    
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = 'initial';
    threeElem.appendChild( renderer.domElement );

    let lights = addPointLights(scene, 0xffffff, LIGHT_INTENSITY, 10, [
      new THREE.Vector3(5, 5, 5), new THREE.Vector3(-5, 5, 5), new THREE.Vector3(0, 5, -2)
    ])

    const light = new THREE.AmbientLight( 0xf0f0f0, 2); // soft white light
    scene.add( light );

    let i = 0;
    var animate = function () {
      requestAnimationFrame( animate );
      if(controls) controls.update();

      if(i++ % refreshEvery === 0) {
        renderer.render(scene, camera);
      }
    };

    animate();

    return { scene, camera };
  }, []);

  useEffect(() => {
    let { scene, camera } = createScene(threeRef.current, w, h, 
      new THREE.Vector3(0, 10, 30), orbitControlsEnabled, 2, [0, 1.5, 0]);
    setScene(scene);
    setCamera(camera);
    setThreeElem(threeRef.current);
  }, []);
  
  function addPointLights(scene, color, intensity, dist, positions=[]) {
    let lights = [];
    for(let pos of positions) {
      const light = new THREE.PointLight( color, intensity, dist);
      light.position.copy(pos);
      scene.add( light );
      lights.push(light);
    }
    return lights;
  }

  function toggleAutoRotate() {
    if(orbitControls) {
      orbitControls.autoRotate = !orbitControls.autoRotate;
    }
  }

  function getControl(action, src) {
    let processing = processingActions?.[action];

    return <div className={"br-strange-juice-control " + (processing ? 'br-border-hide' : '')} onClick={e => execute(action)} key={action}>
      <div className="br-strange-juice-overlay-image-container">
        <img className={"br-strange-juice-overlay-image " + (processing ? 'br-anim-shake-short br-hurt' : '')} alt="Plug socket" src={src} />
      </div>
      <div className={"br-strange-juice-overlay-text " + (processing ? 'br-anim-text-pulse' : '')}>
        { getText('icon_' + action )}
      </div>
    </div>
  }

  function getControlSet(setId, gameConfig) {
    let controlSetUI = [];
    let elems = [];
    let index = 0;
    let disabled;
    let validIndex = getMaxWeaponIndexForLevel(nftData?.level);

    if(setId === 'eyewear' || setId === 'headwear') {

      elems = gameConfig[setId];
      console.log(JSON.stringify(['ELEMS', elems]));

      index = 0;
      for(let elem of elems) {
        disabled = index > validIndex;
        controlSetUI.push(
          <option key={setId + elem.id} disabled={disabled} value={elem.id}>{elem.name}</option>
        )
        index++;
      }
    }
    else if(setId.startsWith('decal')) {
      elems = gameConfig.decals;
      
      for(let elem of elems) {
        disabled = !validDecal(elem.id);

        controlSetUI.push(
          <option key={setId + elem.id} disabled={disabled} value={elem.id}>{elem.name}</option>
        )
      }
    }
    else {
      if(setId === 'front') {
        elems = gameConfig.weapons_melee;
      }
      else if(setId === 'skin') {
        elems = gameConfig.skin;
      }
      else if(setId === 'transport') {
        elems = gameConfig.transport;
      }

      index = 0;
      for(let elem of elems) {
        disabled = index > validIndex;
        controlSetUI.push(
          <option key={setId + elem.id} disabled={disabled} value={elem.id}>{elem.name}</option>
        )
        index++;
      }
    }

    return <select key={setId + 'select'} className="br-feature-select" value={controlEntry[setId]} onChange={e => changeControl(setId, e.target.value)}>
      {controlSetUI}
    </select>;
  }

  function changeControl(setId, value) {
    let _controlEntry = {...controlEntry};
    _controlEntry[setId] = value;
    setControlEntry(_controlEntry);
  }

  function getControlRow(title, control) {
    return <div className="br-feature-row" key={title}>
      <div className="br-feature-title">
        {title}
      </div>
      <div className="br-feature-control">
        {control}
      </div>
    </div>
  }

  function colorChanged(color, event) {
    changeControl('color', color.hex);
  }

  function getColorChooser() {
    const pickerStyle = {
      padding: '0.5em'
    };
    
    return <div style={pickerStyle}><CompactPicker onChange={ colorChanged }/></div>;
  }

  function showBeginnerHelp() {
    return nftList.length === 0;
  }

  function getControlUI(gameConfig, strangeJuice) {
    let controlUI = [];

    if(garagePanel === 'equip') {

      if(showBeginnerHelp()) {
        controlUI.push(<div className="br-info-message">
          <i className="fa fa-info br-info-icon"></i>
          { getText('text_unlock_items') }
        </div>);
      }

      controlUI.push(getControlRow('Eyewear', getControlSet('eyewear', gameConfig)));
      controlUI.push(getControlRow('Headwear', getControlSet('headwear', gameConfig)))
      controlUI.push(getControlRow('Wheels', getControlSet('transport', gameConfig)))
      controlUI.push(getControlRow('Skin', getControlSet('skin', gameConfig)))
    }
    else {
      controlUI.push(getControlRow('Color', <div key="ColorChooser">{getColorChooser()}</div>));

      if(showBeginnerHelp()) {
        controlUI.push(<div className="br-info-message">
          <i className="fa fa-info br-info-icon"></i>
          { getText('text_get_new_decals') }
        </div>);
      }

      controlUI.push(getControlRow('Decal', getControlSet('decal1', gameConfig)));
    }

    return controlUI;
  }

  function getTextUI(storyLines) {
    let linesUI = [];

    let i = 0;
    for(let line of storyLines) {
      linesUI.push(<div className="br-strange-juice-story-line" key={i++}>
        {line}
      </div>);
    }

    return <div className="br-strange-juice-story-lines">
      {linesUI}
    </div>
  }

  function displayNFTs(nftList, activeNFT) {
    let nftUI = [];
    let active = false;

    let activeTokenId = activeNFT?.token_id;
    
    for(let nft of nftList) {
      if(activeTokenId === nft.token_id) {
        active = true;
      }
      else {
        active = false;
      }

      let bucketURL = ipfsToBucketURL(nft.image);
      let nftImg = <div className="br-caspookie-image-container" key={bucketURL}>
        <img className="br-caspookie-image" alt="Active caspookie" src={bucketURL} />
      </div>

      nftUI.push(<div className={"br-nft-list-item " + (active ? 'br-nft-list-item-selected' : '')} 
                      key={nft?.token_id} onClick={e => execute('selectNFT', nft.token_id)}>
        {nftImg}
      </div>);
    }

    nftUI.push(<div className={"br-nft-list-item br-no-border"} key="new_nft">
      <BrButton label={ getText('text_mint_nft')} id="mintNFT" className="br-button" onClick={ e => requestMint() } />
    </div>);

    return <Fragment>
      <div className="br-nft-list flexcroll">
        { nftUI }
      </div>
    </Fragment>
  }

  function changeScreen(screenID) {
    setPrevScreen(screen);
    setScreen(screenID);
  }

  useEffect(() => {
    console.log(JSON.stringify(['sc', screen]));
    
  }, [screen]);

  function getScreenClass(screenId) {
    let screenClass = 'br-screen-hidden';

    if(screenId === screen) {
      if(screenId === screens.GAME_LEVEL) {
        screenClass = 'br-screen-current loading-fade-in ';
      }
      else {
        screenClass = 'br-screen-current loading-fade-in-fast ';
      }
    }
    else if(screenId === prevScreen) {
      if(screenId === screens.GAME) {
        screenClass = 'br-screen-prev loading-fade-out-fast ';
      }
      else {
        screenClass = 'br-screen-prev loading-fade-out-instant ';
      }
    }

    return screenClass;
  }

  function restart() {
    console.log(JSON.stringify(['restarting']));
    
    gameScore = 0;
    gameHealth = 100;
    gameSpiders = 0;
    gameLevel = 0;
    gameEquipment = [];
    setScore(gameScore);
    setHealth(gameHealth);
    setEquipment(gameEquipment);
    setGameText('');
    changeScreen(screens.GAME);
    gameJustStarted = true;
  }

  function startLevel() {
    console.log(JSON.stringify(['start level']));
    gameHealth = 100;
    gameSpiders = 0;
    gameEquipment = [];
    setHealth(gameHealth);
    setEquipment(gameEquipment);
    setGameText('');
    changeScreen(screens.GAME);
    gameLevelJustStarted = true;
    setLevelEnded(false);
  }

  function getMaxWeaponIndexForLevel(level) {
    if(!level) {
      level = 0;
    }
    let weapon_index = Math.max(level + 2, 3);
    return weapon_index;
  }

  function getNFTListUI() {
    let nftListUI;

    if(signedInInfo.success) {
      nftListUI = <div className="br-nft-gallery">
        { true ? displayNFTs(nftList, activeNFT) : ''}
        { !nftList.length && showNFTListHelp ? 
          <div className="br-info-message-start">
            <BrButton label="The System" id="helpMore" className="br-button" onClick={ e => showModal() } />
          </div>
          :
          ''
        }
      </div>
    }

    return nftListUI;
  }

  function getScreenGame() {

    let equipUI = [];

    let i = 0;
    for(let equip of equipment) {
      let url = getBucketURL('equipment', equip.type);
      equipUI.push(<div className="br-hud-equip" key={equip.type + i++}>
        <img className="br-hud-equip-image" alt={'Equipment: ' + equip.type} src={url} />
      </div>)
    }

    return <Fragment>
      <div className={ "br-screen br-screen-game " + getScreenClass(screens.GAME)}>
        <div className="br-game loading-fade-in">
          <div className="br-strange-juice-3d" id="br-strange-juice-3d" ref={threeRef}>
            <div className="br-3d-overlay loading-fade-out-slow">
            </div>
            <div className="br-hud">
              <div className='br-level'>
                {getText('text_level')}
                <div className="br-level-number">
                  {level}
                </div>
              </div>
              <div className="br-hud-score">
                Score: {score}
              </div>
              <div className="br-hud-equip-list">
                {equipUI}
              </div>
              <div className="br-power-bar-panel">
                <div className={"br-power-bar-outer" + (hit ? " br-anim-shake-short br-hurt" : '')}>
                  <div className={"br-power-bar-inner" + (hit ? " br-anim-shake-short br-hurt" : '')} style={ { width: `${health}%`}}></div>
                </div>
                <div className="br-power">
                  {health}
                </div>
              </div>
            </div>
            {gameText ?
              <div className="br-bottom-osd loading-fade-out">
                <div className="br-game-text">
                  {gameText}
                </div>
              </div>
              :
              ''
            }
            {
              orbitControlsEnabled ?
                <button className="br-autorotate-button br-button br-icon-button"
                        onMouseDown={toggleAutoRotate}><i className="fa fa-sync-alt"></i></button>
                :
                ''
            }
          </div>
          { showEquipControls ?
            <div className="br-strange-juice-overlay">
              { getControlUI(gameConfig, nftData) } 
            </div>
            :
            ''
          }
        </div>
      </div>
    </Fragment> 
  }

  function getScreenGameStart() {
      return <div className={ "br-screen br-screen-game-start " + getScreenClass(screens.GAME_START)}>
        <div>
          Play Demo
        </div>
        <div className="br-game-controls">
          { signedInInfo.success ?
            <div>
              <BrButton label="Play Caspookem" id="playCaspookem" className="br-button" onClick={ e => restart() } />
            </div>
            :
            <div>
              <BrButton label="Play Demo" id="playDemo" className="br-button" onClick={ e => restart() } />
              <BrButton label="Connect Casper" id="connectCasperWallet" className="br-button" onClick={ e => casperAttemptConnect() } />
            </div>
          }
        </div>
      </div>
  }
  
  function getScreenGameOver() {
    return <div className={ "br-screen br-screen-game-over " + getScreenClass(screens.GAME_OVER)}>
      <div className="br-scary-text">
        You Deed
      </div>
      <div className="br-game-controls">
        <BrButton label="Play Again" id="playMore" className="br-button" onClick={ e => restart() } />
      </div>
    </div>
  }

  function getScreenLevel() {
    return <div className={ "br-screen br-screen-game-level " + getScreenClass(screens.GAME_LEVEL)}>
      <div className="br-scary-text">
        Great!!
      </div>
      <div className="br-scary-text br-scary-text-med">
        Level {level-1} Complete
      </div>
      <div className="br-game-controls">
        <BrButton label={'Start Level ' + level} id="startLevel" className="br-button" onClick={ e => startLevel() } />
      </div>
    </div>
  }

  return <div className="br-screen-container">
    { getNFTListUI() }
    { getScreenGameStart() }
    { getScreenGame() }
    { getScreenGameOver() }
    { getScreenLevel() }
  </div>
}

export default Game3D;