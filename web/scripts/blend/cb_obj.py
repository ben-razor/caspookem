import os
import bpy, bgl, blf, mathutils
import subprocess
import json
import string
from random import choice, random

def changeMaterial():
    print('Change material...')

def changeTexture():
    print('Changing texture...')

def changeMesh():
    print('Changing mesh...')

def pc(collection, attrs = []):
    for c in collection:
        if attrs == []:
            print(c)
        else:
            attrVals = {}
            for a in attrs:
                attrVals[a] = getattr(c, a)
            print(attrVals)

def exclude_collections(names, exclude=True):
    for name in names:
        exclude_collection(name, exclude)

def exclude_collection(name, exclude=True):
    layer_collections = bpy.context.layer_collection.children
    if name in layer_collections:
        layer_collections[name].exclude = exclude
    else:
        print(f"No collection with name {name}")

def find_obj(attr = '', val = '', collection = None, exact=False, starts_with=False):
    """Find objects based on a search string
    :param attr: Search this object property
    :param hide: Search object property for this value
    :param object|str collection: Limit search to objs with names containing this string. Or pass specific coll object.
    """
    if collection == None:
        coll = bpy.data.objects
    elif isinstance(collection, str):
        coll = bpy.data.collections[collection].all_objects
    else:
        coll = collection

    objs = []
    for o in coll:

        if val == '' or attr == '':
            objs.append(o)
        else:
            attrVal = getattr(o, attr)
            if exact:
                if attrVal == val:
                    objs.append(o)
            elif starts_with:
                if attrVal.find(val) == 0:
                    objs.append(o)
            else:
                if attrVal.find(val) != -1:
                    objs.append(o)
    return objs

def set_mode(mode):
    try:
        bpy.ops.object.mode_set(mode=mode)
    except:
        pass

def createText(name, text):
    set_mode('OBJECT')
    bpy.ops.object.text_add();
    sel = get_sel()
    added = sel[0]
    added.name = name
    added.data.body = text

def changeFont(objs, fontName):
    for o in objs:
        o.data.font = bpy.data.fonts[fontName]

def alphaToObject():
    l = string.ascii_letters + string.digits
    for c in l:
        set_mode('OBJECT')
        cObj = find_obj("name", "Letter-")
        print(cObj)
        sel_obj(cObj)
        try:
            bpy.ops.object.convert(target='MESH')
        except:
            pass

def setActive(obj):
    bpy.context.scene.objects.active = obj

def extrude(objs, amount):
    for obj in objs:
        set_mode('OBJECT')
        setActive(obj)
        set_mode('EDIT')
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.mesh.extrude_region_move(
            MESH_OT_extrude_region={"mirror":False}, 
            TRANSFORM_OT_translate={
                "value":(0, 0, amount), 
                "constraint_axis":(False, False, True), 
                "constraint_orientation":'NORMAL', 
                "mirror":False, 
                "proportional":'DISABLED', 
                "proportional_edit_falloff":'SMOOTH', 
                "proportional_size":1, 
                "snap":False, 
                "snap_target":'CLOSEST', 
                "snap_point":(0, 0, 0), 
                "snap_align":False, 
                "snap_normal":(0, 0, 0), 
                "texture_space":False, 
                "remove_on_cancel":False, 
                "release_confirm":False
            }
        )

def decimate(objs, ratio, apply):
    addModifiers(objs, "DECIMATE", {"ratio": ratio}, apply)

def addModifiers(objs, name, propVals, apply = False):
    for o in objs:
        sel_obj([o])
        bpy.context.scene.objects.active = o
        bpy.ops.object.modifier_add(type=name)
        modObj = activeObj()
        mod = modObj.modifiers[len(o.modifiers) - 1]
        for prop in propVals:
            val = propVals[prop]
            setattr(mod, prop, val)
        if apply:
            bpy.ops.object.modifier_apply(modifier=mod.name)

def activeObj():
        return bpy.context.scene.objects.active

def createAlphabet(type = 'all'):
    if type == 'lower':
        l = string.ascii_lowercase
    elif type == 'upper':
        l = string.ascii_uppercase
    else:
        l = string.ascii_letters
    createLetters(l)

def createNumbers():
    l = string.digits
    createLetters(l)

def createAlpha():
    createAlphabet()
    createLetters()

def createLetters(letters):
    for c in letters:
        createText("Letter-" + c, c)

def find_name(name, exact=False, starts_with=False):
    return find_obj('name', name, exact=exact, starts_with=starts_with)

