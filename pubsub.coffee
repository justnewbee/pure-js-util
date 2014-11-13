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
	
	if o.ctx == undefined
		delete o.ctx;
	
	Array.forEach (if Array.isArray topic then topic else [topic]), (v) ->
		arr = subPool[v] || []
		if !subPool[v]
			subPool[v] = arr
		
		arr.push(o);

unsubscribe = (topic, fn) ->
	Array.forEach (if Array.isArray topic then topic else [topic]), (v) ->
		arr = subPool[v]
		
		if !arr
			return;
		
		i = 0
		o = arr[i]
		
		while o
			if o.fn == fn
				arr.splice(i, 1)
			else
				i += 1
			
			o = arr[i]