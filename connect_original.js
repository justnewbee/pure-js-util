/**
 * Create a link that calls one function when another executes.
 * @param {Object|null} [obj=window] The source object for event function.
 * @param {String} event String name of the event function in obj.
 * @param {Object|null} [context=window] The object that method will receive as "this".
 * @param {Function|String} method A function reference, or name of a function in context.
 */
function connect(obj, event, context, method) {
	obj = obj || window;
	context = context || window;
	method = typeof method == "string" ? context[method] : method;
	
	var eventMethod = obj[event];
	
	if (obj == context && method == eventMethod) {
		return;// or else will create an infinite loop
	}
	
	if (eventMethod.__connections__) {
		eventMethod.__connections__.push({
			context: context,
			method: method
		});
	} else {// first connect
		var newFunc = function() {
			var listeners = arguments.callee.__connections__;
			
			for (var i = 0; i < listeners.length; i++) {// FIFO
				if (listeners[i]) {// due to disconnect there can be undefined in the array
					listeners[i].method.apply(listeners[i].context, arguments);
				}
			}
		};
		newFunc.__connections__ = [{
			context: obj,
			method: eventMethod
		}, {
			context: context,
			method: method
		}];
		
		obj[event]= newFunc;// replace orig
	}
}
/**
 * Remove link(s) created by connect, and restore the original event if necessary.
 * @param {Object|null} [obj=window] The source object for event function.
 * @param {String} event String name of the event function in obj.
 * @param {Object|null} [context] The object that method will receive as "this". When method is specified, and context is empty, window is used for context.
 *   When context is empty and method is empty, disconnect all.
 * @param {Function|String|null} [method] A function reference, or name of a function in context. When not specified, disconnect all according to context.
 */
function disconnect(obj, event, context, method) {
	var eventObj = obj || window,
		eventMethod = eventObj[event],
		contextObj = context || (method ? window : null),
		contextMethod = contextObj ? (typeof method == "string" ? contextObj[method] : method) : null,
		eventListeners = eventMethod.__connections__,
		liveListeners = 0;
	
	if (!eventListeners) {
		return;
	}
	
	function checkListener(listener) {
		if (contextObj && contextMethod) {// listeners with context and method
			return listener && listener.context == contextObj && listener.method == contextMethod;
		}
		if (contextObj) {// all listeners with context
			return listener && listener.context == contextObj;
		}
		// any listeners
		return listener;
	}
	
	for (var i = 1; i < eventListeners.length; i++) {// start from 1 because 0 is for orignal
		if (checkListener(eventListeners[i])) {// these are dead listeners
			delete eventListeners[i];// just mark it undefined instead of using splice, it'll mess up when disconnect in connect...
		} else if (eventListeners[i]) {// these are live ones
			liveListeners += 1;
		}// others are dead ones - undefined
	}
	
	if (!liveListeners) {
		obj[event] = eventListeners[0].method;// restore
		// GC
		eventMethod.__connections__ = null;
		delete eventMethod.__connections__;
	}
}