def sel_name(name):
    objs = find_obj('name', name)
    sel_obj(objs)

def sel_obj(objects):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:
        o.select_set(state=True)

def get_sel(sceneName = None):
    curScene = bpy.context.scene
    if sceneName != None:
        cScene(sceneName)
    newScene = bpy.context.scene
    objs = bpy.context.selected_objects
    cScene(curScene.name)
    return objs

def addSelToGroup(groupName):
    sel = bpy.context.selected_objects
    g = bpy.data.groups[groupName]

    for o in sel:
        if not g.objects.get(o.name):
            g.objects.link(o)

def rand_pos_y(objs, max_dist):
    for o in objs:
        new_y = o.location.y + (random() * max_dist)
        o.location.y = new_y
    return rand_pos_y

def cScene(sceneName):
    bpy.context.screen.scene = bpy.data.scenes[sceneName]

def linkObj(objs, sceneName = None, unlink = False):
    curScene = bpy.context.scene
    if sceneName != None:
        cScene(sceneName)
    newScene = bpy.context.scene

    for o in objs:
        if unlink:
            if newScene.objects.get(o.name):
                bpy.context.scene.objects.unlink(o)
        else:
            if not newScene.objects.get(o.name):
                bpy.context.scene.objects.link(o)
    cScene(curScene.name)

def renameArmatures():
    armatures = find_obj('name', 'Armature.')
    count = 1
    for a in armatures:
        newName = 'FanArmature' + str(count)
        print('Renaming ' + a.name + ' to ' + newName)
        a.name = newName
        count = count + 1

def parentBone(armature, childName, parentName):
    bpy.context.scene.objects.active = armature
    bpy.ops.object.mode_set(mode='EDIT')
    eb = armature.data.edit_bones
    child = find_obj('name', childName, eb)[0]
    parent = find_obj('name', parentName, eb)[0]
    child.parent = parent
    bpy.ops.object.mode_set(mode='OBJECT')

def addBoneConstraint(a, boneName, constraintType, target, targetBone):
    bone = a.pose.bones[boneName]
    cons = bone.constraints
    crCons = find_obj('name', constraintType, cons)

    if len(crCons) == 0:
        cons.new(constraintType.upper().replace(' ', '_'))
        con = cons[constraintType]
        con.target = target
        con.subtarget = targetBone.name
        con.target_space = 'POSE'
        con.owner_space = 'POSE'
        if constraintType == 'Copy Location':
            con.use_offset = True 
        else:
            con.use_offset = False

def addMultiCRs(boneName, constraintType):
    ca = bpy.data.objects['ControlArmature']
    cb = ca.pose.bones[boneName]
    fas = find_obj('name', 'FanArmature')
    for fa in fas:
        addBoneConstraint(fa, boneName, constraintType, ca, cb)

def setMultiCRs(boneName, constraintType):
    target = bpy.data.objects['ControlArmature']
    targetBone = target.pose.bones[boneName]
    fas = find_obj('name', 'FanArmature')
    for fa in fas:
        con = fa.pose.bones[boneName].constraints[constraintType]
        con.target = target
        con.subtarget = targetBone.name
        con.target_space = 'POSE'
        con.owner_space = 'POSE'

def linkCrowd(unlink = False):
    crowdSections = [
        'LeftCrowd', 'RightCrowd', 'CrowdScene', 'BackCrowd',
        'BackLeftCrowd', 'BackRightCrowd'
    ]
    for cs in crowdSections:
        o = get_sel(cs)
        linkObj(o, 'Scene', unlink)

def findMaterials(namePart, exact=False, starts_with=False):
    mats = bpy.data.materials
    return find_obj('name', namePart, mats, exact=exact, starts_with=starts_with)

def setMaterial(objs, material):
    for o in objs:
        o.active_material = material

def clearArm():
    bpy.ops.object.mode_set(mode='OBJECT')
    a = find_obj("name", "Armature")
    sel_obj(a)
    bpy.context.scene.objects.active = a[0]
    bpy.ops.object.mode_set(mode='POSE')
    bpy.ops.pose.select_all(action="SELECT")
    bpy.ops.pose.transforms_clear()
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.context.scene.update()

def export_to_fbx(use_selection=False, axis_up="Z", axis_forward="Y", out_file=None):
    """Exports blender file to fbx.

    Writes into directory of current blender file but with extension fbx.
    """
    if out_file:
        bpy.ops.export_scene.fbx(use_selection=use_selection, axis_forward=axis_forward, 
            axis_up=axis_up, filepath=out_file, apply_scale_options="FBX_SCALE_ALL"
        )
    else:
        print("No out_file given")

