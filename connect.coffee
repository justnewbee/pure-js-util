connect = (obj, event, context, method) ->
	obj = obj || window
	context = context || window
	method = if typeof method == "string" then context[method] else method
	
	eventMethod = obj[event]
	
	return if obj == context and method == eventMethod
	
	if eventMethod.__connections__
		eventMethod.__connections__.push
			context: context
			method: method
	else
		newFunc = () ->
			listeners = arguments.callee.__connections__
			
			v.method.apply v.context, arguments for v in listeners when v
		
		newFunc.__connections__ = [
			context: obj
			method: eventMethod
		,
			context: context
			method: method
		]
		
		obj[event] = newFunc

disconnect = (obj, event, context, method) ->
	eventObj = obj or window
	eventMethod = eventObj[event]
	contextObj = context or (if method then window else null)
	contextMethod = if contextObj then (if typeof method == "string" then contextObj[method] else method) else null
	eventListeners = eventMethod.__connections__
	liveListeners = 0
	
	return if not eventListeners
	
	checkListener = (listener) ->
		if contextObj and contextMethod
			return listener and listener.context == contextObj and listener.method == contextMethod
		if contextObj
			return listener and listener.context == contextObj
		listener
	
	for v in eventListeners
		if checkListener v
			delete eventListeners[_i]
		else if v
			liveListeners += 1
	
	if not liveListeners
		obj[event] = eventListeners[0].method
		
		eventMethod.__connections__ = null
		delete eventMethod.__connections__