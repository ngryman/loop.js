/**
 * ## *constructor*
 *
 * **does** construct internal variables used by the system
 * **and** has to be called when subclassing
 *
 * @constructor
 */
var State = function() {};

/**
 * **overridable**
 * - - - - - - - -
 */

/**
 * ## *init*
 *
 * **called** when state is entered the first time
 * **and** should be used to initialize the state (i.e. loading resources, creating maps, ...)
 */
State.prototype.init = function() {};

/**
 * ## *cleanup*
 *
 * **called manually** when the state will never be used again
 * TODO: when? manually? automatically? configurable?
 */
State.prototype.cleanup = function() {};

/**
 * ## *enter*
 *
 * **called** each time the state become *active*
 * **and** should be used to prepare the state (i.e. show objects, configure, ...)
 */
State.prototype.enter = function() {};

/**
 * ## *exit*
 */
State.prototype.exit = function() {};

/**
 * ## *focus*
 */
State.prototype.focus = function() {};

/**
 * ## *blur*
 */
State.prototype.blur = function() {};

/**
 * ## *pause*
 */
State.prototype.pause = function() {};

/**
 * ## *resume*
 */
State.prototype.resume = function() {};

/**
 * ## *tick*
 */
State.prototype.tick = function() {};

/**
 * ## *transition*
 */
State.prototype.transition = function() {};

/**
 * **internal sugar**
 * - - - - - - - - -
 */

/** **exports** */
module.exports.State = State;