def get_blend_file_dir():
    """Get the directory of the current blender file."""
    return os.path.dirname(bpy.data.filepath)

def get_blend_filename_base():
    """Get the file name of the current blender file minus extension."""
    return os.path.splitext(os.path.basename(bpy.data.filepath))[0]

def get_blend_filepath_base():
    """Get the file path of the current blender file minus extension."""
    return os.path.splitext(bpy.data.filepath)[0]

def get_output_filename(ext):
    """Gets the filepath of the current blender file but with the extension replaced.

    :param str ext: The file extension to use
    """
    outFile = get_blend_filepath_base() + "." + ext
    return outFile

def enable_layers(layersToEnable = []):
    """Enables the named layers.
    
    Unlikely to work in Blender versions that use collections instead of layers.
    """
    layers = bpy.data.scenes["Scene"].layers
    for i in range(0, len(layers)):
        if i in layersToEnable:
            layers[i] = True
        else:
            layers[i] = False

def clearVG(obj, groupNames = []):
    if obj:
        for vkey in obj.vertex_groups.keys():
            if vkey not in groupNames:
                obj.vertex_groups.remove(obj.vertex_groups[vkey])

def sel_objs_to_clipboard(sep = ","):
    """Copies the names of the currently selected blender objects to clipboard.
    """
    objs = get_sel()
    selectedNames = [o.name for o in objs]
    selectedNamesStr = sep.join(selectedNames)
    copy2clip(selectedNamesStr) 
    print("{0} copied to clipboard".format(selectedNamesStr))

def move_to_layer(objs, layerNum):
    """Moves a set of objects to a different layer.

    Unlikely to work in recent blender as layers have been replaced
    by collections/view layers.
    """
    for o in objs:
        if o.layers[layerNum] != True:
            newLayers = [False] * 20
            newLayers[layerNum] = True
            o.layers = newLayers

def get_json_from_js(f):
    """Gets JSON from between lines containing jsonVariableStart and jsonVariableEnd in a JS file.

    :param f: File object for reading
    :returns: Object returned by json.loads
    """
    inJSON = False
    jsonString = ""
    for line in f:
        if "jsonVariableStart" in line:
            inJSON = True
            continue
        elif "jsonVariableEnd" in line:
            inJSON = False
            continue

        if inJSON:
            jsonString += line

    f.close()

    jsonData = json.loads(jsonString)
    return jsonData

def find(obj_list, key, val):
    """Get first object with key == val in list of objects."""
    match = None
    for x in obj_list:
        if x.get(key) == val:
            match = x
    return match

def get_material_from_obj(o, search_string):
    """Gets a material from a blender object whose name contains the search_string.

    :param o: A blender object
    :param search_string: A string to test agains the material name
    :returns: A blender material or None
    """
    material = None

    for ms in o.material_slots:
        if search_string in ms.name:
            material = ms.material
    return material

def set_mat_bsdf_property(mat, property, value):
    input = 0
    principled = mat.node_tree.nodes["Principled BSDF"]
    principled.inputs[property].default_value = value 

def set_mat_color(mat, colour, emission=False):
    """Set diffuse colour of a material using an rgb list
    """
    if len(colour) == 3:
        colour.append(1)

    if mat.use_nodes:
        principled = mat.node_tree.nodes["Principled BSDF"]

        if not emission:
            principled.inputs["Base Color"].default_value = colour
        else:
            principled.inputs["Emission"].default_value = colour
    else:
        mat.diffuse_color = colour

def get_mat_color(mat):
    """Get the diffuse colour of a material as an rgb list
    """
    if mat.use_nodes:
        principled = mat.node_tree.nodes["Principled BSDF"]
        return principled.inputs["Base Color"].default_value
    else:
        return list(mat.diffuse_color)

def hide_objs(obj_search_str="", hide=True, collection=None):
    """Hide or show objects based on a search string
    :param obj_search_str: Objects with name containing this will be shown/hidden
    :param hide: Pass False to show instead of hide
    :param object|str collection: Limit hide/show colls with names containing this string. Or pass specific coll object.
    """
    if not isinstance(obj_search_str, list):
        obj_search_str = [obj_search_str]
    
    for appType in obj_search_str:
        print(f'coll {collection}')
        objs = find_obj("name", appType, collection)

        for o in objs:
            o.hide_viewport = hide 
            o.hide_render = hide 

def register():
    print("Register cb_obj")

