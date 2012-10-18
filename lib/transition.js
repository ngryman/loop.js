var Tween = require('./loop/tween').Tween;
var util = require('./util');

/**
 * ## *constructor*
 *
 * @param options
 * @constructor
 */
var Transition = function(state, options) {
	options = options || {};
	Tween.prototype.constructor.call(this, state, _transition, options.from, options.to, options.duration, options.easing);
};
util.inherits(Transition, Tween);

function _transition() {
	var args = Array.prototype.slice.call(arguments);
	args.unshift('transition');
	this.transition.apply(this, args);
}

/**
 * **internal sugar**
 * - - - - - - - - -
 */

/** **exports** */
module.exports.Transition = Transition;
