var async = require('async');
var State = require('../state').State;
var Loop = require('../loop').Loop;
var Transition = require('../transition').Transition;
var Ease = require('../loop/ease').Ease;

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
Machine.prototype.push = function(name, state, trans0, topts) {
	var tklass;

	if (this._states[name] || undefined == name) return this;

	if (state && !(state instanceof State)) {
		topts = trans0;
		trans0 = state;
		state = null;
	}

	topts = topts || {};

	if (trans0) {
		if (!(trans0 instanceof Transition)) {
			try {
				var tname = trans0;

				// ease name, instantiate a simple transition class with given easing
				if (tname in Ease) {
					topts.easing = tname;
					tklass = Transition;
				}
				// other name, try to instantiate the given class name
				else {
					var kname = tname[0].toUpperCase() + tname.slice(1).toLowerCase();
					tklass = require(tname)[kname];
				}
			}
			catch (err) {
				trans0 = null;
			}
		}
		else {
			tklass = trans0.constructor;
			topts = trans0;
		}
	}

	var names = name.split(this._options.separator);
	name = names.shift();
	var root = name;

	// TODO: from child to parent
	// for each state, add to states, link to the previous one child
	// if a state already exist, just link to the previous one child
	var parent = this._pushEntry(root, null, names.length == 0 ? state : null, tklass, topts);
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
Machine.prototype._pushEntry = function(name, parent, state, transConstructor, transOptions) {
	if (this._states[name]) return this._states[name];

	state = state || new State();

	var trans;
	if (parent) {
		trans = parent.trans;
	}
	else if (transConstructor) {
		trans = new transConstructor(state, transOptions);
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
