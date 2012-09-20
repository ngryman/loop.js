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
    var tklass = Transition;

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
                }
                // other name, try to instantiate the given class name
                else {
                    var kname = tname[0].toUpperCase() + tname.slice(1).toLowerCase();
                    tklass = require(tname)[kname];
                }

                this.transLoop = this.transLoop || new Loop();
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
    var parent = this._pushEntry(root, null, state, tklass, topts);
    while (names.length) {
        name = name + this._options.separator + names.shift();
        if (this._states[name]) break;
        parent = this._pushEntry(name, parent);
    }

    this._launchEntry = this._launchEntry || this._states[root];
    return this;
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

    if (this._current) {
        e = this._current;
        while (e) {
            toexit.push(e);
            e = e.parent;
        }
        toexit.reverse();
    }

    e = this._states[name];
    while (e) {
        toenter.push(e);
        e = e.parent;
    }
    toenter.reverse();

    if (toexit.length > 0) {
        if (toenter.length > toexit.length) {
            while (toenter[0] === toexit[0]) {
                toenter.shift();
                toexit.shift();
            }
        }
        for (i = 0, len = toexit.length; i < len; i++) {
            e = toexit[i];
            tochange.push((function(e) {
                return function(cb) {
                    return self._exit(e, cb);
                };
            })(e));
        }
    }

    for (i = 0, len = toenter.length; i < len; i++) {
        e = toenter[i];
        tochange.push((function(e) {
            return function(cb) {
                return self._enter(e, cb);
            };
        })(e));
    }

    async.parallel(tochange, function() {
        if (self._current) self._current.state.blur();
        self._current = toenter[toenter.length - 1];
        self._current.state.focus();
        if ('function' == typeof callback) callback();
    });

    return this;
};

/**
 * ## *fire*
 *
 * @param event
 * @return {Machine}
 */
Machine.prototype.fire = function(event) {
    if (!this._current) return this;

    var args = Array.prototype.slice.call(arguments, 1);
    this._current.state[event].apply(this._current.state, args);
    return this;
};

/**
 * **internal sugar**
 * - - - - - - - - -
 */

/**
 * ## *_pushEntry*
 *
 * @param name
 * @param parent
 * @param state
 * @param transConstructor
 * @param transOptions
 * @return {Machine}
 * @private
 */
Machine.prototype._pushEntry = function(name, parent, state, transConstructor, transOptions) {
    if (this._states[name]) return this._states[name];

    state = state || new State();

    var trans = parent ? parent.trans : new transConstructor(state, transOptions);

    var entry = {
        name: name,
        state: state,
        trans: trans,
        parent: parent,
        stack: {}
    };

    this._states[name] = entry;
    if (parent) entry.parent.stack[name] = entry;

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
    // initialize if this is the first time state is entered
    if (!entry.init) {
        entry.init = true;
        entry.state.init();
    }

    var cbw = function() {
        entry.active = true;
        entry.state.enter();
        cb();
    };

    cbw();
};

/**
 * ## *_exit*
 *
 * @param entry
 * @param cb
 * @private
 */
Machine.prototype._exit = function(entry, cb) {
    var cbw = function() {
        entry.active = false;
        entry.state.exit();
        cb();
    };

    cbw();
};

/** **exports** */
module.exports.Machine = Machine;
