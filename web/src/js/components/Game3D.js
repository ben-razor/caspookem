import React, {useEffect, useState, useCallback, Fragment} from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import lifeform from '../../data/models/ghost-6.gltf';
import imageFrame from '../../images/frame-dark-1.png';
import BrButton from './lib/BrButton';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { setAlphaToEmissive, loadImageToMaterial, hueToColor, hexColorToInt, intToHexColor, HitTester } from '../helpers/3d';
import { cloneObj, StateCheck, isLocal, localLog } from '../helpers/helpers';
import gameConfig, { getAssetURL, partIdToName } from '../../data/world/config';
import getText, { exclamation } from '../helpers/text';
import { CompactPicker } from 'react-color';
import domtoimage from 'dom-to-image';
import { BasicCharacterController } from './3d/CharacterController';
import { ParticleSystem } from './3d/Particle';
import { Vector3 } from 'three';
import { Spider } from './caspooken/Spider';
import { TimeTrigger } from './caspooken/TimeTrigger';

function getServerURL(forceRemote=false) {
  let url = 'https://localhost:8926';

  if(!isLocal() || forceRemote) {
    url =  'https://benrazor.net:8926';
  }

  return url;
}

const serverURL = getServerURL();

const DEBUG_FORCE_BATTLE = false;
const DEBUG_FORCE_POST_BATTLE = false;
const DEBUG_NO_MINT = false;
const DEBUG_FAST_BATTLE = false;

const loader = new GLTFLoader();

const w = 1000;
const h = 600;
const wPhoto = 400;
const hPhoto = 400;

let textDelay = 2000;
let postBattleDelay = 3000;
if(DEBUG_FAST_BATTLE) {
  textDelay = 200;
}

const LIGHT_INTENSITY = 14;

const keysPressed = {};

document.addEventListener('keydown', e => {
  keysPressed[e.key.toLowerCase()] = true;
})
document.addEventListener('keyup', e => {
  keysPressed[e.key.toLowerCase()] = false;
});

const stateCheck = new StateCheck();
let battleTimer;

const postBattleScreens = {
  NONE: 0,
  RESULT: 1,
  LEVEL_UP: 2,
  PRIZE_PREPARE: 4,
  PRIZE_RESULT: 5,
  PRIZE_SUMMARY: 6,
  END: 7
};

