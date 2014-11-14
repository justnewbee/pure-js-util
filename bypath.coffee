byPath = (path, context) ->
	o = if arguments.length == 2 then context else window
	paths = path.split "."
	p = paths.shift()
	
	while o and p
		o = o[p]
		p = paths.shift()
	
	o if not p

byPathSet = (path, context, data) ->
	return if arguments.length < 3
	
	o = context || window
	paths = path.split "."
	lastP = paths.pop()
	p = paths.shift()
	
	while p
		o[p] = {} if !o[p]
		
		o = o[p]
		p = paths.shift()
	
	o[lastP] = data