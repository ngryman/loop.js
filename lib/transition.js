var Tween = require('./loop/tween').Tween;

/**
 * ## *constructor*
 *
 * @param options
 * @constructor
 */
var Transition = function(state, options) {
	options = options || {};
	Tween.prototype.constructor.call(this, state, state.transition, options.from, options.to, options.duration, options.easing);
};
Transition.prototype = new Tween();
Transition.prototype.constructor = Transition;

/**
 * **internal sugar**
 * - - - - - - - - -
 */

/** **exports** */
module.exports.Transition = Transition;