function Game3D(props) {
  const showModal = props.showModal;
  const nftList = props.nftList;
  const nftData = props.nftData;
  const tokensLoaded = props.tokensLoaded;
  const activeTokenId = props.activeTokenId;
  const activeNFT = props.activeNFT;
  const execute = props.execute;
  const processingActions = props.processingActions;
  const toast = props.toast;
  const battleResult = props.battleResult;
  const battleConfig = props.battleConfig;
  const setBattleConfig = props.setBattleConfig;
  const screens = props.screens;
  const screen = props.screen;
  const setScreen = props.setScreen;
  const newKart = props.newKart;
  const getTextureURL = props.getTextureURL;
  const getImageURL = props.getImageURL;
  const setActiveNFT = props.setActiveNFT;
  const ipfsToBucketURL = props.ipfsToBucketURL;
  const requestMint = props.requestMint;

  window.nftData = nftData;

  const threeRef = React.createRef();
  const threePhotoRef = React.createRef();
  const photoComposerRef = React.createRef();
  const battleTextRef = React.createRef();

  const [scene, setScene] = useState();
  const [camera, setCamera] = useState();
  const [clock, setClock] = useState();
  const [sjScene, setSJScene] = useState();
  const [photoScene, setPhotoScene] = useState();
  const [photoSubScene, setPhotoSubScene] = useState();
  const [sceneIndex, setSceneIndex] = useState(0);
  const [groupIndex, setGroupIndex] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const [prevNFTData, setPrevNFTData] = useState({});
  const [kartNameEntry, setKartNameEntry] = useState('');
  const [replayReq, setReplayReq] = useState(0);
  const [controlEntry, setControlEntry] = useState({ ...gameConfig.defaultEntry });
  const [styleInitialized, setStyleInitialized] = useState();

  const [imageDataURL, setImageDataURL] = useState('');
  const [imageRendered, setImageRendered] = useState(false);
  const [renderRequested, setRenderRequested] = useState();
  const [prevScreen, setPrevScreen] = useState(screens.GARAGE);
  const [battle, setBattle] = useState({});
  const [battlers, setBattlers] = useState([]);
  const [battleText, setBattleText] = useState([]);
  const [battlePower, setBattlePower] = useState([100, 100])
  const [battleHit, setBattleHit] = useState([0, 0])
  const [battleAttacking, setBattleAttacking] = useState([0, 0])
  const [battleStarted, setBattleStarted] = useState();
  const [battleEnded, setBattleEnded] = useState();
  const [orbitControls, setOrbitControls] = useState(false);
  const [orbitControlsEnabled, setOrbitControlsEnabled] = useState(false);
  const [garagePanel, setGaragePanel] = useState('equip');
  const [postBattleScreen, setPostBattleScreen] = useState(postBattleScreens.NONE);
  const [showEquipControls, setShowEquipControls] = useState(false);
  const [showNFTList, setShowNFTList ] = useState(true);
  const [showNFTListHelp, setShowNFTListHelp ] = useState(false);
  const [threeElem, setThreeElem ] = useState();

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

  function nftDataToKartConfig(nftData) {
    let kartConfig = {};
    for(let side of ['left', 'right']) {
      if(nftData[side] >= gameConfig.shield_index_start) {
        kartConfig[side] = gameConfig.shields_side[nftData[side] - gameConfig.shield_index_start]?.id || 'empty';
      }
      else {
        kartConfig[side] = gameConfig.weapons_range[nftData[side]]?.id || 'empty';
      }
    }

    kartConfig.front = gameConfig.weapons_melee[nftData.front]?.id || 'empty';
    kartConfig.skin = gameConfig.skin[nftData.skin]?.id || 'SkinPlastic';
    kartConfig.transport = gameConfig.transport[nftData.transport]?.id || 'TransportWheels';

    kartConfig.color = intToHexColor(nftData.color1);

    kartConfig.decal1 = nftData.decal1;
    kartConfig.decal2 = nftData.decal2;
    kartConfig.decal3 = nftData.decal3;
    
    kartConfig.unlockedDecals = nftData.extra1 ? [...nftData.extra1.split(','), '0', '7'] : ['', '0', '7'];

    return kartConfig;
  }

  function validDecal(decal) {
    let isValid = !decal || decal === '0' || controlEntry.unlockedDecals.includes(decal);
    return isValid;
  }

  function kartConfigToNFTData(kartConfig) {
    let nftData = {...gameConfig.baseNFTData};
    let index;

    for(let side of ['left', 'right']) {
      let elem = kartConfig[side];
      if(elem.startsWith('Weapon')) {
        index = gameConfig.weapons_range.findIndex(x => x.id === elem); 
        nftData[side] = index > 0 ? index : 0;
      }
      else if(elem.startsWith('Shield')) {
        index = gameConfig.shields_side.findIndex(x => x.id === elem);
        nftData[side] = index > -1 ? index + gameConfig.shield_index_start: 0;
      }
    }

    index = gameConfig.weapons_melee.findIndex(x => x.id === kartConfig.front);
    nftData.front = index > 0 ? index : 0;
    index = gameConfig.skin.findIndex(x => x.id === kartConfig.skin);
    nftData.skin = index > 0 ? index : 0;
    index = gameConfig.transport.findIndex(x => x.id === kartConfig.transport);
    nftData.transport = index > 0 ? index : 0;

    nftData.color1 = hexColorToInt(kartConfig.color);

    nftData.decal1 = kartConfig.decal1;
    nftData.decal2 = kartConfig.decal2;
    nftData.decal3 = kartConfig.decal3;

    return nftData;
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

  useEffect(() => {
    let changedKeys = characterChanged(nftData, prevNFTData);

    if(changedKeys.length && nftData !== {}) {
      let kartConfig = nftDataToKartConfig(nftData);
      setControlEntry(kartConfig);
      setPrevNFTData({...nftData});
      if(DEBUG_FORCE_BATTLE) {
        startBattle();
      }
    }

  }, [nftData, prevNFTData]);

  function startHidden(name) {
    let hidden = false;
    for(let start of gameConfig.start_hidden) {
      if(name.startsWith(start)) {
        hidden = true;
      }
    }
    return hidden;
  }

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
    if(photoSubScene) {
      styleScene(photoSubScene, controlEntry);
    }
  }, [photoSubScene, controlEntry, styleScene]);

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
          restitution: 0.3,
        })

        // We must add the contact materials to the world
        world.addContactMaterial(physics_physics)

        let lifeformPositioner = gltf.scene.getObjectByName('EmptyLifeform');
        const clipWalk = THREE.AnimationClip.findByName( clips, 'Walk2' );
        const clipThrow = THREE.AnimationClip.findByName( clips, 'Throw' );
        const walkAction = mixer.clipAction( clipWalk );
        const throwAction = mixer.clipAction( clipThrow );
        walkAction.play();

        console.log(JSON.stringify(['clips', clips]));
        
        for(let clip of clips) {
          if(clip.name === 'spider.walk') {
            const clipSpiderWalk = clip;
            const spiderWalkAction = mixer.clipAction( clipSpiderWalk );
            spiderWalkAction.play();
          }
        }

        //const lifeformShape = new CANNON.Box(new CANNON.Vec3(0.25, 1, 0.25))
        const lifeformShape = new CANNON.Sphere(1)
        const lifeformBody = new CANNON.Body({ mass: 5, fixedRotation: true, material: physicsMaterial })
        // lifeformBody.linearDamping = 0.9;
        lifeformBody.addShape(lifeformShape)
        let startPos = lifeformPositioner.position.clone();
        startPos.set(0, 5, 0);
        console.log(JSON.stringify(['lifeform pos: ', lifeformPositioner.position]));
        
        lifeformBody.position.copy(startPos);
        world.addBody(lifeformBody)

        let computer = gltf.scene.getObjectByName('WorldL1Computer');
        computer.children[0].geometry.computeBoundingBox();

        const computerShape = new CANNON.Box(new CANNON.Vec3(0.25, 2, 0.25))
        const computerBody = new CANNON.Body({ mass: 0, material: physicsMaterial })
        computerBody.addShape(computerShape)
        computerBody.position.copy(computer.position);
        world.addBody(computerBody)

        const groundShape = new CANNON.Plane()
        const groundBody = new CANNON.Body({ mass: 0, material: physicsMaterial })
        groundBody.position.copy(new THREE.Vector3(0, 0, 0));
        groundBody.addShape(groundShape)
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
        world.addBody(groundBody)

        let controller = new BasicCharacterController(lifeformPositioner);

        let cannonPhysics = true;

        let lastCallTime = 0;
        let totalTime = 0;
        let jumping = false;

        lifeformBody.addEventListener('collide', (a, b) => {
          console.log(JSON.stringify(['i collided']));
          jumping = false;
        })

        let hitRight = false;

        const shootVelocity = 20; 
        const ballShape = new CANNON.Sphere(0.28)
        const ballGeometry = new THREE.SphereBufferGeometry(ballShape.radius, 32, 32)
        
        function getShootDirection() {
          const forward = new THREE.Vector3(0, 0, 1);
          forward.applyQuaternion(lifeformPositioner.quaternion);
          forward.normalize();
          console.log(JSON.stringify(['vd', forward]));
          return forward;
        }

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

          const ballBody = new CANNON.Body({ mass: 1 })
          ballBody.addShape(ballShape)
          const ballMesh = new THREE.Mesh(ballGeometry, material)

          ballBody.addEventListener('collide', (a) => {
            let b1 = a.body;
            let b2 = a.target;

            if(b1.objId) {
              console.log(JSON.stringify(['ro', b1.objId]));
              removeIds.push(b1.objId);
            }
            if(b2.objId) {
              console.log(JSON.stringify(['ro2', b2.objId]));
              removeIds.push(b2.objId);
            }
            
            if(b1.ballId) {
              console.log(JSON.stringify(['b1 coll']));
              let b1i = 0;
              for(let ballBody of balls) {
                if(ballBody.ballId === b1.ballId) {
                  break;
                }
                b1i++;
              }
              toRemove.push(b1i);
              particles.trigger(b1.position, 0.5);
            }

            if(b2.ballId) {
              console.log(JSON.stringify(['b2 coll']));
              let b2i = 0;
              for(let ballBody of balls) {
                if(ballBody.ballId === b2.ballId) {
                  break;
                }
                b2i++;
              }
              toRemove.push(b2i);
              particles.trigger(b2.position, 0.5);
            }
          })

          ballBody.ballId = ballIndex++;
          ballMesh.ballId = ballBody.ballId;

          ballMesh.castShadow = true
          ballMesh.receiveShadow = true

          world.addBody(ballBody)
          scene.add(ballMesh)
          balls.push(ballBody)
          ballMeshes.push(ballMesh)

          const shootDirection = getShootDirection()
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
          const x = lifeformBody.position.x + offsetter.x;
          let y = lifeformBody.position.y + offsetter.y;
          const z = lifeformBody.position.z + offsetter.z;
          console.log(JSON.stringify(['lbp', lifeformBody.position]));
          
          y = y + 1.2;
          ballBody.position.set(x, y, z)
          ballMesh.position.copy(ballBody.position)

          throwAction.setDuration(0.8).stop().reset().setLoop(THREE.LoopOnce).play();
        })

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
        
        let objs = { }

        // Create the final object to add to the scene
        const baddySpline = new THREE.Line( geometry, lineMaterial );
        scene.add(baddySpline);

        let spiders = [];
        let spiderTimers = [];

        for(let i = 1; i <= 5; i++) {
          let spider = new Spider('Emptyspider00' + i, world, scene);
          spider.setTargetObj(lifeformPositioner);

          let spiderTimer = new TimeTrigger(15, 1);


          spiderTimer.addCallback({
            timeTriggered: (dt, t) => { 
              let angle = Math.random() * Math.PI*2;
              let spiderPos = new THREE.Vector3(14, 0, 0);
              let rotator = new THREE.Euler(0, angle, 0);
              spiderPos.applyEuler(rotator);
              console.log(JSON.stringify(['spider time', dt, t, angle, spiderPos])); 
              spider.enable(spiderPos); 
            }
          });

          spiders.push(spider);
          spiderTimers.push(spiderTimer);
        }
        

        function rotateAroundWorldAxis(obj, axis, radians) {
          let rotWorldMatrix = new THREE.Matrix4();
          rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
          rotWorldMatrix.multiply(obj.matrix);
          obj.matrix = rotWorldMatrix;
          obj.setRotationFromMatrix(obj.matrix);
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

          let delta = clock.getDelta();
          const time = performance.now() / 1000
          const dt = Math.max(time - lastCallTime);
          if(!dt) {
            console.log(JSON.stringify(['not dt', dt]));
          }
          lastCallTime = time;
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
                  break;
                }
              }
            }
            removeIds = [];
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
              world.step(1/60, dt, 0.001);

              // Update ball positions
              for (let i = 0; i < balls.length; i++) {
                ballMeshes[i].position.copy(balls[i].position)
                ballMeshes[i].quaternion.copy(balls[i].quaternion)
              }

              // console.log(JSON.stringify([totalTime, dt, lifeformBody.position]));
              let lPos = lifeformBody.position.clone();
              let height = lifeformBody.position.y - 1;
              lPos.y = height;
              lifeformPositioner.position.copy(lPos);
              //lifeformPositioner.setRotationFromQuaternion(lifeformBody.quaternion);
              let keys = controller._input._keys;

              if(keys.space) {
                if(!jumping) {
                  lifeformBody.velocity.y = 10;
                  if(keys.left) {
                    lifeformBody.velocity.x = -6;
                  }
                  if(keys.right) {
                    lifeformBody.velocity.x = 6;
                  }
                  if(keys.forward) {
                    lifeformBody.velocity.z = -6;
                  }
                  if(keys.backward) {
                    lifeformBody.velocity.z = 6;
                  }
                  jumping = true;
                }
              }

              if(keys.left) {
                if(!jumping) {
                  lifeformBody.velocity.x = -6;
                  lifeformPositioner.rotation.set(0, -Math.PI/2, 0);
                }
              }

              if(keys.right) {
                if(!jumping) {
                  lifeformBody.velocity.x = 6;
                  lifeformPositioner.rotation.set(0, Math.PI/2, 0);
                }
              }

              if(keys.backward) {
                if(!jumping) {
                  lifeformBody.velocity.z = 6;
                  if(keys.left) {
                    lifeformPositioner.rotation.set(0, -Math.PI/4, 0);
                  }
                  else if(keys.right) {
                    lifeformPositioner.rotation.set(0, Math.PI/4, 0);
                  }
                  else {
                    lifeformPositioner.rotation.set(0, 0, 0);
                  }
                }
              }

              if(keys.forward) {
                if(height < 0.1) {
                  lifeformBody.velocity.z = -6;
                  if(keys.left) {
                    lifeformPositioner.rotation.set(0, -3*Math.PI/4, 0);
                  }
                  else if(keys.right) {
                    lifeformPositioner.rotation.set(0, 3*Math.PI/4, 0);
                  }
                  else {
                    lifeformPositioner.rotation.set(0, Math.PI, 0);
                  }
                }
              }
            }
          }

          particles.Step(dt);
          // controller.Update(delta);
          mixer.update(delta);
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

    const light = new THREE.AmbientLight( 0xb0b0b0 ); // soft white light
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

  useEffect(() => {
    if(postBattleScreen !== postBattleScreens.NONE) {
      clearInterval(battleTimer);
      battleTimer = setTimeout(() => {
        if(postBattleScreen === postBattleScreens.RESULT) {
          if(battle.winner === 0) {
            setPostBattleScreen(postBattleScreens.LEVEL_UP);
          }
          else {
            setPostBattleScreen(postBattleScreens.END);
          }
        }
        else if(postBattleScreen === postBattleScreens.LEVEL_UP) {
          setPostBattleScreen(postBattleScreens.PRIZE_PREPARE);
        }
        else if(postBattleScreen === postBattleScreens.PRIZE_PREPARE) {
          setPostBattleScreen(postBattleScreens.PRIZE_RESULT);
        }
        else if(postBattleScreen === postBattleScreens.PRIZE_RESULT) {
          setPostBattleScreen(postBattleScreens.END);
        }
      }, postBattleDelay);

      return () => { clearInterval(battleTimer) }
    }
    else {
      clearInterval(battleTimer);
    }
  }, [postBattleScreen]);

  function getMintUpgradeUI() {
    let ui;

    if(nftData.level === 0) {
      ui = <Fragment>
        <div className="br-text-entry-row-label">
          <input type="text" placeholder={getText('text_kart_name_label')} 
                value={kartNameEntry} onChange={e => setKartNameEntry(e.target.value)} />
        </div>
        <div className="br-text-entry-row-control">
          <BrButton label="Mint" id="render" className="br-button" onClick={render}
                isSubmitting={renderRequested || processingActions['mintWithImage']} />
        </div>
      </Fragment>
    }
    else {
      if(nftData.locked) {
        let nextUpgradeLevel = (Math.floor(nftData.level / 5) + 1) * 5;
        ui = <div className="br-info-message br-full-width">
          <i className="fa fa-info br-info-icon"></i>
          <div>
            { getText('text_locked') }
            <br />
            { getText('text_next_upgrade', { next_upgrade_level: nextUpgradeLevel }) }
          </div>
        </div>
      }
      else {
        ui = <Fragment>
          <div className="br-text-entry-row-label">
            { getText('text_upgrade_save') }
          </div>
          <div className="br-text-entry-row-control">
            <BrButton label="Upgrade" id="upgrade" className="br-button" onClick={render}
                  isSubmitting={renderRequested || processingActions['upgrade']} />
          </div>
        </Fragment>
      }
    }

    return ui;
  }

  function getContractControls() {
    return <div className="br-contract-controls">
      { nftData && 
        <div className="br-text-entry-row">
          { getMintUpgradeUI() }
          
        </div>
      }
    </div>
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

  function kartName(kartTitle) {
    kartTitle = kartTitle || '';
    return kartTitle.replace('A NEAR Kart Called ', '');
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

    let newKartActive = false;
    if(!activeTokenId || activeTokenId === 'new_kart') {
      newKartActive = true;
    }

    nftUI.push(<div className={"br-nft-list-item " + (newKartActive ? 'br-nft-list-item-selected' : '')} 
                    key="new_kart" onClick={e => requestMint() }>
      { getText('text_mint_nft')}
    </div>);

    return <Fragment>
      <div className="br-nft-list flexcroll">
        { nftUI }
      </div>
    </Fragment>
  }

  function dataURLToFile(src, fileName, mimeType){
    return (fetch(src)
        .then(function(res){return res.arrayBuffer();})
        .then(function(buf){return new File([buf], fileName, {type:mimeType});})
    );
  }

  function render() {
    toast(getText('text_creating_image'));
    setRenderRequested(true);
    /* 
     * Convers a hidden threejs canvas to a dataURL
     * setImageDataURL sets the imageDataURL of an offscreen composer element which applys rounded corners etc.
     * This needs a time to update so set kartImageRendered to let that happen
     * In the useEffect for kartImageRendered, dom-to-image does its job and calls saveImageData to upload
     */
    let dataURL = threePhotoRef.current.getElementsByTagName('canvas')[0].toDataURL();
    setImageDataURL(dataURL);
    setImageRendered(true);
  }

  const mintOrUpgrade = useCallback((verifiedImageData) => {
    let newNFTData = kartConfigToNFTData(controlEntry);
    newNFTData.level = nftData.level;
    newNFTData.locked = nftData.locked;

    verifiedImageData.name = kartNameEntry;
    verifiedImageData.nftData = newNFTData;

    if(nftData.level === 0) {
      toast(getText('text_mint_request'));
      execute('mintWithImage', verifiedImageData);
    }
    else {
      if(!nftData.locked) {
        toast(getText('text_upgrade_request'));
        execute('upgrade', verifiedImageData);
      }
      else {
        toast(getText('error_upgrade_kart_locked', 'warning'));
      }
    }
  }, [controlEntry, execute, kartNameEntry, nftData, toast]);

  const saveImageData = useCallback(async (dataURL) => {
    let f = await dataURLToFile(dataURL, 'bla.png', 'image/png');

    try {
      let fd = new FormData();
      fd.append('file', f);
      let r = await fetch(`${serverURL}/upload`, {method: 'POST', headers: {
      }, body: fd})

      let j = await r.json();
      if(j.success) {
        if(true) {
          toast(getText('success_image_upload'));
          localLog('image data ', getImageURL(j.data.cid));
          if(!DEBUG_NO_MINT) {
            mintOrUpgrade(j.data);
          }
        }
      }
      else {
        toast(getText('error_image_upload_failed'), 'error');
      }
    }
    catch(e) {
      toast(getText('error_image_upload_failed'), 'error');
    }

    setImageRendered(false);
    setRenderRequested(false);
  }, [toast, mintOrUpgrade]);

  useEffect(() => {
    if(stateCheck.changed('ImageRendered', imageRendered, false) && imageRendered) { 
      domtoimage.toPng(photoComposerRef.current, { style: { display: 'block'}})
      .then(function (dataUrl) {
         saveImageData(dataUrl);
      })
      .catch(function (error) {
          console.error('Unable to render composed  image', error);
      });
    }
  }, [imageRendered, saveImageData, photoComposerRef]);

  function displayBattleText(battleText) {
    let lines = [];
    let groupLines = [];

    let textGroupIndex = 0;
    for(let group of battleText) {
      if(!battleStarted || textGroupIndex > groupIndex) {
        break;
      }
      let textLineIndex = 0;
      groupLines = [];

      for(let line of group) {
        let isCurrentGroup = textGroupIndex === groupIndex; // Only limit displayed lines for currentGroup

        let activeLineClass = '';

        if(isCurrentGroup && textLineIndex === lineIndex) {
          activeLineClass = 'br-battle-text-line-active';
        }

        let id = `br-battle-text-line-${textGroupIndex}-${textLineIndex}`;
        groupLines.push(<div className={"br-battle-text-line " + activeLineClass} id={id} key={id}>
          {line}
        </div>);

        textLineIndex++;

        if(isCurrentGroup && textLineIndex > lineIndex ) {
          break;
        }
      }
      textGroupIndex++;

      let id = `br-battle-text-group-${textGroupIndex}`;
      lines.push(
        <div className="br-battle-text-group" id={id} key={id}>
          {groupLines.reverse()}
        </div>
      )
    }

    if(lines.length) {
      lines.reverse();
    }

    return <div className="br-battle-text" ref={battleTextRef}>
      {lines}
    </div>
  }

  useEffect(() => {
    setBattleText([]);

    if(screen === screens.BATTLE) {
    }
    else if(screen === screens.GARAGE) {
    }
  }, [screen]);

  function changeScreen(screenID) {
    setPrevScreen(screen);
    setScreen(screenID);
  }

  function startBattle() {
    toast(getText('text_finding_opponent'));
    execute('gameSimpleBattle');
  }

  function watchBattle() {
    toast(getText('text_battle_started'));
    changeScreen(screens.BATTLE)
  }

  function getScreenClass(screenId) {
    let screenClass = 'br-screen-hidden';

    if(screenId === screen) {
      screenClass = 'br-screen-current loading-fade-in-fast';
    }
    else if(screenId === prevScreen) {
      screenClass = 'br-screen-prev loading-fade-out-instant';
    }

    return screenClass;
  }

  useEffect(() => {
    if(battlers.length) {
      changeScreen(screens.BATTLE_SETUP)
    }
    else {
      changeScreen(screens.GARAGE);
    }
  }, [battlers]);

  useEffect(() => {
    if(battleResult && battleResult.metadata) {
      setBattleConfig(battleResult);
      setScreen(screens.BATTLE_SETUP);
    }
  }, [battleResult]);

  function getGaragePanelTabs() {
    let equipActiveClass = garagePanel === 'equip' ? ' br-pill-active ' : '';
    let pimpActiveClass = garagePanel === 'pimp' ? ' br-pill-active ' : '';

    return <div className="br-pills">
      <div className={ "br-pill br-pill-left" + equipActiveClass } onClick={ e => setGaragePanel('equip') }>
        Equipment
      </div>
      <div className={ "br-pill br-pill-right" + pimpActiveClass } onClick={ e => setGaragePanel('pimp') }>
        Pimping
      </div>
    </div> 
  }

  function getMaxWeaponIndexForLevel(level) {
    if(!level) {
      level = 0;
    }
    let weapon_index = Math.max(level + 2, 3);
    return weapon_index;
  }

  function getScreenPostBattle(postBattleScreen) {
    let content;

    if(postBattleScreen === postBattleScreens.RESULT) {
      content = <div className="br-post-battle-panel br-post-battle-result">
        { battle.winner === 0 ?
          <div className="br-post-battle-text br-post-battle-result-won">
            { exclamation(getText('text_you_won')) }
          </div>
          :
          <div className="br-post-battle-text br-post-battle-result-lost">
            { exclamation(getText('text_you_lost')) }
          </div>
        }
      </div>
    }
    else if(postBattleScreen === postBattleScreens.LEVEL_UP) {
      content = <div className="br-post-battle-panel br-post-battle-level-up-start">
        <h3 className="br-post-battle-title br-level-up">
          { exclamation(getText('text_level_up'))}
        </h3>
        <div className="br-post-battle-text br-level-up-level">
          { nftData.level }
        </div>
      </div>
    }
    else if(postBattleScreen === postBattleScreens.PRIZE_PREPARE) {
      content = <div className="br-post-battle-panel br-post-battle-prize-prepare">
        <h3 className="br-post-battle-title br-prize">
          { getText('text_prize') }
        </h3>
        <div className="br-prize-spinner">
          <div className="br-question-mark br-question-mark-anim">

          </div>
        </div>
      </div>
    }
    else if(postBattleScreen === postBattleScreens.PRIZE_RESULT) {

      let prizeSummary;
      let title = exclamation(getText('text_no_prize'));
      let image;
      let decalName;
      title = getText('text_won_prize', {'prize_name': decalName});
      if(battle.prize > 0) {
        decalName  = partIdToName('decals', battleConfig.prize.toString());
        image = getTextureURL('badge', battle.prize.toString());
      }
      else {
        decalName  = getText('text_no_prize');
        prizeSummary = getText('text_better_luck');
      }

      content = <div className="br-post-battle-panel br-post-battle-prize-result">
        <h3 className="br-post-battle-title br-prize">
          {title}
        </h3>
        {
          image ? <img className="br-prize-image" src={image} alt="Prize" /> : ''
        }
        <div className="br-post-battle-text">
          { decalName ?  decalName : '' }
        </div>
        { prizeSummary ?  <div className="br-prize-summary loading-fade-in"> { prizeSummary } </div> : '' }
      </div>
    }
    else if(postBattleScreen === postBattleScreens.END) {
      content = <div className="br-post-battle-panel br-post-battle-end">
        <div className="br-post-battle-end-panel">
          <div className="br-post-battle-end-replay">
            <BrButton label="Replay" id="br-post-battle-replay-button" className="br-button" onClick={e => replay() } />
          </div>
          <div className="br-post-battle-end-garage">
            <BrButton label={ getText('text_return_to_garage') } id="br-post-battle-garage-button" 
                      className="br-button" 
                      onClick={e => changeScreen(screens.GARAGE)} />
          </div>
        </div>
      </div>
    }

    return <div className="br-post-battle-screen">
      { content }
    </div>
  }

  function getScreenGarage() {
    let nftListUI;

    if(true) {
      nftListUI = <div className="br-nft-gallery">
        { true ? displayNFTs(nftList, activeNFT) : ''}
        { !nftList.length && showNFTListHelp ? 
          <div className="br-info-message-start">
            <BrButton label="The System" id="helpMore" className="br-button" onClick={ e => showModal() } />
          </div>
          :
          ''
        }
        { nftList.length && nftData?.level > 0 ?
          <BrButton label="Battle" id="gameSimpleBattle" className="br-button" 
                    onClick={ e => startBattle() }
                    isSubmitting={processingActions['gameSimpleBattle']} />
          :
          ''
        } 
      </div>
    }

    return <Fragment>
      <div className={ "br-screen br-screen-garage " + getScreenClass(screens.GARAGE)}>
        {nftListUI}
        <div className="br-garage loading-fade-in">
          <div className="br-strange-juice-3d" id="br-strange-juice-3d" ref={threeRef}>
            <div className="br-3d-overlay loading-fade-out-slow">
            </div>
            <div className='br-level'>
              {getText('text_level')}
              <div className="br-level-number">
                {nftData?.level || 0}
              </div>
            </div>
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
              { getGaragePanelTabs() }
              { getControlUI(gameConfig, nftData) } 
              { getContractControls() }
            </div>
            :
            ''
          }
        </div>

        <div className="br-offscreen">
          <div className="br-photo-composer" ref={photoComposerRef} style={{ width: wPhoto, height: hPhoto, borderRadius: '20px'}}>
            <img className="br-photo-frame" src={imageFrame} alt="Frame" />
            <img alt="Kart NFT" src={imageDataURL} style={ { width: '400px', height: '400px', borderRadius: '80px' } } />
          </div>
        </div>

      </div>
    </Fragment> 
  }

  function getScreenBattleSetup() {
    return <div className={"br-screen br-screen-battle-setup " + getScreenClass(screens.BATTLE_SETUP)}>
      <div className="br-back-button-holder">
        <BrButton label={<i className="fa fa-arrow-left"></i>} id="go-battle-setup-to-garage" 
                  className="br-button" 
                  onClick={e => changeScreen(screens.GARAGE)} />
      </div>
      <h1>{getText('text_battle_arena')}</h1>
      { battlers.length ?
        <div className="br-battle-setup">
          <div className="br-battle-setup-home">
            <h3>{getText('text_your_kart')}</h3>
            <div className="br-battle-setup-home-kart">
              <img className={"br-battle-viewer-image"} alt="Home Kart" src={getImageURL(battlers[0].media)} />
              <div className="br-battle-setup-home-kart-name">
                {kartName(battlers[0].title)}
              </div>
            </div>
          </div>
          <div className="br-battle-setup-vs">
            <h1>{getText('text_vs')}</h1>
            <BrButton label="Battle" id="battle" className="br-button" onClick={e => watchBattle()} />
          </div>
          <div className="br-battle-setup-away">
            <h3>{getText('text_opponent_kart')}</h3>
            <div className="br-battle-setup-home-kart">
              <img className={"br-battle-viewer-image"} alt="Home Kart" src={getImageURL(battlers[1].media)} />
              <div className="br-battle-setup-away-kart-name">
                {kartName(battlers[1].title)}
              </div>
            </div>
          </div>
        </div> :
        <div className="br-battle-setup-loading-panel">
          <h3>{getText("text_battle_waiting_1")}</h3>
        </div>
      }
     
    </div>
  }

  function replay() {
    setPostBattleScreen(DEBUG_FORCE_POST_BATTLE ? postBattleScreens.RESULT : postBattleScreen.NONE);
    setLineIndex(0);
    setGroupIndex(0);
    setBattlePower([100, 100]);
    setReplayReq(replayReq + 1);
    setBattleEnded(false);
  }

  function getScreenBattle() {
    let ui;
    if(battle.battle && battleText.length) {
      let homeMetadata = battle.metadata[0];
      let awayMetadata = battle.metadata[1];

      ui = <div className="br-battle-viewer">
        <div className={"br-battle-viewer-panel" + 
                        (battleAttacking[0] ? ' br-battle-viewer-attacking ' : '') +
                        (battleHit[0] ? ' box-hit ' : '' )}>
        <div className="br-battle-viewer-kart-details">
          {kartName(homeMetadata.title)}
        </div>
        <div className="br-power-bar-panel">
            <div className={"br-power-bar-outer" + (battleHit[0] ? " br-anim-shake-short br-hurt" : '')}>
              <div className="br-power-bar-inner" style={ { width: `${battlePower[0]}%`}}></div>
            </div>
            <div className="br-power">
              {battlePower[0]}
            </div>
          </div>
          <div className="br-battle-viewer-image-panel">
            <img className={"br-battle-viewer-image " + (battleHit[0] ? "box-hit" : '')} 
                 alt="Home Kart" src={getImageURL(homeMetadata.media)} />
          </div>
        </div>
        <div className="br-battle-viewer-main-panel">

          { postBattleScreen !== postBattleScreens.NONE ?  getScreenPostBattle(postBattleScreen) : '' }

          { (battleAttacking[0] || battleAttacking[1]) && !(battleHit[0] || battleHit[1]) ?
            <div className="br-battle-visuals">
                <div className={"br-battle-arrows br-battle-arrows-anim" +
                                (battleAttacking[1] ? ' br-reverse ' : '')}>
                </div>
            </div>
            :
            ''
          }

          { displayBattleText(battleText) }

        </div>
        <div className={"br-battle-viewer-panel" + 
                        (battleAttacking[1] ? ' br-battle-viewer-attacking ' : '') +
                        (battleHit[1] ? ' box-hit ' : '')}>
          <div className="br-battle-viewer-kart-details">
            {kartName(awayMetadata.title)}
          </div>
          <div className="br-power-bar-panel">
            <div className={"br-power-bar-outer" + (battleHit[1] ? " br-anim-shake-short br-hurt" : '')}>
              <div className="br-power-bar-inner" style={ { width: `${battlePower[1]}%`} }></div>
            </div>
            <div className="br-power">
              {battlePower[1]}
            </div>
          </div>          
          <div className="br-battle-viewer-image-panel">
            <img className={"br-battle-viewer-image " + (battleHit[1] ? "box-hit" : '')} 
                 alt="Away Kart" src={getImageURL(awayMetadata.media)} />
          </div>
        </div>
      </div>
    }
    else {
      ui = <div className="br-screen-battle-no-battle">
        <h3>{ getText('text_battle_loading') }</h3>
      </div>
    }

    return <div className={"br-screen br-screen-battle " + getScreenClass(screens.BATTLE)}>
      <div className="br-back-button-holder">
        <BrButton label={<i className="fa fa-arrow-left"></i>} id="go-battle-to-garage" 
                  className="br-button" 
                  onClick={e => changeScreen(screens.GARAGE)} />
      </div>
      <h2>{ getText('text_battle') }</h2>
      <div className="br-battle-controls-holder">
        <BrButton label="Replay" id="go-battle-to-garage" className="br-button" onClick={e => replay() } />
      </div>
      { ui }
    </div>
  }

  return <div className="br-screen-container">
    { getScreenGarage() }
    { getScreenBattleSetup() }
    { getScreenBattle() }

    <div className="br-photo-booth" ref={threePhotoRef}>
    </div>
  </div>
}

export default Game3D;