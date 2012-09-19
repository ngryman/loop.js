var Cycle = require('./cycle').Cycle;
var Ease = require('./ease').Ease;

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
    this._obj = obj;
    this._props = properties.split(' ');
    this.from = undefined != from ? from : 0;
    this.to = undefined != to ? to : 1;
    this.duration = duration || 400;
    this.easing = Ease[easing || 'linear'];
};
Tween.prototype = new Cycle();
Tween.prototype.constructor = Tween;

/**
 * ## *start*
 */
Tween.prototype.start = function() {
	this.value = this.from;
    this._cur = 0;
	this._update();
};

/**
 * ## *tick*
 */
Tween.prototype.tick = function(time) {
    this._cur += time.delta;
    this.value = this.easing(this._cur, this.from, this.to - this.from, this.duration);
	this._update();

	return (this.value >= this.to);
};

/**
 * ## *end*
 */
Tween.prototype.end = function() {
	this.value = this.to;
	this._update();
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
Tween.prototype._update = function() {
	for (var i = 0, len = this._props.length; i < len; i++) {
		this._obj[this._props[i]] = this.value;
	}
};

/** **exports** */
module.exports.Tween = Tween;
