var Transition = require('../transition').Transition;

/**
 * ## *constructor*
 *
 * @param options
 * @constructor
 */
var Interpolation = function(options) {
	Transition.prototype.constructor.call(this, options);

	this.from = this.from || 0;
	this.to = undefined != this.to ? this.to : 1;
	this.duration = undefined != this.duration ? this.duration : 400;
};
Interpolation.prototype = new Transition();
Interpolation.prototype.constructor = Interpolation;

/**
 * ## *start*
 *
 * @param state
 */
Interpolation.prototype.start = function(state) {
	this.value = this.from;
	state.transition(this.value);
};

/**
 * ## *tick*
 *
 * @param state
 * @param time
 */
Interpolation.prototype.tick = function(state, time) {
	this.value = this.from + (+new Date - time) * this.to;
	state.transition(this.value);
};

/**
 * ## *end*
 *
 * @param state
 */
Interpolation.prototype.end = function(state) {
	this.value = this.to;
	state.transition(this.value);
};

/** **exports** */
module.exports.Interpolation = Interpolation;