def unregister():
    print("Unregister cb_obj")

def hide_objs(objs, hide=True):
    for o in objs:
        o.hide_viewport = hide
        o.hide_render = hide

def hide_collection(name, hide=True):
    collection = bpy.data.collections[name]
    collection.hide_viewport = hide
    collection.hide_render = hide

def text_compare(left, right, exact=True):
    if exact:
        return left == right
    else:
        return left in right

def disable_collection(name, hide=True, exact=True):
    vl = bpy.context.scene.view_layers[0]
    lc = vl.layer_collection

    for c in lc.children:
        if text_compare(name, c.name, exact):
            c.exclude = hide 
        else:
            for c1 in c.children:
                if text_compare(name, c1.name, exact):
                    c1.exclude = hide
                else:
                    for c2 in c1.children:
                        if text_compare(name, c2.name, exact):
                            c2.exclude = hide 
                        else:
                            for c3 in c2.children:
                                if text_compare(name, c3.name, exact):
                                    c3.exclude = hide 

def enable_collections(names, exact=True):
    for name in names:
        disable_collection(name, False, exact)

def disable_collections(names, exact=True):
    for name in names:
        disable_collection(name, True, exact)

def set_color(mat_name, color, colors):
    m = findMaterials(mat_name, exact=True)

    if len(m):
        if color.startswith('glow'):
            set_mat_color(m[0], [0, 0, 0])
            set_mat_color(m[0], get_color(color, colors), emission=True)
        else:
            set_mat_color(m[0], get_color(color, colors))
            set_mat_color(m[0], [0, 0, 0], emission=True)
    else:
        print(f'Material not found: {mat_name}')

def set_material(obj_name, mat_name):
    m = findMaterials(mat_name)
    print('mmmat', mat_name, m, name)
    if len(m):
        set_materials(find_name(name, starts_with=True), m[0])
    else:
        print(f'Material not found: {config["material"]}')

def config_elem(config, position, colors):
    name = f'{config["name"]}{position}'

    if 'color' in config:
        set_color(name, config['color'], colors)
    if 'material' in config:
        set_material(name, config['material'])

def config_extra(config, position, colors):
    if 'extra' in config:
        for extra in config['extra']:
            config_elem(extra, position, colors)

def render_image(token_id, w, h):
    bpy.context.scene.render.filepath = f'/home/chrisb/dev/crypto1/casper/casper-sp-game-1/artwork/render/nft/v1/{token_id}.png'
    bpy.context.scene.render.resolution_x = w
    bpy.context.scene.render.resolution_y = h 
    bpy.ops.render.render(write_still=True)

def get_casper_defines(key):
    defines = {
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
        }
    }

    if key:
        return defines[key]
    else:
        return defines

def make_random_caspers():
    all_colors = get_casper_defines('colors')

    eyewear = ['Empty', '3D']
    headwear = ['Empty', 'Headphones']
    skin_colors = [x for x in all_colors if 'glow' not in x]
    eye_colors = ['white']
    pupil_colors = [x for x in all_colors if 'glow' in x]
    
    token_id = 0

    for ew in eyewear:
        for hw in headwear:
            for sc in skin_colors:
                if ew == 'Empty':
                    for ec in eye_colors:
                        for pc in pupil_colors:
                            metadata = get_casper_metadata(token_id, ew, hw, sc, ec, pc)
                            style_casper(metadata)
                            token_id = token_id + 1
                else:
                    metadata = get_casper_metadata(token_id, ew, hw, sc, 'white', 'glowgreen')
                    style_casper(metadata)
                    token_id = token_id + 1

def style_default_casper():
    metadata = get_casper_metadata(4, 'Empty', 'Headphones', 'violet', 'white', 'glowgreen')
    style_casper(metadata)

def get_casper_metadata(token_id, eyewear, headwear, skin_color, eye_color, pupil_color):
    nft_metadata = {
        'token_id': token_id,
        'name': 'Casperform V1',
        'eyewear': eyewear,
        'headwear': headwear,
        'skin_type': 'Plastic',
        'skin_color': skin_color,
        'eye_color': eye_color,
        'pupil_color': pupil_color
    }
    return nft_metadata

