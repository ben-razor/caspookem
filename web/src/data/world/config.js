const config = {
  shield_index_start: 200,
  eyewear: [
    { id: "EyewearEmpty", name: "Empty" },
    { id: "Eyewear3D", name: "3D Glasses" },
    { id: "EyewearAviator", name: "Aviator" },
    { id: "EyewearHacker", name: "Hacker" },
  ],
  headwear: [
    { id: "HeadwearEmpty", name: "Empty" },
    { id: "HeadwearHeadphones", name: "Headphones" },
  ],
  shields_side: [
    { id: "ShieldKitten", name: "Fluffy Kitten"},
    { id: "ShieldKevlar", name: "Kevlar"},
  ],
  skin: [
    { id: "SkinPlastic", name: "Plastic" },
    { id: "SkinCarbonFibre", name: "Carbon Fibre" },
    { id: "SkinAluminium", name: "Aluminium" },
    { id: "SkinSteel", name: "Steel" }
  ],
  transport: [
    { id: "TransportWheels", name: "Wheels" },
    { id: "TransportTracks", name: "Tracks" },
    { id: "TransportDoubleTracks", name: "Double Tracks" },
  ],
  start_hidden: [ 
    'Eyewear', 'Headwear', 'Jewellery', 'Outfit', 'NFT', 'WorldL1Floor', 
  ],
  decal_panels: [ 'DecalFront', 'DecalLeft', 'DecalRight'],
  decals: [
    { id: '0', name: 'Empty'},
    { id: '1', name: 'Heart'},
    { id: '2', name: 'Star'},
    { id: '3', name: 'Pentagram'},
    { id: '4', name: 'Acieed'},
    { id: '5', name: 'Jewel'},
    { id: '6', name: 'Yin-Yang'},
    { id: '7', name: 'NEAR'},
  ],
  "colors": {
    "lightblue": [.1, .4, 1],
    "et": [.3, .3, .3],
    "ghost": [.9, .9, .9],
    "violet": [.6, .2, 1],
    "blue": [0, .3, 1],
    "green": [.15, 1, 0],
    "yellow": [.8, 1, 0],
    "red": [1, 0.02, 0.1],
    "white": [1, 1, 1],
    "glowlightblue": [0, 0.7, 1],
    "glowgreen": [0, 1, 0],
    "glowviolet": [.7, 0, 1],
    "glowpink": [1, 0, 0.1],
  },
  defaultEntry: {
    front: '',
    left: '',
    right: '',
    top: '',
    eyewear: 'Eyewear3D',
    skin: 'SkinPlastic',
    color: '#11aaff',
    eyeColor: '#ff00ff',
    pupilColor: '#ffff00',
    decal1: '7',
    decal2: '0',
    decal3: '0',
    unlockedDecals: ['', '0', '7']
  },
  baseNFTData: {
    "version": 1,
    "level": 0,
    "left": 0,
    "right": 0,
    "top": 0,
    "front": 0,
    "skin": 3,
    "transport": 0,
    "color1": 4473924,
    "color2": 0,
    "ex1": 0,
    "ex2": 0,
    "locked": false,
    "decal1": "7",
    "decal2": "",
    "decal3": "",
    "extra1": "",
    "extra2": "",
    "extra3": ""
  },
  casBucketURL: 'https://casper-game-1.storage.googleapis.com/'
}

export function partIdToName(part, id) {
  let name = '';
  let partConfig = config[part];

  if(partConfig) {
    let item = partConfig.find(x => x.id === id);

    if(item) {
      name = item.name || '';
    }
  }

  return name;
}

export function getAssetURL(fileName, type) {
  let assetURL = '';

  assetURL = config.casBucketURL + type + '/' + fileName;

  return assetURL;
}

export default config;