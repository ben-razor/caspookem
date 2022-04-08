import os, sys
import subprocess
import json

def copy2clip(txt):
    """Copies some text to the clipboard.
    
    Only works on unix with xclip installed.
    """
    if not isinstance(txt, str):
        txt = json.dumps(txt)

    txt = f'"{txt}"'

    cmd='echo '+txt.strip()+'|xclip -selection clipboard'
    return subprocess.check_call(cmd, shell=True)

def css_to_rgb(col):
    """Convert a string like #ff8000 to list like [1, 0.501..., 0]
    """
    if len(col) > 6:
        col = col[1:]
    rgb = []
    for i in range(0, 6, 2):
        rgb.append(int(col[i:i+2], 16) / 255)
    return rgb

def format_rgb(rgb, digits=2):
    """Take rgb list like [1, 0.501..., 0] to ["1.00", "0.50", "0.00"]
    """
    return [f'{x:.{digits}f}' for x in rgb]

def replace_json_obj_value(d, key, replace_str):
    """Replace json object entries with a given key with the given string.

    It does this recursively.
    """
    def rem(obj, key, replace_str):
        if isinstance(obj, dict):
            if key in obj:
                obj[key] = replace_str
            print(obj.keys())
            for k in obj.keys():
                rem(obj[k], key, replace_str)
        elif isinstance(obj, list):
            for ok in obj:
                rem(ok, key, replace_str)
    
    rem(d, key, replace_str)

def clean_g3dj_file(file_name):
    """Reads a libgdx g3dj model file and removes entries matching a list of keys.

    Useful if you want to diff g3dj files to try to track down problems.
    """
    o = json.load(open(file_name))
    replace_keys = ["translation", "rotation", "scale", "indices", "vertices", "keyframes"]

    for key in replace_keys:
        replace_json_obj_value(o, key, "removed")

    out_file = open(file_name + "_cleaned", "w")

    json.dump(o, out_file, indent=4, sort_keys=True)

def get_unique_filenames(dir):
    """Walks recursively into directory and returns unique file names
       it finds.
       :returns set: Set of filenames
    """
    files = set()
    for r,s,f in os.walk(dir):
        files.update(f)
    return files

def find_different_files(dir1, dir2, symmetric=True):
    """Walks recursively into the directories and reports any files
       that are in one directory tree but not the other.
    """
    files1 = get_unique_filenames(dir1)
    files2 = get_unique_filenames(dir2)
    
    diff = None
    if symmetric:
        diff = files1.symmetric_difference(files2)
    else:
        diff = files1.difference(files2)

    return list(diff)

def perc(val1, val2):
    """Calculate the percentage change to val2 from val1"""
    perc = 0
    if val1 > 0:
        perc = (val2 - val1) / val1 * 100
    return perc
