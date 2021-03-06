var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var cached = require.cache[resolved];
    var res = cached? cached.exports : mod();
    return res;
};

require.paths = [];
require.modules = {};
require.cache = {};
require.extensions = [".js",".coffee",".json"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            x = path.normalize(x);
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = path.normalize(x + '/package.json');
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key);
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

(function () {
    var process = {};
    var global = typeof window !== 'undefined' ? window : {};
    var definedProcess = false;
    
    require.define = function (filename, fn) {
        if (!definedProcess && require.modules.__browserify_process) {
            process = require.modules.__browserify_process();
            definedProcess = true;
        }
        
        var dirname = require._core[filename]
            ? ''
            : require.modules.path().dirname(filename)
        ;
        
        var require_ = function (file) {
            var requiredModule = require(file, dirname);
            var cached = require.cache[require.resolve(file, dirname)];

            if (cached && cached.parent === null) {
                cached.parent = module_;
            }

            return requiredModule;
        };
        require_.resolve = function (name) {
            return require.resolve(name, dirname);
        };
        require_.modules = require.modules;
        require_.define = require.define;
        require_.cache = require.cache;
        var module_ = {
            id : filename,
            filename: filename,
            exports : {},
            loaded : false,
            parent: null
        };
        
        require.modules[filename] = function () {
            require.cache[filename] = module_;
            fn.call(
                module_.exports,
                require_,
                module_,
                module_.exports,
                dirname,
                filename,
                process,
                global
            );
            module_.loaded = true;
            return module_.exports;
        };
    };
})();


require.define("path",function(require,module,exports,__dirname,__filename,process,global){function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

});

require.define("__browserify_process",function(require,module,exports,__dirname,__filename,process,global){var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
        && window.setImmediate;
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return window.setImmediate;
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    if (name === 'evals') return (require)('vm')
    else throw new Error('No such module. (Possibly not yet loaded)')
};

(function () {
    var cwd = '/';
    var path;
    process.cwd = function () { return cwd };
    process.chdir = function (dir) {
        if (!path) path = require('path');
        cwd = path.resolve(dir, cwd);
    };
})();

});

require.define("/lib/application.js",function(require,module,exports,__dirname,__filename,process,global){var Machine = require('./state/machine').Machine;
var Loop = require('./loop').Loop;
var Cycle = require('./loop/cycle').Cycle;
var util = require('./util');

/**
 * ## *constructor*
 *
 * @constructor
 */
var Application = function() {
	Machine.prototype.constructor.call(this);

	// we don't inherit directly from Cycle as we don't want to expose `start` and `end` method
	// so we use a little trick: instantiate a temp Cycle and bind the `tick` method to `Application#tick`
	var cycle = new Cycle();
	cycle.tick = this._tick.bind(this);

	this._loop = new Loop();
	this._loop.add(cycle);
};
util.inherits(Application, Machine);

/**
 * ## *init*
 *
 * @param name
 * @param delegate
 */
Application.prototype.init = function(name, delegate) {
	return this.when('init', name, delegate);
};

/**
 * ## *cleanup*
 *
 * @param name
 * @param delegate
 */
Application.prototype.cleanup = function(name, delegate) {
	return this.when('cleanup', name, delegate);
};

/**
 * ## *enter*
 *
 * @param name
 * @param delegate
 */
Application.prototype.enter = function(name, delegate) {
	return this.when('enter', name, delegate);
};

/**
 * ## *exit*
 *
 * @param name
 * @param delegate
 */
Application.prototype.exit = function(name, delegate) {
	return this.when('exit', name, delegate);
};

/**
 * ## *pause*
 *
 * @param name
 * @param delegate
 */
Application.prototype.pause = function(name, delegate) {
	return this.when('pause', name, delegate);
};

/**
 * ## *resume*
 *
 * @param name
 * @param delegate
 */
Application.prototype.resume = function(name, delegate) {
	return this.when('resume', name, delegate);
};

/**
 * ## *tick*
 *
 * @param name
 * @param delegate
 */
Application.prototype.tick = function(name, delegate) {
	return this.when('tick', name, delegate);
};

/**
 * ## *transition*
 *
 * @param name
 * @param delegate
 */
Application.prototype.transition = function(name, delegate) {
	return this.when('transition', name, delegate);
};

/**
 * ## *when*
 *
 * @param events
 * @param name
 * @param [delegate]
 * @return {*}
 */
Application.prototype.when = function(events, name, delegate) {
	events = events.split(' ');

	if (!this._states[name]) this.push(name);

	if ('function' == typeof delegate) {
		var state = this._states[name].state;
		for (var i = 0, len = events.length; i < len; i++) {
			state[events[i]] = delegate;
		}
	}

	return this;
};

/**
 * ## *loop*
 *
 * @return {*}
 */
Application.prototype.loop = function() {
	if (!this._launchEntry) this.push('__empty__');
	if (!this._current) this.change(this._launchEntry.name);

	this._loop.start();
	return this;
};

/**
 * ## *abort*
 *
 */
Application.prototype.abort = function() {
	this._loop.halt();
	return this;
};

/**
 * ## *_tick*
 *
 * @param time
 * @private
 */
Application.prototype._tick = function(time) {
	if (this._current) {
		this._fire(this._current.state, 'tick', time);
	}
};

/** **exports** */
module.exports.Application = Application;

});

