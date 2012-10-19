var Machine = require('./state/machine').Machine;
var Loop = require('./loop').Loop;
var Cycle = require('./loop/cycle').Cycle;
var Transition = require('./transition').Transition;
var Ease = require('./loop/ease').Ease;
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
Application.prototype.transition = function(name, delegate, trans) {
	return this.when('transition', name, delegate, trans);
};

/**
 * ## *when*
 *
 * @param events
 * @param names
 * @param [delegate]
 * @return {*}
 */
Application.prototype.when = function(events, names, delegate, trans) {
	var self = this,
		bindings = util.commonAssignement(events, delegate);

	util.multipleAssign(names, bindings, function(name, event, delegate) {
		if (!self._states[name]) self.push(name);

		var entry = self._states[name];
		if (delegate) entry.state[event] = delegate;
		if (trans) entry.trans = util.createFlexibleObject(Transition, trans, 'easing', Ease, entry.state);
	});

	return this;
};

Application.prototype.for = function(names, events, delegate, trans) {
	return this.when(events, names, delegate, trans);
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