def style_casper(nft_metadata):
    print(nft_metadata)
    colors = get_casper_defines('colors')

    config = {
        'token_id': nft_metadata['token_id'],
        'width': 400,
        'height': 400,
        'start_collection_hidden': ['World', 'Headwear', 'Eyewear'],
        'name': nft_metadata['name'],
        'eyewear': 'Eyewear' + nft_metadata['eyewear'],
        'headwear': 'Headwear' + nft_metadata['headwear'],
        'skin_type': nft_metadata['skin_type'],
        'skin_color': nft_metadata['skin_color'],
        'eye_color': nft_metadata['eye_color'],
        'pupil_color': nft_metadata['pupil_color'],
    }

    disable_collections(config['start_collection_hidden'])
    enable_collections([config['eyewear'], config['headwear']])

    set_color('MatBody', config['skin_color'], colors)
    set_color('MatEye', config['eye_color'], colors)
    set_color('MatPupil', config['pupil_color'], colors)

    render_image(config['token_id'], config['width'], config['height'])

def style_fluence_scene(config, defines):
    topology = config['topology']
    start_hidden = config['start_hidden']
    start_invisible = config.get('start_invisible', [])
    side = config['side']
    back = config['back']
    front = config['front']
    logo_gems = config.get('logo_gems', {})
    styling = config['styling']

    colors = defines['colors']

    bpy.context.scene.camera = find_obj("name", "Camera")[0]

    for n in start_hidden:
        disable_collection(n, exact=False)

    for n in start_invisible:
        objs = find_name(n)
        hide_objs(objs)

    if topology == 'star':
        disable_collection('NetworkStar', False)
    elif topology == 'ring':
        disable_collection('NetworkRing', False)
    elif topology == 'mesh':
        disable_collection('NetworkStar', False)
        disable_collection('NetworkRing', False)

    if topology == 'ring':
        disable_collection('LogoFront', False)
        if find_obj("name", "CameraRing"):
            bpy.context.scene.camera = find_obj("name", "CameraRing")[0]
    else:
        disable_collection('LogoCenter', False)

    front_name = f'{front["name"]}Front'
    side_name = f'{side["name"]}Side'
    back_name = f'{back["name"]}Back'

    if topology != 'ring':  # Topology ring has logo at the front
        disable_collection(front_name, False)

    disable_collection(side_name, False)
    disable_collection(back_name, False)

    config_elem(front, 'Front', colors)
    config_elem(side, 'Side', colors)
    config_elem(back, 'Back', colors)
    config_extra(front, 'Front', colors)
    config_extra(side, 'Side', colors)
    config_extra(back, 'Back', colors)

    for k, v in styling.items():
        if 'material' in v:
            m = findMaterials(v['material'], exact=True)
            print('matm', m, k)
            if len(m):
                exact = True

                if 'exact' in v:
                    exact = v['exact']
                objs = find_name(k, exact=exact)

                set_materials(objs, m[0])
            else:
                print(f'Material not found: {m}')
        elif 'color' in v:
            mats = findMaterials(k, exact=True)
            if len(mats):
                set_mat_colors(mats, get_color(v['color'], colors))
            else:
                print(f'Material not found: {k}')

    for k, v in logo_gems.items():
        objs = find_name(k, starts_with=True)
        hide_objs(objs, False)

        if 'material' in v:
            m = findMaterials(v['material'], exact=True)
            print('matm', m, k)
            if len(m):
                exact = True

                if 'exact' in v:
                    exact = v['exact']
                objs = find_name(k, exact=exact)

                set_materials(objs, m[0])
            else:
                print(f'Material not found: {m}')
        elif 'color' in v:
            mats = findMaterials(k, exact=True)
            if len(mats):
                set_mat_colors(mats, get_color(v['color'], colors))
            else:
                print(f'Material not found: {k}')

def get_color(color, color_defines):
    if isinstance(color, str):
        return color_defines[color]
    else:
        return color