require.define("/lib/state/machine.js",function(require,module,exports,__dirname,__filename,process,global){var async = require('async');
var State = require('../state').State;
var Loop = require('../loop').Loop;
var Transition = require('../transition').Transition;
var Ease = require('../loop/ease').Ease;
var util = require('../util');

var defaults = {
	separator: ':'
};

/**
 *
 * @param options
 * @constructor
 */
var Machine = function(options) {
	options = options || {};
	for (var k in defaults) options[k] = options[k] || defaults[k];

	this._options = options;
	this._states = {};
};

/**
 * **api**
 * - - - -
 */

/**
 * ## *push*
 *
 * **given** a name<br>
 * **and** an optional state<br>
 * **and** an optional transition or its name or a its description<br>
 * **and** optional options for transition<br>
 * **then** pushes the state into the state stack and make it available for use.
 * if a parent was specified but was non-existent, it is created on the fly
 *
 *    `push 'menu'`<br>
 *    `push 'menu', state`<br>
 *    `push 'menu', 'linear'`<br>
 *    `push 'menu', new Transition`<br>
 *    `push 'menu', state, 'linear'`<br>
 *    `push 'menu', state, 'linear', duration: 1000`
 *
 * @param name
 * @param state
 * @return {Machine}
 */
Machine.prototype.push = function(name, state, trans) {
	if (this._states[name] || undefined == name) return this;

	if (state && !(state instanceof State)) {
		trans = state;
		state = null;
	}

//	topts = topts || {};
//
//	if (trans0) {
//		if (!(trans0 instanceof Transition)) {
//			try {
//				var tname = trans0;
//
//				// ease name, instantiate a simple transition class with given easing
//				if (tname in Ease) {
//					topts.easing = tname;
//					tklass = Transition;
//				}
//				// other name, try to instantiate the given class name
//				else {
//					var kname = tname[0].toUpperCase() + tname.slice(1).toLowerCase();
//					tklass = require(tname)[kname];
//				}
//			}
//			catch (err) {
//				trans0 = null;
//			}
//		}
//		else {
//			tklass = trans0.constructor;
//			topts = trans0;
//		}
//	}

	var names = name.split(this._options.separator);
	name = names.shift();
	var root = name;

	// TODO: from child to parent
	// for each state, add to states, link to the previous one child
	// if a state already exist, just link to the previous one child
	var parent = this._pushEntry(root, null, names.length == 0 ? state : null, trans);
	while (names.length) {
		name = name + this._options.separator + names.shift();
		if (this._states[name]) break;
		parent = this._pushEntry(name, parent, names.length == 0 ? state : null);
	}

	// TODO: rename this, move to application as it is only used there?
	this._launchEntry = this._launchEntry || this._states[root];
	return this;
};

/**
 * ## *get*
 *
 * @param name
 */
Machine.prototype.get = function(name) {
	return name in this._states ? this._states[name].state : undefined;
};

/**
 * ## *change*
 *
 * **given** a state name<br>
 * **and** a optional callback<br>
 * **then** switch the current state, if it exists, to the new one.<br>
 * if transitions are attached to the states, they are applied.
 *
 * @param name
 * @param [callback]
 * @return {Machine}
 */
Machine.prototype.change = function(name, callback) {
	var toexit = [],
		toenter = [],
		tochange = [],
		self = this,
		e, i, len;

	// states to exit
	if (this._current) {
		e = this._current;

		// if trying to change to the same state, do nothing
		if (e === this._states[name]) {
			if ('function' == typeof callback) callback.call(e.state);
			return this;
		}

		// builds the list of states to exit
		while (e) {
			toexit.push(e);
			e = e.parent;
		}
	}

	// builds the list of states to enter
	e = this._states[name];
	while (e) {
		toenter.push(e);
		e = e.parent;
	}

	// enter form parent to children
	toenter.reverse();

	// queue of events to call for each affected state
	if (toexit.length > 0) {
		// remove states that will be exited and entered as their state will not change
		// we first reverse states to enter and exit and remove duplicates (common parents)
		toexit.reverse();
//		if (toenter.length > toexit.length) {
			while (toenter[0] === toexit[0]) {
				toenter.shift();
				toexit.shift();
			}
//		}

		// exit from children to parent
		toexit.reverse();

		// first blur the current state
		if (this._current) {
			tochange.push(function(cb) {
				self._fire(self._current.state, 'blur');
				cb();
			});
		}

		// then exit all its remaining parents
		for (i = 0, len = toexit.length; i < len; i++) {
			e = toexit[i];
			tochange.push((function(e) {
				return function(cb) {
					self._exit(e, cb);
				};
			})(e));
		}
	}

	// and finally enter the new hierarchy
	// reverse states to exit (
	for (i = 0, len = toenter.length; i < len; i++) {
		e = toenter[i];
		tochange.push((function(e) {
			return function(cb) {
				self._enter(e, cb);
			};
		})(e));
	}

	// runs all transitions in parallel
	async.parallel(tochange, function() {
		self._current = self._states[name];
		self._fire(self._current.state, 'focus');
		if ('function' == typeof callback) callback.call(self._current.state);
	});

	return this;
};

/**
 * **internal sugar**
 * - - - - - - - - -
 */

/**
 * ## *fire*
 *
 * @param event
 * @return {Machine}
 */
Machine.prototype._fire = function(state, event) {
	var args = Array.prototype.slice.call(arguments, 1);
	state[event].apply(state, args);
	return this;
};

/**
 * ## *_pushEntry*
 *
 * @param name
 * @param parent
 * @param [state]
 * @param [transConstructor]
 * @param [transOptions]
 * @return {Machine}
 * @private
 */
Machine.prototype._pushEntry = function(name, parent, state, trans) {
	if (this._states[name]) return this._states[name];

	state = state || new State();

	if (parent) {
		trans = parent.trans;
	}
	else if (trans) {
		trans = util.createFlexibleObject(Transition, trans, 'easing', Ease, state);
	}

	// creates & starts transition loop on the fly
	if (trans && !this._transLoop) {
		this._transLoop = new Loop();
		this._transLoop.start();
	}

	var entry = {
		name: name,
		state: state,
		trans: trans,
		activated: 0,
		parent: parent
	};

	this._states[name] = entry;

	return entry;
};

/**
 * ## *_enter*
 *
 * @param entry
 * @param cb
 * @private
 */
Machine.prototype._enter = function(entry, cb) {
	var self = this;

	// initialize if this is the first time state is entered
	if (!entry.init) {
		entry.init = true;
		this._fire(entry.state, 'init');
	}

	var cbw = function() {
		entry.activated++;
		entry.active = true;
		self._fire(entry.state, 'enter');
		cb();
	};

	if (entry.trans) {
		if (entry.activated > 0) entry.trans.reverse();
		this._transLoop.add(entry.trans, cbw);
	}
	else {
		cbw();
	}
};

/**
 * ## *_exit*
 *
 * @param entry
 * @param cb
 * @private
 */
Machine.prototype._exit = function(entry, cb) {
	var self = this;

	var cbw = function() {
		entry.active = false;
		self._fire(entry.state, 'exit');
		cb();
	};

	if (entry.trans) {
		entry.trans.reverse();
		this._transLoop.add(entry.trans, cbw);
	}
	else {
		cbw();
	}
};

/** **exports** */
module.exports.Machine = Machine;

});

