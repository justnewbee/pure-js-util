/**
 * @requires `Array.isArray`, `Array.forEach`
 * @type {{}}
 */
// the pool storing subscribed topics as `{topic: []}`
// and the `[]` contains objects with `data:Object` (if there is), `fn:Function` and `ctx:Object`
var subPool = {};// for dev ref only
/**
 * Subscribes to topic(s).
 * @param {Array|String} topic The topic(s) to subscribe to.
 * @param {Object} [data] Data passed to the event handler as event.data; could be omitted, if so, it'll be `subscribe(topic, fn, ctx)`.
 * @param {Function} fn Any time a topic is published, the callback will be called with the published array as ordered arguments.
 * @param {Object} [ctx] What will `this` be in the fn when executed.
 */
function subscribe(topic, data, fn, ctx) {
	var o = {
		data: data,
		fn: fn,
		ctx: ctx
	};
	
	if (typeof data === "function") {// data is omitted actually, the function is invoked this way `subscribe(topic, fn, ctx)`
		o.ctx = o.fn;
		o.fn = o.data;
		delete o.data;
	}
	if (o.ctx === undefined) {
		delete o.ctx;
	}
	
	Array.forEach(Array.isArray(topic) ? topic : [topic], function(v) {
		var arr = subPool[v] || [];
		if (!subPool[v]) {
			subPool[v] = arr;
		}
		arr.push(o);
	});
}
/**
 * Disconnect a subscribed function with topic(s).
 * @param {Array|String} topic The topic(s) to unsubscribe.
 * @param {Function} fn The function to unsubscribe from the event.
 */
function unsubscribe(topic, fn) {
	Array.forEach(Array.isArray(topic) ? topic : [topic], function(v) {
		var arr = subPool[v];
		
		if (!arr) {
			return;
		}
		
		var i = 0,
			o = arr[i];
		
		while (o) {
			if (o.fn === fn) {
				arr.splice(i, 1);// i do not +1 because the position doesn't change
			} else {
				i += 1;
			}
			o = arr[i];
		}
	});
}
/**
 * Publish on named topic(s).
 * @param {Array|String} topic The topic(s) to publish on.
 * @param {*} data The data to publish.
 */
function publish(topic, data) {
	Array.forEach(Array.isArray(topic) ? topic : [topic], function(v) {
		var arr = subPool[v];
		if (!arr) {
			return;
		}
		
		Array.forEach(arr, function(vv) {
			try {// avoid process blocked
				vv.fn.call(vv.ctx || null, {// the event
					type: v,
					data: vv.data
				}, data);
			} catch (ex) {
				console.error("exception caught when topic \"" + topic + "\" published", data, ex, ex.stack);
			}
		});
	});
}