def get_fluence_defines():
    defines = {
        'colors': {
            'diamond': [ 0.45, 0.41, 0.47 ],
            'flubie': [ 1, 0.02, 0.2],
            'emerald': [ 0.01, 0.227, 0],
            'onyx': [0, 0, 0],

            'cloth_fluence': [0.21, 0.04, 0.08],
            'cloth_gold': [0.21, 0.16, 0.05],
            'cloth_silk': [0.21, 0.21, 0.21],
            'cloth_night': [0.03, 0.03, 0.03],
            'cloth_aqua': [0.03, 0.1, 0.2],

            'cloth_cerebrum': [0.02, 0.03, 0.02],
            'cloth_earth': [0.007, 0.01, 0],
            'cloth_psy': [0.05, 0.02, 0.05],
            'cloth_awakening': [0, 0.02, 0.06],

            'cloth_dev_fluence': [0.02, 0.003, 0.004],
            'cloth_dev_silver': [0.05, 0.05, 0.05],
            'cloth_dev_blue': [0.009, 0.028, 0.06],

            'network_fluence': [0.05, 0.01, 0.02],
            'network_gold': [0.1, 0.08, 0.04],
            'network_dark': [0.01, 0.015, 0.01],
            'network_aqua': [0.04, 0.1, 0.1],
            'network_chlorophyll': [0.04, 0.08, 0],

            'flurofluence': [1, 0, 0.1], 
            'flurogreen': [0.1, 1, 0],
            'fluroviola': [1, 0, 0.7],
            'fluroaqua': [0, 0.2, 1],

            'hoghog': [0.4, 0.3, 0.3],
            'hogbrown': [0.4, 0.08, 0.02],
            'hogyellow': [0.4, 0.4, 0],

            'airhead': [0.3, 0.2, 0.3],
            'airslimy': [0.05, 0.35, 0.04],
            'airsuit': [0.1, 0.2, 0.35],

            'glowfluence': [5, 0, 0.2],
            'glowyellow': [5, 3, 0],
            'glowpearl': [3, 5, 3],

            'coralblue': [0, 0, 0.8],
            'coralfluence': [1, 0, 0.1],
            'coraldark': [0.01, 0, 0.01],

            'fluagaric_fluence': [0.22, 0, 0.05],
            'fluagaric_aqua': [0, 0.03, 0.04],
            'fluagaric_purple': [0.075, 0.04, 0.22],

            'neuron_fluence': [0.8, 0.16, 0.4],
            'neuron_aqua': [0, 0.26, 0.8],
            'neuron_clean': [0.2, 0.45, 0.22],
        }
    }

    return defines


def get_fluence_options():
    options = {
        "topologies": ["ring", "star", "mesh"],
        "investor": {
            "type": "investor",
            "network": {
                "type": "material",
                "options": ["Gold", "Silver", "Flumium", "FiberOptic"]
            },
            "logo": {
                "Logo": {
                    "type": "material",
                    "options": ["Gold", "Silver", "Flumium"]
                },
                "LogoGem": {
                    "type": "color",
                    "options": ["diamond", "flubie", "emerald"]
                }
            },
            "logo_gems": {
                "LogoDiamondRingCross": {
                    "type": "material",
                    "options": ["Gold", "Silver", "Flumium"]
                },
                "LogoDiamondRingDiag": {
                    "type": "material",
                    "options": ["Gold", "Silver", "Flumium"]
                },
                "LogoDiamondBar": {
                    "type": "material",
                    "options": ["Gold", "Silver", "Flumium"]
                }
            },
            "surface": {
                "Surface": {
                    "type": "color",
                    "options": ["cloth_fluence", "cloth_gold", "cloth_silk"]
                },
                "SurfaceNetwork": {
                    "type": "color",
                    "options": ["flurofluence", "flurogreen", "fluroviola", "fluroaqua"]
                }
            },
            "items": {
                "Flubie": {
                    "type": "color",
                    "options": ["diamond", "flubie", "emerald"]
                },
                "Crystal": {
                    "type": "color",
                    "options": ["diamond", "flubie", "emerald", "onyx"]
                },
                "Coin": {
                    "type": "material",
                    "options": ["Gold", "Silver", "Flumium"]
                }
            }
        },
        "dev": {
            "type": "dev",
            "network": {
                "type": "material",
                "options": ["PinkLED", "GreenLED", "BlueLED", "FiberOptic"]
            },
            "logo": {
                "Logo": {
                    "type": "color",
                    "options": ["Fluicon"]
                },
                "LogoGem": {
                    "type": "color",
                    "options": ["diamond", "flubie", "emerald"]
                }
            },
            "logo_gems": {
                "LogoDiamondRingCross": {
                    "type": "color",
                    "options": ["PinkLED", "GreenLED", "BlueLED"]
                }
            },
            "surface": {
                "Surface": {
                    "type": "color",
                    "options": ["cloth_dev_fluence", "cloth_dev_silver", "cloth_dev_blue"]
                },
                "SurfaceNetwork": {
                    "type": "color",
                    "options": ["network_fluence", "network_dark", "network_aqua"]
                }
            },
            "items": {
                "Aquafish": {
                    "type": "color",
                    "options": ["flurofluence", "flurogreen", "fluroviola", "fluroaqua"]
                },
                "Airhead": {
                    "type": "color",
                    "options": ["airhead", "airslimy", "airsuit"]
                },
                "Flugelhog": {
                    "type": "color",
                    "options": ["hoghog", "hogbrown", "hogyellow"]
                },
                "Coral": {
                    "type": "color",
                    "options": ["coralfluence", "coralblue", "coraldark"]
                },
                "Pearl": {
                    "type": "color",
                    "options": ["glowfluence", "glowyellow", "glowpearl"],
                    "extra_to": "Coral"
                }
            }
        },
        "community": {
            "type": "community",
            "network": {
                "type": "material",
                "options": ["Gold", "Silver", "Flumium", "FiberOptic"]
            },
            "logo": {
                "Logo": {
                    "type": "material",
                    "options": ["Gold", "Silver", "Flumium"]
                }
            },
            "surface": {
                "Surface": {
                    "type": "color",
                    "options": ["cloth_cerebrum", "cloth_earth", "cloth_psy", "cloth_awakening"]
                },
                "SurfaceNetwork": {
                    "type": "color",
                    "options": ["network_fluence", "network_gold", "network_chlorophyll"]
                }
            },
            "items": {
                "FlibertyCap": {
                    "type": "material",
                    "options": ["Gold", "Silver", "Flumium", "FiberOptic"]
                },
                "FluAgaric": {
                    "type": "color",
                    "options": ["fluagaric_fluence", "fluagaric_aqua", "fluagaric_purple"]
                },
                "Neuron": {
                    "type": "color",
                    "options": ["neuron_fluence", "neuron_aqua", "neuron_clean"]
                }
            }
        }
    }

    return options

