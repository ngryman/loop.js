var util = module.exports = {};

// from nodejs implementation
util.inherits = function(ctor, superCtor) {
	ctor.super_ = superCtor;
	ctor.prototype = Object.create(superCtor.prototype, {
		constructor: {
			value: ctor,
			enumerable: false,
			writable: true,
			configurable: true
		}
	});
};

util.extend = function(src, dst) {
	for (var p in src) {
		dst[p] = src[p];
	}
	return dst;
};

util.createFlexibleObject = (function() {
	var global = global || window;

	return function(ctor, param, keyProp, keyEnum) {
		var args, opts;

		// if obj is already an instance of constructor, return it
		if (param instanceof ctor) {
			return param;
		}

		// isolate constructor arguments
		args = Array.prototype.slice.call(arguments, 4);

		// obj is a string,
		if ('string' == typeof param) {
			// build options with keyProp and param as a value
			if (keyEnum && param in keyEnum) {
				opts = {};
				opts[keyProp] = param;
			}
			// instantiate with the given class name
			else {
				var kname = param[0].toUpperCase() + param.slice(1);
				ctor = global[kname];
			}
		}
		else if ('object' == typeof param) {
			opts = param;
		}
		else {
			return undefined;
		}

		// push options
		args.push(opts);

		// instantiate!
		var inst = {};
		inst.__proto__ = ctor.prototype;
		ctor.apply(inst, args);
		return inst;
	};
})();

util.commonAssignement = function(common, assignement) {
	var result = {};

	if ('string' == typeof common) {
		common = common.split(' ');
	}

	if (Array.isArray(common)) {
		for (var i = 0, len = common.length; i < len; i++) {
			result[common[i]] = assignement;
		}
	}
	else if ('object' == typeof common) {
		for (var p in common) {
			var splited = p.split(' ');
			if (1 == splited.length) {
				result[p] = common[p];
			}
			else {
				util.extend(util.commonAssignement(splited, common[p]), result);
			}
		}
	}

	return result;
};

util.multipleAssign = function(keys, assignements, assignFn) {
	if ('string' == typeof keys) {
		keys = keys.split(' ');
	}

	var result = {};

	if (!assignFn) {
		assignFn = function(key, prop, value) {
			result[key] = result[key] || {};
			result[key][prop] = value;
		}
	}

	for (var i = 0, len = keys.length; i < len; i++) {
		if ('object' == typeof assignements) {
			for (var p in assignements) {
				assignFn(keys[i], p, assignements[p]);
			}
		}
		else {
			assignFn(keys[i], null, assignements);
		}
	}

	if (result) return result;
};
