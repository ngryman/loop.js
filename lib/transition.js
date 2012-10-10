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
	Tween.prototype.constructor.call(this, state, 'transition', options.from, options.to, options.duration, options.easing);
};
util.inherits(Transition, Tween);

/**
 * **internal sugar**
 * - - - - - - - - -
 */

/** **exports** */
module.exports.Transition = Transition;
