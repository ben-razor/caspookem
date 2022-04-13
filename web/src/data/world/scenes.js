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
    ],
    triggers: [
      { id: 'door', positionType: 'object', objId: 'SceneRoomZeroDoor', geometry: { type: "sphere", radius: 0.5 } }
    ],
    bounds: { z: [-1.8, 0.8], x: [-3, 3] },
    startPos: { x: 0, y: 5, z: 5},
    elems: {
      'SceneRoomZeroDoor': {
        condition: (strangeJuice) => {
          return strangeJuice.evolution > 2;
        }
      }
    },
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