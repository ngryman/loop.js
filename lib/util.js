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
