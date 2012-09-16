var Ease = {
    /**
     *
     * @param t time
     * @param b begin
     * @param c change (end - start)
     * @param d duration
     * @return {Number}
     */
    linear: function(t, b, c, d) {
        return c * t / d + b;
    },

    /**
     *
     * @param t
     * @param b
     * @param c
     * @param d
     * @return {Number}
     */
    inQuad: function(t, b, c, d) {
        return c * (t /= d) * t + b;
    },

    /**
     *
     * @param t
     * @param b
     * @param c
     * @param d
     * @return {Number}
     */
    outQuad: function(t, b, c, d) {
        return -c * (t /= d) * (t - 2) + b;
    },

    /**
     *
     * @param t
     * @param b
     * @param c
     * @param d
     * @return {Number}
     */
    inOutQuad: function(t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t + b;
        return -c / 2 * ((--t) * (t - 2) - 1) + b;
    },

    /**
     *
     * @param t
     * @param b
     * @param c
     * @param d
     * @return {Number}
     */
    inCubic: function(x, t, b, c, d) {
        return c * (t /= d) * t * t + b;
    },

    /**
     *
     * @param t
     * @param b
     * @param c
     * @param d
     * @return {Number}
     */
    outCubic: function(x, t, b, c, d) {
        return c * ((t = t / d - 1) * t * t + 1) + b;
    },

    /**
     *
     * @param t
     * @param b
     * @param c
     * @param d
     * @return {Number}
     */
    inOutCubic: function(x, t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
        return c / 2 * ((t -= 2) * t * t + 2) + b;
    },

    /**
     *
     * @param t
     * @param b
     * @param c
     * @param d
     * @return {Number}
     */
    inQuart: function(x, t, b, c, d) {
        return c * (t /= d) * t * t * t + b;
    },

    /**
     *
     * @param t
     * @param b
     * @param c
     * @param d
     * @return {Number}
     */
    outQuart: function(x, t, b, c, d) {
        return -c * ((t = t / d - 1) * t * t * t - 1) + b;
    },

    /**
     *
     * @param t
     * @param b
     * @param c
     * @param d
     * @return {Number}
     */
    inOutQuart: function(x, t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
        return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
    },

    /**
     *
     * @param t
     * @param b
     * @param c
     * @param d
     * @return {Number}
     */
    inQuint: function(x, t, b, c, d) {
        return c * (t /= d) * t * t * t * t + b;
    },

    /**
     *
     * @param t
     * @param b
     * @param c
     * @param d
     * @return {Number}
     */
    outQuint: function(x, t, b, c, d) {
        return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
    },

    /**
     *
     * @param t
     * @param b
     * @param c
     * @param d
     * @return {Number}
     */
    inOutQuint: function(x, t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b;
        return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
    },

    /**
     *
     * @param t
     * @param b
     * @param c
     * @param d
     * @return {Number}
     */
    inSine: function(x, t, b, c, d) {
        return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
    },

    /**
     *
     * @param t
     * @param b
     * @param c
     * @param d
     * @return {Number}
     */
    outSine: function(x, t, b, c, d) {
        return c * Math.sin(t / d * (Math.PI / 2)) + b;
    },

    /**
     *
     * @param t
     * @param b
     * @param c
     * @param d
     * @return {Number}
     */
    inOutSine: function(x, t, b, c, d) {
        return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
    },

    /**
     *
     * @param t
     * @param b
     * @param c
     * @param d
     * @return {Number}
     */
    inExpo: function(x, t, b, c, d) {
        return (t == 0) ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
    },

    /**
     *
     * @param t
     * @param b
     * @param c
     * @param d
     * @return {Number}
     */
    outExpo: function(x, t, b, c, d) {
        return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
    },

    /**
     *
     * @param t
     * @param b
     * @param c
     * @param d
     * @return {Number}
     */
    inOutExpo: function(x, t, b, c, d) {
        if (t == 0) return b;
        if (t == d) return b + c;
        if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
        return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
    },

    /**
     *
     * @param t
     * @param b
     * @param c
     * @param d
     * @return {Number}
     */
    inCirc: function(x, t, b, c, d) {
        return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
    },

    /**
     *
     * @param t
     * @param b
     * @param c
     * @param d
     * @return {Number}
     */
    outCirc: function(x, t, b, c, d) {
        return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
    },

    /**
     *
     * @param t
     * @param b
     * @param c
     * @param d
     * @return {Number}
     */
    inOutCirc: function(x, t, b, c, d) {
        if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
        return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
    }
};

/**
 * Aliases
 */

Ease.in = Ease.inQuad;
Ease.out = Ease.outQuad;
Ease.inOut = Ease.inOutQuad;
