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
	this._tick(this._time.now = window.performance.now());
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
