def dupObjects():
	select_layers = [False] * 20
	select_layers[5] = True
	bpy.context.scene.layers = select_layers
	src_name = "My_" + obj_model
	found_model = False

	for src_obj in bpy.data.objects:
			if src_obj.name == src_name:
					bpy.ops.object.select_all(action='DESELECT')
					bpy.ops.object.select_name(name=src_name)
					bpy.ops.object.duplicate_move()
					new_obj = bpy.context.scene.objects.active
					new_obj.name = obj_name
					select_layers = [False] * 20
					select_layers[0] = True
					new_obj.layers = select_layers
					bpy.context.scene.layers = select_layers
					found_model = True
					break
