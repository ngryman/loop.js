/**
 * **loop.js**
 */

/** **exports** */
var loop = module.exports = {
	Application: require('./application').Application,
	State: require('./state').State,
	Machine: require('./state/machine').Machine,
	Transition: require('./transition').Transition,
	Loop: require('./loop').Loop,
	Cycle: require('./loop/cycle').Cycle,
	Ease: require('./loop/ease').Ease,
	Tween: require('./loop/tween').Tween,
	util: require('./util')
};

/**
 *
 * @param target
 */
loop.scope = function(target) {
	for (var p in this) {
		if (this.hasOwnProperty(p)) {
			target[p] = this[p];
		}
	}
};

/** for the browser */
if (window) {
	window.loop = loop;
}
