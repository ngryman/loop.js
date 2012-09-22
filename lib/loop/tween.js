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

	if ('string' == typeof properties)
		this._props = properties.split(' ');
	else if (Array.isArray(properties))
		this._props = properties;
	else
		this._props = [properties] || [];

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
	this._update(time);

	return (this.value >= this.to);
};

/**
 * ## *end*
 */
Tween.prototype.end = function(time) {
	this.value = this.to;
	this._update(time);
};

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