require.define("/node_modules/async/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"./index"}
});

require.define("/node_modules/async/index.js",function(require,module,exports,__dirname,__filename,process,global){// This file is just added for convenience so this repository can be
// directly checked out into a project's deps folder
module.exports = require('./lib/async');

});

require.define("/node_modules/async/lib/async.js",function(require,module,exports,__dirname,__filename,process,global){/*global setTimeout: false, console: false */
(function () {

    var async = {};

    // global on the server, window in the browser
    var root = this,
        previous_async = root.async;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = async;
    }
    else {
        root.async = async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    //// cross-browser compatiblity functions ////

    var _forEach = function (arr, iterator) {
        if (arr.forEach) {
            return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _forEach(arr, function (x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _forEach(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };

    var _keys = function (obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////
    if (typeof process === 'undefined' || !(process.nextTick)) {
        async.nextTick = function (fn) {
            setTimeout(fn, 0);
        };
    }
    else {
        async.nextTick = process.nextTick;
    }

    async.forEach = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        _forEach(arr, function (x) {
            iterator(x, function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed === arr.length) {
                        callback(null);
                    }
                }
            });
        });
    };

    async.forEachSeries = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            iterator(arr[completed], function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed === arr.length) {
                        callback(null);
                    }
                    else {
                        iterate();
                    }
                }
            });
        };
        iterate();
    };

    async.forEachLimit = function (arr, limit, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length || limit <= 0) {
            return callback();
        }
        var completed = 0;
        var started = 0;
        var running = 0;

        (function replenish () {
            if (completed === arr.length) {
                return callback();
            }

            while (running < limit && started < arr.length) {
                started += 1;
                running += 1;
                iterator(arr[started - 1], function (err) {
                    if (err) {
                        callback(err);
                        callback = function () {};
                    }
                    else {
                        completed += 1;
                        running -= 1;
                        if (completed === arr.length) {
                            callback();
                        }
                        else {
                            replenish();
                        }
                    }
                });
            }
        })();
    };


    var doParallel = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.forEach].concat(args));
        };
    };
    var doSeries = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.forEachSeries].concat(args));
        };
    };


    var _asyncMap = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (err, v) {
                results[x.index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);


    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.reduce = function (arr, memo, iterator, callback) {
        async.forEachSeries(arr, function (x, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };
    // inject alias
    async.inject = async.reduce;
    // foldl alias
    async.foldl = async.reduce;

    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, function (x) {
            return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };
    // foldr alias
    async.foldr = async.reduceRight;

    var _filter = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    // select alias
    async.select = async.filter;
    async.selectSeries = async.filterSeries;

    var _reject = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (!v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);

    var _detect = function (eachfn, arr, iterator, main_callback) {
        eachfn(arr, function (x, callback) {
            iterator(x, function (result) {
                if (result) {
                    main_callback(x);
                    main_callback = function () {};
                }
                else {
                    callback();
                }
            });
        }, function (err) {
            main_callback();
        });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);

    async.some = function (arr, iterator, main_callback) {
        async.forEach(arr, function (x, callback) {
            iterator(x, function (v) {
                if (v) {
                    main_callback(true);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(false);
        });
    };
    // any alias
    async.any = async.some;

    async.every = function (arr, iterator, main_callback) {
        async.forEach(arr, function (x, callback) {
            iterator(x, function (v) {
                if (!v) {
                    main_callback(false);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(true);
        });
    };
    // all alias
    async.all = async.every;

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                var fn = function (left, right) {
                    var a = left.criteria, b = right.criteria;
                    return a < b ? -1 : a > b ? 1 : 0;
                };
                callback(null, _map(results.sort(fn), function (x) {
                    return x.value;
                }));
            }
        });
    };

    async.auto = function (tasks, callback) {
        callback = callback || function () {};
        var keys = _keys(tasks);
        if (!keys.length) {
            return callback(null);
        }

        var results = {};

        var listeners = [];
        var addListener = function (fn) {
            listeners.unshift(fn);
        };
        var removeListener = function (fn) {
            for (var i = 0; i < listeners.length; i += 1) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        };
        var taskComplete = function () {
            _forEach(listeners.slice(0), function (fn) {
                fn();
            });
        };

        addListener(function () {
            if (_keys(results).length === keys.length) {
                callback(null, results);
                callback = function () {};
            }
        });

        _forEach(keys, function (k) {
            var task = (tasks[k] instanceof Function) ? [tasks[k]]: tasks[k];
            var taskCallback = function (err) {
                if (err) {
                    callback(err);
                    // stop subsequent errors hitting callback multiple times
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    taskComplete();
                }
            };
            var requires = task.slice(0, Math.abs(task.length - 1)) || [];
            var ready = function () {
                return _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            };
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            }
            else {
                var listener = function () {
                    if (ready()) {
                        removeListener(listener);
                        task[task.length - 1](taskCallback, results);
                    }
                };
                addListener(listener);
            }
        });
    };

    async.waterfall = function (tasks, callback) {
        callback = callback || function () {};
        if (!tasks.length) {
            return callback();
        }
        var wrapIterator = function (iterator) {
            return function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    async.nextTick(function () {
                        iterator.apply(null, args);
                    });
                }
            };
        };
        wrapIterator(async.iterator(tasks))();
    };

    async.parallel = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            async.map(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.forEach(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.series = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            async.mapSeries(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.forEachSeries(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.iterator = function (tasks) {
        var makeCallback = function (index) {
            var fn = function () {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            };
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        };
        return makeCallback(0);
    };

    async.apply = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(
                null, args.concat(Array.prototype.slice.call(arguments))
            );
        };
    };

    var _concat = function (eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function (x, cb) {
            fn(x, function (err, y) {
                r = r.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, r);
        });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        if (test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.whilst(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.until = function (test, iterator, callback) {
        if (!test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.until(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.queue = function (worker, concurrency) {
        var workers = 0;
        var q = {
            tasks: [],
            concurrency: concurrency,
            saturated: null,
            empty: null,
            drain: null,
            push: function (data, callback) {
                if(data.constructor !== Array) {
                    data = [data];
                }
                _forEach(data, function(task) {
                    q.tasks.push({
                        data: task,
                        callback: typeof callback === 'function' ? callback : null
                    });
                    if (q.saturated && q.tasks.length == concurrency) {
                        q.saturated();
                    }
                    async.nextTick(q.process);
                });
            },
            process: function () {
                if (workers < q.concurrency && q.tasks.length) {
                    var task = q.tasks.shift();
                    if(q.empty && q.tasks.length == 0) q.empty();
                    workers += 1;
                    worker(task.data, function () {
                        workers -= 1;
                        if (task.callback) {
                            task.callback.apply(task, arguments);
                        }
                        if(q.drain && q.tasks.length + workers == 0) q.drain();
                        q.process();
                    });
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            }
        };
        return q;
    };

    var _console_fn = function (name) {
        return function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.apply(null, args.concat([function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (typeof console !== 'undefined') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _forEach(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            }]));
        };
    };
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function (x) {
            return x;
        };
        var memoized = function () {
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                callback.apply(null, memo[key]);
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([function () {
                    memo[key] = arguments;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                      q[i].apply(null, arguments);
                    }
                }]));
            }
        };
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
      return function () {
        return (fn.unmemoized || fn).apply(null, arguments);
      };
    };

}());

});

require.define("/lib/state.js",function(require,module,exports,__dirname,__filename,process,global){/**
 * ## *constructor*
 *
 * **does** construct internal variables used by the system
 * **and** has to be called when subclassing
 *
 * @constructor
 */
var State = function() {};

/**
 * **overridable**
 * - - - - - - - -
 */

/**
 * ## *init*
 *
 * **called** when state is entered the first time
 * **and** should be used to initialize the state (i.e. loading resources, creating maps, ...)
 */
State.prototype.init = function() {};

/**
 * ## *cleanup*
 *
 * **called manually** when the state will never be used again
 * TODO: when? manually? automatically? configurable?
 */
State.prototype.cleanup = function() {};

/**
 * ## *enter*
 *
 * **called** each time the state become *active*
 * **and** should be used to prepare the state (i.e. show objects, configure, ...)
 */
State.prototype.enter = function() {};

/**
 * ## *exit*
 */
State.prototype.exit = function() {};

/**
 * ## *focus*
 */
State.prototype.focus = function() {};

/**
 * ## *blur*
 */
State.prototype.blur = function() {};

/**
 * ## *pause*
 */
State.prototype.pause = function() {};

/**
 * ## *resume*
 */
State.prototype.resume = function() {};

/**
 * ## *tick*
 */
State.prototype.tick = function() {};

/**
 * ## *transition*
 */
State.prototype.transition = function() {};

/**
 * **internal sugar**
 * - - - - - - - - -
 */

/** **exports** */
module.exports.State = State;

});

require.define("/lib/loop.js",function(require,module,exports,__dirname,__filename,process,global){/**
 *
 * @constructor
 */
var Loop = function() {
	this._cycles = [];
	this._time = {
		now: 0,
		old: 0,
		delta: 0,
		frame: -1
	};
};

/**
 *
 * @param cycle
 * @param callback
 */
Loop.prototype.add = function(cycle, callback) {
	if ('function' == typeof callback) cycle._callback = callback;
	this._cycles.push(cycle);

	if (this._timerId) cycle.start(this._time);
};

/**
 *
 * @param cycle
 */
Loop.prototype.remove = function(cycle) {
	var idx = this._cycles.indexOf(cycle);
	if (-1 != idx) this._cycles.splice(idx, 1);
};

/**
 *
 */
Loop.prototype.start = function() {
	this._tick(this._time.now = +Date.now());
};

/**
 *
 */
Loop.prototype.halt = function() {
	window.cancelAnimationFrame(this._timerId);
	this._timerId = null;
};

/**
 *
 * @param now
 * @private
 */
Loop.prototype._tick = function(now) {
	var time = this._time,
		cycles = this._cycles,
		cycle;

	time.old = time.now;
	time.now = now;
	time.delta = now - time.old;
	time.frame++;

	this._timerId = window.requestAnimationFrame(this._tick.bind(this));

	for (var i = cycles.length; i--;) {
		cycle = cycles[i];

		if (false === cycle.tick(time)) {
			cycles.splice(i, 1);
			cycle.end(time);
			if (cycle._callback) cycle._callback(cycle);
		}
	}
};

/** **exports** */
module.exports.Loop = Loop;

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller
// fixes from Paul Irish and Tino Zijdel

(function() {
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
			|| window[vendors[x] + 'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame)
		window.requestAnimationFrame = function(callback) {
			var currTime = +Date.now();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() { callback(currTime + timeToCall); },
				timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};

	if (!window.cancelAnimationFrame)
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
}());

window.performance = (function() {
	var perf = window.performance || {};
	perf.now = perf.now ||
		perf.webkitNow ||
		perf.mozNow ||
		perf.msNow ||
		perf.oNow ||
		function() {
			return +Date.now()
		};

	return perf;
}());

});

require.define("/lib/transition.js",function(require,module,exports,__dirname,__filename,process,global){var Tween = require('./loop/tween').Tween;
var util = require('./util');

/**
 * ## *constructor*
 *
 * @param options
 * @constructor
 */
var Transition = function(state, options) {
	options = options || {};
	Tween.prototype.constructor.call(this, state, 'transition', options.from, options.to, options.duration, options.easing);
};
util.inherits(Transition, Tween);

/**
 * **internal sugar**
 * - - - - - - - - -
 */

/** **exports** */
module.exports.Transition = Transition;

});

require.define("/lib/loop/tween.js",function(require,module,exports,__dirname,__filename,process,global){var Cycle = require('./cycle').Cycle;
var Ease = require('./ease').Ease;
var util = require('./../util');

/**
 * ## *constructor*
 *
 *    `new Tween(state, 'opacity volume', 0, 1000, 5000, 'out')`<br>
 *
 * @param obj
 * @param properties
 * @param from
 * @param to
 * @param duration
 * @param easing
 * @constructor
 */
var Tween = function(obj, properties, from, to, duration, easing) {
	if ('string' == typeof properties)
		this._props = properties.split(' ');
	else if (Array.isArray(properties))
		this._props = properties;
	else
		this._props = [properties] || [];

	if ('function' == typeof easing)
		this.easing = easing;
	else
		this.easing = Ease[easing || 'linear']

	this.from = undefined != from ? from : 0;
	this.to = undefined != to ? to : 1;
	this.duration = undefined != duration ? duration : 400;
	this._obj = obj;
};
util.inherits(Tween, Cycle);

/**
 * ## *start*
 */
Tween.prototype.start = function(time) {
	this.value = this.from;
	this._cur = 0;
	this._update(time);
};

/**
 * ## *tick*
 */
Tween.prototype.tick = function(time) {
	this._cur += time.delta;
	this.value = this.easing(this._cur, this.from, this.to - this.from, this.duration);
	if (this._cur >= this.duration) this.value = this.to;
	this._update(time);

	return (this._cur < this.duration);
};

/**
 * ## *end*
 */
Tween.prototype.end = function(time) {};

/**
 * ## *reverse*
 */
Tween.prototype.reverse = function() {
	this.from = [this.to, this.to = this.from][0];
};

/**
 * **internal sugar**
 * - - - - - - - - -
 */

/**
 * ## *_update*
 *
 * @private
 */
Tween.prototype._update = function(time) {
	for (var i = 0, len = this._props.length; i < len; i++) {
		var p = this._obj[this._props[i]] || this._props[i];

		if ('function' == typeof p) {
			p.call(this._obj, this.value, time, this);
		}
		else {
			this._obj[this._props[i]] = this.value;
		}
	}
};

/** **exports** */
module.exports.Tween = Tween;

});

require.define("/lib/loop/cycle.js",function(require,module,exports,__dirname,__filename,process,global){/**
 * ## *constructor*
 *
 * @constructor
 */
var Cycle = function() {};

/**
 * ## *start*
 */
Cycle.prototype.start = function(time) {};

/**
 * ## *tick*
 */
Cycle.prototype.tick = function(time) {};

/**
 * ## *end*
 */
Cycle.prototype.end = function(time) {};

/** **exports** */
module.exports.Cycle = Cycle;

});

require.define("/lib/loop/ease.js",function(require,module,exports,__dirname,__filename,process,global){/**
 * http://gizma.com/easing/
 * @type {Object}
 */

var Ease = {
	/**
	 * no easing, no acceleration
	 *
	 * @param t time
	 * @param b begin
	 * @param c change (end - start)
	 * @param d duration
	 * @return {Number}
	 */
	linear: function(t, b, c, d) {
		return c * t / d + b;
	},

	/**
	 * accelerating from zero velocity
	 *
	 * @param t
	 * @param b
	 * @param c
	 * @param d
	 * @return {Number}
	 */
	inQuad: function(t, b, c, d) {
		return c * (t /= d) * t + b;
	},

	/**
	 * decelerating to zero velocity
	 *
	 * @param t
	 * @param b
	 * @param c
	 * @param d
	 * @return {Number}
	 */
	outQuad: function(t, b, c, d) {
		return -c * (t /= d) * (t - 2) + b;
	},

	/**
	 * acceleration until halfway, then deceleration
	 *
	 * @param t
	 * @param b
	 * @param c
	 * @param d
	 * @return {Number}
	 */
	inOutQuad: function(t, b, c, d) {
		if ((t /= d / 2) < 1) return c / 2 * t * t + b;
		return -c / 2 * ((--t) * (t - 2) - 1) + b;
	},

	/**
	 * accelerating from zero velocity
	 *
	 * @param t
	 * @param b
	 * @param c
	 * @param d
	 * @return {Number}
	 */
	inCubic: function(t, b, c, d) {
		return c * (t /= d) * t * t + b;
	},

	/**
	 * decelerating to zero velocity
	 *
	 * @param t
	 * @param b
	 * @param c
	 * @param d
	 * @return {Number}
	 */
	outCubic: function(t, b, c, d) {
		return c * ((t = t / d - 1) * t * t + 1) + b;
	},

	/**
	 * acceleration until halfway, then deceleration
	 *
	 * @param t
	 * @param b
	 * @param c
	 * @param d
	 * @return {Number}
	 */
	inOutCubic: function(t, b, c, d) {
		if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
		return c / 2 * ((t -= 2) * t * t + 2) + b;
	},

	/**
	 * accelerating from zero velocity
	 *
	 * @param t
	 * @param b
	 * @param c
	 * @param d
	 * @return {Number}
	 */
	inQuart: function(t, b, c, d) {
		return c * (t /= d) * t * t * t + b;
	},

	/**
	 * decelerating to zero velocity
	 *
	 * @param t
	 * @param b
	 * @param c
	 * @param d
	 * @return {Number}
	 */
	outQuart: function(t, b, c, d) {
		return -c * ((t = t / d - 1) * t * t * t - 1) + b;
	},

	/**
	 * acceleration until halfway, then deceleration
	 *
	 * @param t
	 * @param b
	 * @param c
	 * @param d
	 * @return {Number}
	 */
	inOutQuart: function(t, b, c, d) {
		if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
		return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
	},

	/**
	 * accelerating from zero velocity
	 *
	 * @param t
	 * @param b
	 * @param c
	 * @param d
	 * @return {Number}
	 */
	inQuint: function(t, b, c, d) {
		return c * (t /= d) * t * t * t * t + b;
	},

	/**
	 * decelerating to zero velocity
	 *
	 * @param t
	 * @param b
	 * @param c
	 * @param d
	 * @return {Number}
	 */
	outQuint: function(t, b, c, d) {
		return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
	},

	/**
	 * acceleration until halfway, then deceleration
	 *
	 * @param t
	 * @param b
	 * @param c
	 * @param d
	 * @return {Number}
	 */
	inOutQuint: function(t, b, c, d) {
		if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b;
		return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
	},

	/**
	 * accelerating from zero velocity
	 *
	 * @param t
	 * @param b
	 * @param c
	 * @param d
	 * @return {Number}
	 */
	inSine: function(t, b, c, d) {
		return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
	},

	/**
	 * decelerating to zero velocity
	 *
	 * @param t
	 * @param b
	 * @param c
	 * @param d
	 * @return {Number}
	 */
	outSine: function(t, b, c, d) {
		return c * Math.sin(t / d * (Math.PI / 2)) + b;
	},

	/**
	 * acceleration until halfway, then deceleration
	 *
	 * @param t
	 * @param b
	 * @param c
	 * @param d
	 * @return {Number}
	 */
	inOutSine: function(t, b, c, d) {
		return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
	},

	/**
	 * accelerating from zero velocity
	 *
	 * @param t
	 * @param b
	 * @param c
	 * @param d
	 * @return {Number}
	 */
	inExpo: function(t, b, c, d) {
		return (t == 0) ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
	},

	/**
	 * decelerating to zero velocity
	 *
	 * @param t
	 * @param b
	 * @param c
	 * @param d
	 * @return {Number}
	 */
	outExpo: function(t, b, c, d) {
		return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
	},

	/**
	 * acceleration until halfway, then deceleration
	 *
	 * @param t
	 * @param b
	 * @param c
	 * @param d
	 * @return {Number}
	 */
	inOutExpo: function(t, b, c, d) {
		if (t == 0) return b;
		if (t == d) return b + c;
		if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
		return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
	},

	/**
	 * accelerating from zero velocity
	 *
	 * @param t
	 * @param b
	 * @param c
	 * @param d
	 * @return {Number}
	 */
	inCirc: function(t, b, c, d) {
		return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
	},

	/**
	 * decelerating to zero velocity
	 *
	 * @param t
	 * @param b
	 * @param c
	 * @param d
	 * @return {Number}
	 */
	outCirc: function(t, b, c, d) {
		return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
	},

	/**
	 * acceleration until halfway, then deceleration
	 * @param t
	 * @param b
	 * @param c
	 * @param d
	 * @return {Number}
	 */
	inOutCirc: function(t, b, c, d) {
		if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
		return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
	}
};

/**
 * Aliases
 */

Ease.in = Ease.inQuad;
Ease.out = Ease.outQuad;
Ease.inOut = Ease.inOutQuad;

/** **exports** */
module.exports.Ease = Ease;

});

require.define("/lib/util.js",function(require,module,exports,__dirname,__filename,process,global){var util = module.exports = {};

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

});

require.define("/lib/index.js",function(require,module,exports,__dirname,__filename,process,global){/**
 * **loop.js**
 */

/** **exports** */
var loop = module.exports = {
	Application: require('./application').Application,
	State: require('./state').State,
	Machine: require('./state/machine').Machine,
	Transition: require('./transition').Transition,
	Loop: require('./loop').Loop,
	Cycle: require('./loop/cycle').Cycle,
	Ease: require('./loop/ease').Ease,
	Tween: require('./loop/tween').Tween,
	util: require('./util')
};

/**
 *
 * @param target
 */
loop.scope = function(target) {
	for (var p in this) {
		if (this.hasOwnProperty(p)) {
			target[p] = this[p];
		}
	}
};

/** for the browser */
if (window) {
	window.loop = loop;
}

});
require("/lib/index.js");
