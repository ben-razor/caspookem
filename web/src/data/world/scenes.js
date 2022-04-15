const scenes = [
  {
    sceneName: "Scene0",
    startHidden: ['CrateStandard', 'BlueCrateCenter', 'GemCenter'],
    objects: [
      { id: 'CrateStandard001', pos: {x: 8, y: 1, z: 0}},
      { id: 'CrateStandard002', pos: {x: 8, y: 1, z: 2}},
      { id: 'CrateStandard003', pos: {x: 8, y: 3, z: 0}},
      { id: 'CrateStandard004', pos: {x: 10, y: 1, z: 0}},
      { id: 'GemCenter001', pos: {x: 8, y: 5, z: 0}},
    ],
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
    ],
    triggers: [
      { id: 'GemCenter001', classes: ['no-land', 'gem', 'gem-pink-1'], positionType: 'object', objId: 'GemCenter001', geometry: { type: "sphere", radius: 0.5 } },
      { id: 'Door001', classes: ['no-land', 'door'], positionType: 'position', position: [-.5, 2.5, -16], geometry: { type: "box", dims: [3, 2.5, 2] } }
    ],
    door: 'Door_Double',
    bounds: { z: [-1.8, 0.8], x: [-3, 3] },
    startPos: { x: 0, y: 5, z: 5},
    numSpiders: 5,
    requiredSpiders: 3,
    requiredItems: ['gem-pink-1']
  },
  {
    sceneName: "Scene1",
    startHidden: ['CrateStandard', 'BlueCrateCenter', 'GemCenter'],
    objects: [
      { id: 'CrateStandard001', pos: {x: 8, y: 1, z: 0}},
      { id: 'CrateStandard002', pos: {x: 8, y: 1, z: 2}},
      { id: 'CrateStandard003', pos: {x: 8, y: 3, z: 0}},
      { id: 'CrateStandard004', pos: {x: 10, y: 1, z: 0}},
      { id: 'BlueCrateCenter001', pos: {x: -12, y: 1, z: 0}},
      { id: 'BlueCrateCenter002', pos: {x: -12, y: 1, z: -2}},
      { id: 'BlueCrateCenter003', pos: {x: -12, y: 1, z: -4}},
      { id: 'GemCenter001', pos: {x: 8, y: 5, z: 0}},
      { id: 'GemCenter002', pos: {x: -12, y: 3, z: -4}},
    ],
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
      { id: 'BlueCrateCenter001', classes: ['crate'], positionType: 'object', objId: 'BlueCrateCenter001', geometry: { type: "box", dims: [1, 1, 1] } },
      { id: 'BlueCrateCenter002', classes: ['crate'], positionType: 'object', objId: 'BlueCrateCenter002', geometry: { type: "box", dims: [1, 1, 1] } },
      { id: 'BlueCrateCenter003', classes: ['crate'], positionType: 'object', objId: 'BlueCrateCenter003', geometry: { type: "box", dims: [1, 1, 1] } },
    ],
    triggers: [
      { id: 'GemCenter001', classes: ['no-land', 'gem', 'gem-pink-1'], positionType: 'object', objId: 'GemCenter001', geometry: { type: "sphere", radius: 0.5 } },
      { id: 'GemCenter002', classes: ['no-land', 'gem', 'gem-blue-1'], positionType: 'object', objId: 'GemCenter002', geometry: { type: "sphere", radius: 0.5 } },
      { id: 'Door001', classes: ['no-land', 'door'], positionType: 'position', position: [-.5, 2.5, -16], geometry: { type: "box", dims: [3, 2.5, 2] } }
    ],
    door: 'Door_Double',
    bounds: { z: [-1.8, 0.8], x: [-3, 3] },
    startPos: { x: 0, y: 5, z: 0},
    numSpiders: 8,
    requiredSpiders: 5, 
    requiredItems: ['gem-pink-1', 'gem-blue-1']
  },
  {
    sceneName: "Scene2",
    startHidden: ['CrateStandard', 'BlueCrateCenter', 'GemCenter'],
    objects: [
      { id: 'CrateStandard001', pos: {x: 8, y: 1, z: 0}},
      { id: 'CrateStandard002', pos: {x: 8, y: 1, z: 2}},
      { id: 'CrateStandard003', pos: {x: 8, y: 3, z: 0}},
      { id: 'CrateStandard004', pos: {x: 10, y: 1, z: 0}},
      { id: 'CrateStandard005', pos: {x: 15, y: 1, z: -13}},
      { id: 'CrateStandard004', pos: {x: 15, y: 1, z: -15}},
      { id: 'CrateStandard007', pos: {x: 15, y: 3, z: -15}},
      { id: 'BlueCrateCenter001', pos: {x: -12, y: 1, z: 0}},
      { id: 'BlueCrateCenter002', pos: {x: -12, y: 1, z: -2}},
      { id: 'BlueCrateCenter003', pos: {x: -12, y: 1, z: -4}},
      { id: 'GemCenter001', pos: {x: 8, y: 5, z: 0}},
      { id: 'GemCenter002', pos: {x: -12, y: 3, z: -4}},
      { id: 'GemCenter003', pos: {x: 15, y: 5, z: -15}},
    ],
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
      { id: 'BlueCrateCenter001', classes: ['crate'], positionType: 'object', objId: 'BlueCrateCenter001', geometry: { type: "box", dims: [1, 1, 1] } },
      { id: 'BlueCrateCenter002', classes: ['crate'], positionType: 'object', objId: 'BlueCrateCenter002', geometry: { type: "box", dims: [1, 1, 1] } },
      { id: 'BlueCrateCenter003', classes: ['crate'], positionType: 'object', objId: 'BlueCrateCenter003', geometry: { type: "box", dims: [1, 1, 1] } },
    ],
    triggers: [
      { id: 'GemCenter001', classes: ['no-land', 'gem', 'gem-pink-1'], positionType: 'object', objId: 'GemCenter001', geometry: { type: "sphere", radius: 0.5 } },
      { id: 'GemCenter002', classes: ['no-land', 'gem', 'gem-blue-1'], positionType: 'object', objId: 'GemCenter002', geometry: { type: "sphere", radius: 0.5 } },
      { id: 'GemCenter003', classes: ['no-land', 'gem', 'gem-orange-1'], positionType: 'object', objId: 'GemCenter003', geometry: { type: "sphere", radius: 0.5 } },
      { id: 'Door001', classes: ['no-land', 'door'], positionType: 'position', position: [-.5, 2.5, -16], geometry: { type: "box", dims: [3, 2.5, 2] } }
    ],
    door: 'Door_Double',
    bounds: { z: [-1.8, 0.8], x: [-3, 3] },
    startPos: { x: 0, y: 5, z: 0},
    numSpiders: 8,
    requiredSpiders: 10,
    requiredItems: ['gem-pink-1', 'gem-blue-1', 'gem-orange-1']
  }
]

export function getSceneConfig(sceneName) {
  for(let scene of scenes) {
    if(scene.sceneName === sceneName) {
      return scene;
    }
  }
}

export function getNumScenes() {
  return scenes.length;
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