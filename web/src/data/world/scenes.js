const scenes = [
  {
    sceneName: "Scene0",
    obstacles: [ 
      { id: 'computer', classes: [], positionType: 'object', objId: 'WorldL1Computer', geometry: { type: "box", dims: [.2, 2, .2] } },
      { id: 'WorldL1ColumnL', classes: ['no-land'], positionType: 'object', objId: 'WorldL1ColumnL', geometry: { type: "box", dims: [.2, 2.25, .2] } },
      { id: 'WorldL1ColumnR', classes: ['no-land'], positionType: 'object', objId: 'WorldL1ColumnR', geometry: { type: "box", dims: [.2, 2.25, .2] } },
      { id: 'BackWall', classes: ['no-land'], positionType: 'position', position: [0, 0, -16], geometry: { type: "plane", orientation: [0, 0, 0] } },
      { id: 'FrontWall', classes: ['no-land'], positionType: 'position', position: [0, 0, 16], geometry: { type: "plane", orientation: [0, Math.PI, 0] } },
      { id: 'SideWallR', classes: ['no-land'], positionType: 'position', position: [16, 0, 0], geometry: { type: "plane", orientation: [0, -Math.PI / 2, 0] } },
      { id: 'SideWallL', classes: ['no-land'], positionType: 'position', position: [-16, 0, 0], geometry: { type: "plane", orientation: [0, Math.PI / 2, 0] } },
      { id: 'CrateStandard001', classes: ['crate'], positionType: 'object', objId: 'CrateStandard001', geometry: { type: "box", dims: [1, 1, 1] } },
      { id: 'CrateStandard002', classes: ['crate'], positionType: 'object', objId: 'CrateStandard002', geometry: { type: "box", dims: [1, 1, 1] } },
      { id: 'CrateStandard003', classes: ['crate'], positionType: 'object', objId: 'CrateStandard003', geometry: { type: "box", dims: [1, 1, 1] } },
      { id: 'CrateStandard004', classes: ['crate'], positionType: 'object', objId: 'CrateStandard004', geometry: { type: "box", dims: [1, 1, 1] } },
      { id: 'CrateStandard005', classes: ['crate'], positionType: 'object', objId: 'CrateStandard005', geometry: { type: "box", dims: [1, 1, 1] } },
      { id: 'CrateStandard006', classes: ['crate'], positionType: 'object', objId: 'CrateStandard006', geometry: { type: "box", dims: [1, 1, 1] } },
      { id: 'CrateStandard007', classes: ['crate'], positionType: 'object', objId: 'CrateStandard007', geometry: { type: "box", dims: [1, 1, 1] } },
      { id: 'CrateStandard008', classes: ['crate'], positionType: 'object', objId: 'CrateStandard008', geometry: { type: "box", dims: [1, 1, 1] } },
      { id: 'BlueCrateCenter001', classes: ['crate'], positionType: 'object', objId: 'BlueCrateCenter001', geometry: { type: "box", dims: [1, 1, 1] } },
      { id: 'BlueCrateCenter002', classes: ['crate'], positionType: 'object', objId: 'BlueCrateCenter002', geometry: { type: "box", dims: [1, 1, 1] } },
      { id: 'BlueCrateCenter003', classes: ['crate'], positionType: 'object', objId: 'BlueCrateCenter003', geometry: { type: "box", dims: [1, 1, 1] } },
    ],
    triggers: [
      { id: 'Gem001', classes: ['no-land', 'gem', 'gem-pink-1'], positionType: 'object', objId: 'Gem001', geometry: { type: "sphere", radius: 0.5 } },
      { id: 'Door001', classes: ['no-land', 'door'], positionType: 'position', position: [-.5, 2.5, -16], geometry: { type: "box", dims: [3, 2.5, 2] } }
    ],
    door: 'Door_Double',
    bounds: { z: [-1.8, 0.8], x: [-3, 3] },
    startPos: { x: 0, y: 5, z: 5},
    controls: [
      { 
        id: 'drink_strange_juice', 
        icon: 'strange-juice', 
        condition: (strangeJuice, storyInfo) => {
          let display = true;
          if(storyInfo) {
            if(storyInfo.storySection === 'glow') {
              if(storyInfo.storyIndex < 3) {
                display = false;
              }
            }
          }
          return display;
        }
      },
      {
        id: 'electrify', 
        icon: 'plug', 
        condition: (strangeJuice) => {
          return strangeJuice.evolution > 0;
        } 
      },
      { 
        id: 'scavenge_in_bin', 
        icon: 'bin', 
        condition: (strangeJuice) => {
          return strangeJuice.evolution > 1;
        } 
      }
    ]
  },
  {
    sceneName: "SceneBeach",
    storySection: "move-relaxed",
    obstacles: [
      { pos: [1, 0, -1], geometry: { type: "sphere", radius: 0.4 } },
      { pos: [-1, 0, -1], geometry: { type: "sphere", radius: 0.4 } }
    ],
    triggers: [
      { id: 'door', positionType: 'object', objId: 'SceneBeachDoor', geometry: { type: "sphere", radius: 0.5 } }
    ],
    bounds: { z: [-1.8, 0.8], x: [-3, 3] },
    startPos: { x: 0, y: 0, z: 0 }
  }
]

export function getSceneConfig(sceneName) {
  for(let scene of scenes) {
    if(scene.sceneName === sceneName) {
      return scene;
    }
  }
}

export function getObstacle(sceneName, objId) {
  let sceneConf = getSceneConfig(sceneName);
  let obstacle = null;

  if(sceneConf.obstacles) {
    for(let obConfig of sceneConf.obstacles) {

      if(obConfig.objId === objId) {
        obstacle = obConfig;
      }
    }
  }

  return obstacle;
}

export default scenes;