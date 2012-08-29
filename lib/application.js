var State = require('./state').State;
var Manager = require('./state/manager').Manager;

/**
 * ## *constructor*
 *
 * @constructor
 */
var Application = function() {
	Manager.prototype.constructor.call(this);

	this._time = {
		now: 0,
		old: 0,
		delta: 0,
		frame: -1
	};
};
Application.prototype = new Manager();
Application.prototype.constructor = Application;

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
 * @param delegate
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
	this._loop(this._time.now = Date.now());

	return this;
};

/**
 * ## *abort*
 *
 */
Application.prototype.abort = function() {
	window.cancelAnimationFrame(this._frameId);
	return this;
};

/**
 * ## *_loop*
 *
 * @param time
 * @private
 */
Application.prototype._loop = function(time) {
	var self = this;

	this._time.old = this._time.now;
	this._time.now = time;
	this._time.delta = time - this._time.old;
	this._time.frame++;

	this._frameId = window.requestAnimationFrame(function(time) { self._loop(time); });
	this.fire('tick', this._time);
};


// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller
// fixes from Paul Irish and Tino Zijdel

(function() {
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
			|| window[vendors[x]+'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame)
		window.requestAnimationFrame = function(callback, element) {
			var currTime = new Date().getTime();
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
		perf.webkitNow  ||
		perf.mozNow     ||
		perf.msNow      ||
		perf.oNow       ||
		function() {
			return Date.now()
		};

	return perf;
}());

/** **exports** */
module.exports.Application = Application;