def get_nft_metadata_dev():
    metadata = {
        "type": "dev",
        "topology": "mesh",
        "NetworkRing": "PinkLED",
        "NetworkStar": "FiberOptic",
        "Surface": "cloth_dev_blue",
        "SurfaceNetwork": "fluroviola",
        "logo_gems": [
            {"type": "LogoDiamondRingCross", "material": "GreenLED"},
        ],
        "front": {
            "type": "Aquafish",
            "color": "flurofluence"
        },
        "side": {
            "type": "Flugelhog",
            "color": "hoghog",
        },
        "back": {
            "type": "Coral",
            "color": "coralfluence",
            "pearl_color": "glowpearl"
        }
    }

    return metadata

def style_dev(nft_metadata):
    defines = get_fluence_defines()

    front = nft_metadata['front']
    side = nft_metadata['side']
    back = nft_metadata['back']

    config = {
        'topology': nft_metadata['topology'],
        'start_hidden': ['Logo', 'Network', 'Aquafish', 'Flugelhog', 'Coral', 'Airhead'],
        'start_invisible': ['LogoDiamond'],

        'side': { 'name': side['type'] },
        'back': { 'name': back['type'] } ,
        'front': { 'name': front['type'] },

        'logo_gems': {},

        'styling': {
            'Surface': { 'color': nft_metadata['Surface']},
            'SurfaceNetwork': { 'color': nft_metadata['SurfaceNetwork']},
            'Logo': { 'material':  'Fluicon' },
            'NetworkRing': { 'material': 'PinkLED', 'exact': False},
            'NetworkStar': { 'material': 'GreenLED', 'exact': False}
        }
    }

    copy_config_style(front, 'front', config)
    copy_config_style(side, 'side', config)
    copy_config_style(back, 'back', config)

    if front['type'] == 'Coral':
        config['front']['extra'] = [ { 'name': 'Pearl', 'color': front['pearl_color']}]

    if side['type'] == 'Coral':
        config['side']['extra'] = [ { 'name': 'Pearl', 'color': side['pearl_color']}]

    if back['type'] == 'Coral':
        config['back']['extra'] = [ { 'name': 'Pearl', 'color': back['pearl_color']}]

    for gem in nft_metadata['logo_gems']:
        config['logo_gems'][gem['type']] = {
            "material": gem['material'], "exact": False
        }

    if 'NetworkRing' in nft_metadata:
        config['styling']['NetworkRing']['material'] = nft_metadata['NetworkRing']

    if 'NetworkStar' in nft_metadata:
        config['styling']['NetworkStar']['material'] = nft_metadata['NetworkStar']

    style_fluence_scene(config, defines)

def get_nft_metadata_nature():
    metadata = {
        "type": "nature",
        "topology": "mesh",
        "NetworkRing": "Silver",
        "NetworkStar": "FiberOptic",
        "Surface": "cloth_earth",
        "SurfaceNetwork": "network_gold",
        "front": {
            "type": "FlibertyCap",
            "material": "Gold"
        },
        "side": {
            "type": "FluAgaric",
            "color": "fluagaric_fluence",
        },
        "back": {
            "type": "Neuron",
            "color": "neuron_fluence"
        }
    }

    return metadata

