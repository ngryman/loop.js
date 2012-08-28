/**
 * ## *constructor*
 *
 * @param options
 * @constructor
 */
var Transition = function(options) {
	if (undefined != options) {
		for (var k in options) {
			this[k] = options[k];
		}
	}
};

/**
 * ## *start*
 */
Transition.prototype.start = function(state) {};

/**
 * ## *update*
 */
Transition.prototype.update = function(state, time) {};

/**
 * ## *end*
 */
Transition.prototype.end = function(state) {};

/**
 * **internal sugar**
 * - - - - - - - - -
 */

/** **exports** */
module.exports.Transition = Transition;
