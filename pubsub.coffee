subPool = {}

subscribe = (topic, data, fn, ctx) ->
	o =
		data: data,
		fn: fn,
		ctx: ctx
	
	if typeof data == "function"
		o.ctx = o.fn;
		o.fn = o.data;
		delete o.data;
	
	delete o.ctx if o.ctx == undefined
	
	Array.forEach (if Array.isArray topic then topic else [topic]), (v) ->
		arr = subPool[v] || []
		subPool[v] = arr if !subPool[v]
		
		arr.push(o);

unsubscribe = (topic, fn) ->
	Array.forEach (if Array.isArray topic then topic else [topic]), (v) ->
		arr = subPool[v]
		
		return if !arr
		
		i = 0
		o = arr[i]
		
		while o
			if o.fn == fn then arr.splice(i, 1) else i += 1
			
			o = arr[i]