def style_nature(nft_metadata):
    defines = get_fluence_defines()

    front = nft_metadata['front']
    side = nft_metadata['side']
    back = nft_metadata['back']

    config = {
        'topology': nft_metadata['topology'],
        'start_hidden': ['Logo', 'Network', 'FlibertyCap', 'FluAgaric', 'Neurons'],

        'front': { 'name': front['type'] },
        'side': { 'name': side['type'] },
        'back': { 'name': back['type'] },

        'styling': {
            'Surface': { 'color': nft_metadata['Surface']},
            'SurfaceNetwork': { 'color': nft_metadata['SurfaceNetwork']},
            'Logo': { 'material':  'Silver' },
            'NetworkRing': { 'material': 'Silver', 'exact': False},
            'NetworkStar': { 'material': 'FiberOptic', 'exact': False}
        }
    }

    copy_config_style(front, 'front', config)
    copy_config_style(side, 'side', config)
    copy_config_style(back, 'back', config)

    if 'NetworkRing' in nft_metadata:
        config['styling']['NetworkRing']['material'] = nft_metadata['NetworkRing']

    if 'NetworkStar' in nft_metadata:
        config['styling']['NetworkStar']['material'] = nft_metadata['NetworkStar']

    print(config)

    style_fluence_scene(config, defines)

def copy_config_style(config_in_metadata, position, config):
    if 'material' in config_in_metadata:
        config[position]['material'] = config_in_metadata['material']
    else:
        config[position]['color'] = config_in_metadata['color']

def get_nft_metadata_investor():
    metadata = {
        "type": "investor",
        "topology": "mesh",
        "NetworkRing": "Gold",
        "NetworkStar": "Gold",
        "Logo": "Gold",
        "LogoGem": "flubie",
        "Surface": "cloth_silk",
        "SurfaceNetwork": "network_gold",
        "logo_gems": [
            {"type": "LogoDiamondRingCross", "material": "Gold"},
            {"type": "LogoDiamondRingDiag", "material": "Gold"},
            {"type": "LogoDiamondBar", "material": "Gold"}
        ],
        "front": {
            "type": "Coin",
            "material": "Silver"
        },
        "side": {
            "type": "Crystal",
            "color": "onyx"
        },
        "back": {
            "type": "Flubie",
            "color": "flubie"
        }
    }

    return metadata

def style_investor(nft_metadata):
    defines = get_fluence_defines()
    front = nft_metadata['front']
    side = nft_metadata['side']
    back = nft_metadata['back']

    config = {
        'topology': nft_metadata['topology'],
        'start_hidden': ['Logo', 'Network', 'Flubie', 'Diamond', 'Coin', 'Crystal'],
        'start_invisible': ['LogoDiamond'],

        'front': { 'name': front['type'] },
        'side': { 'name': side['type'] },
        'back': { 'name': back['type'] },

        'logo_gems': {},

        'styling': {
            'Surface': { 'color': nft_metadata["Surface"]},
            'SurfaceNetwork': { 'color': nft_metadata["SurfaceNetwork"]},
            'Logo': { 'material':  nft_metadata["Logo"]},
            'LogoGem': { 'color': nft_metadata["LogoGem"]},
            'NetworkRing': { 'material': 'FiberOptic', 'exact': False},
            'NetworkStar': { 'material': 'FiberOptic', 'exact': False}
        }
    }

    copy_config_style(front, 'front', config)
    copy_config_style(side, 'side', config)
    copy_config_style(back, 'back', config)

    for gem in nft_metadata['logo_gems']:
        config['logo_gems'][gem['type']] = {
            "material": gem['material'], "exact": False
        }
    
    if 'NetworkRing' in nft_metadata:
        config['styling']['NetworkRing']['material'] = nft_metadata['NetworkRing']

    if 'NetworkStar' in nft_metadata:
        config['styling']['NetworkStar']['material'] = nft_metadata['NetworkStar']

    style_fluence_scene(config, defines)

def test_style_investor(nft_metadata):
    style_investor(nft_metadata)

def set_material(o, mat):
    o.data.materials[0] = mat
    # o.data.update()

def set_materials(objs, mat):
    for o in objs:
        set_material(o, mat)

def set_mat_colors(mats, color, emission=False):
    for m in mats:
        print('color', color)
        set_mat_color(m, color, emission)