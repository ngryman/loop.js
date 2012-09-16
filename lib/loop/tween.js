var Cycle = require('./cycle').Cycle;

/**
 * ## *constructor*
 *
 *    `new Tween(state, 'opacity')`<br>
 *    `new Tween(state, 'opacity', 0, 0.5)`<br>
 *    `new Tween(state, 'volume', 'ease')`<br>
 *    `new Tween(state, 'volume', 1000, 'ease')`<br>
 *    `new Tween(state, 'height', 0, 100, 400, 'bounce')`<br>
 *    `new Tween(state, 'opacity volume', 1000, 'easeout')`<br>
 *
 * @constructor
 */
var Tween = function(obj, properties, from, to, duration, easing) {
//	this.from = this.from || 0;
//	this.to = undefined != this.to ? this.to : 1;
//	this.duration = undefined != this.duration ? this.duration : 400;
};
Tween.prototype = new Cycle();
Tween.prototype.constructor = Tween;

/**
 * ## *start*
 */
Tween.prototype.start = function() {
	this.value = this.from;
	this._update();
};

/**
 * ## *tick*
 */
Tween.prototype.tick = function(time) {
	this.value = this.from + time.delta * this.to;
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
		this._obj[this.props[i]] = this.value;
	}
};
