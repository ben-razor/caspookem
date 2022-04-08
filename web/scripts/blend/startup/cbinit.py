import os, sys, imp

def bexec(filename):
	exec(compile(open(filename).read(), filename, 'exec'))

def ax(filename):
	angdir = '~/dev/web-public/razor-sport/scripts/blend'
	print(angdir)
	path = list(sys.path)
	sys.path.insert(0, angdir)
	try:
		mod = __import__(filename)
		imp.reload(mod)
	finally:
		sys.path[:] = path

def checkInit():
	print('new stuff')

def register():
	pass

if __name__ == "__main__":
    register()
