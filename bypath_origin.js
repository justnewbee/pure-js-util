/**
 * Get data from context object down the path.
 * @example
 * <code>
 * var o = {
 *   p1: {
 *     p1_1: false,
 *     p1_2: [0, 1, 2, 3, {
 *       p1_2_4_1: "you got me in array"
 *     }]
 *   }
 * };
 * byPath("p1", o);// object
 * byPath("p1.p1_1", o);// false
 * byPath("p1.p1_1.p1_1_3", o);// undefined
 * byPath("p1.p1_2", o);// array
 * byPath("p1.p1_2.1", o);// 1
 * byPath("p1.p1_2.4", o);// object
 * byPath("p1.p1_2.4.p1_2_4_1", o);// "you got me in array"
 * </code>
 * @param {String} path
 * @param {Object} [context=window]
 */
function byPath(path, context) {
	var o = context || window,
		paths = path.split("."),
		p = paths.shift();
	
	while (o && p) {
		o = o[p];
		p = paths.shift();
	}
	
	return p ? undefined : o;
}
/**
 * Set data to context object according to path, anything along the path will be created as an object if not exist.
 * @example
 * <code>
 * var o = {
 *   p1: {
 *     p1_1: {}
 *   }
 * };
 * byPathSet("p1.p1_1.p1_1_1", o, "foo");
 * byPathSet("p1.p1_2.p1_2_1", o, [1,2,3]);
 * </code>
 * @param {String} path
 * @param {Object} context `window` if falsy null/undefined/false/0/""/NaN
 * @param {*} data
 */
function byPathSet(path, context, data) {
	if (arguments.length < 3) {
		return;
	}
	
	var o = context || window,
		paths = path.split("."),
		lastP = paths.pop(),
		p = paths.shift();
	
	while (p) {
		if (!o[p]) {// create if not exist
			o[p] = {};
		}
		
		o = o[p];
		p = paths.shift();
	}
	
	o[lastP] = data;
}
/**
 * Add data to a set in context object according to path.
 * @example
 * <code>
 * var o = {
 *   p1: {
 *     p1_1: [1, 2]
 *   }
 * };
 * byPathAddToSet("p1.p1_1", o, 2);// will not be added
 * byPathAddToSet("p1.p1_1", o, 3);
 * byPathAddToSet("p2", o, "p2");
 * 
 * `o` becomes {
 *   p1: {
 *     p1_1: [1, 2, 3]
 *   },
 *   p2: ["p2"]
 * }
 * </code>
 * @param {String} path
 * @param {Object} context
 * @param {*} data
 */
function byPathAddToSet(path, context, data) {
	var o = context || window,
		paths = path.split("."),
		lastP = paths.pop(),
		p = paths.shift();
	
	while (p) {
		if (o[p] === undefined) {
			o[p] = {};
		}
		
		if (!angular.isObject(o[p])) {// mongo will report error when doing on already exist stuff
			return;
		}
		
		o = o[p];
		p = paths.shift();
	}
	
	var arr = o[lastP];
	if (arr === undefined) {
		arr = [];
		o[lastP] = arr;
	}
	
	if (!Array.isArray(arr)) {// mongo will report error when you do $addToSet on something exist but not an array
		return;
	}
	
	if (arr.some(function(v) {// angular will not add the data if there already exists one that is totally the same
		return angular.equals(v, data);
	})) {
		return;
	}
	
	arr.push(data);
}
/**
 * Pull data from context object according to path and data.
 * @example
 * <code>
 * var o = {
 *   p1: {
 *     p1_1: [1, 2, 3],
 *     p1_2: [{
 *       a: 1, b: 2
 *     }, {
 *       a: 1, b: 3
 *     }, {
 *       a: 2, b: 4
 *     }]
 *   }
 * };
 * byPathPull("p1.p1_1", o, 2);
 * byPathUnset("p1.p1_2", o, {a: 1});
 * byPathPull("p1.p1_3", o, 3);// does nothing
 * 
 * `o` becomes {
 *   p1: {
 *     p1_1: [1, 3],
 *     p1_2: [{
 *       a: 2, b: 4
 *     }]
 *   }
 * }
 * </code>
 * @param {String} path
 * @param {Object} context
 * @param {*} data
 */
function byPathPull(path, context, data) {
	var arr = byPath(path, context);
	
	if (!angular.isArray(arr)) {// angular will report error when performing $pull on something that is not an array
		return;
	}
	
	var i = 0,
		dataIsSimple = !angular.isObject(data) && !angular.isArray(data);
	while (i < arr.length) {// do not cache arr.length cause arr.length will change during the operation
		var item = arr[i],
			needPull = true;
		if (dataIsSimple) {
			needPull = item === data;
		} else {// TODO mongo pull is actually a query, BUT here we only support simple data or subset, all $xx is NOT yet supported
			for (var k in data) {
				if (data.hasOwnProperty(k)) {
					if (!angular.equals(data[k], item[k])) {
						needPull = false;
						break;
					}
				}
			}
		}
		
		if (needPull) {
			arr.splice(i, 1);
		} else {
			i += 1;
		}
	}
}
/**
 * Unset data to context object according to path.
 * @example
 * <code>
 * var o = {
 *   p1: {
 *     p1_1: {
 *       p1_1_1: "foo"
 *     }
 *   }
 * };
 * byPathUnset("p1.p1_1.p1_1_1", o);
 * byPathUnset("p1.p1_2.p1_2_1", o);// does nothing
 * </code>
 * @param {String} path
 * @param {Object} context
 */
function byPathUnset(path, context) {
	var o = context || window,
		paths = path.split("."),
		lastP = paths.pop(),
		p = paths.shift();
	
	while (o && p) {
		o = o[p];
		p = paths.shift();
	}
	
	try {// IE will throw exception even if you're deleting your own stuff
		if (o && lastP in o) {
			o[lastP] = null;
			delete o[lastP];
		}
	} catch (ex) {}
}