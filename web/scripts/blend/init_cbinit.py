initCode = """
import cbinit
from cbinit import *
ax("cbObj")
from cbObj import *
"""
from tkinter import Tk
def copy2clipTk(txt):
	r = Tk()
	r.withdraw()
	r.clipboard_clear()
	r.clipboard_append('2tru')
	r.destroy()


import subprocess
def copy2clip(txt):
	cmd='echo '+txt.strip()+'|clip'
	return subprocess.check_call(cmd, shell=True)

if __name__ == '__main__':
	print("copying")
	copy2clip("import cbinit; from cbinit import *;ax('cbObj');from cbObj import *;") 
	print("finished")

