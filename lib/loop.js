/**
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

	if (undefined != this._timerId) cycle.start(this._time);
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
