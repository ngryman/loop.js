var chai = chai || require('chai');
global.window = undefined == typeof window ? window : global;

var should = chai.should();

var loop = require('../lib');
var util = loop.util;
var Transition = loop.Transition;
var State = loop.State;
var Ease = loop.Ease;

describe('util', function() {
	describe('.createFlexibleObject', function() {
		it('should do nothing when param is not defined', function() {
			should.not.exist(util.createFlexibleObject(Transition));
		});

		it('should return the same instance as param', function() {
			var param = new Transition();
			var inst = util.createFlexibleObject(Transition, param);
			inst.should.be.eql(param);
		});

		it('should create a valid instance when param is a string', function() {
			var state = new State();
			var inst = util.createFlexibleObject(Transition, 'inOut', 'easing', Ease, state);
			inst.should.be.instanceof(Transition);
			inst.should.have.property('_obj', state);
			inst.should.have.property('easing', Ease.inOut);
		});

		it('should create a valid instance when param is a plain object', function() {
			var state = new State();
			var inst = util.createFlexibleObject(Transition, {
				easing: 'in',
				to: 1337,
				duration: 42
			}, null, null, state);
			inst.should.be.instanceof(Transition);
			inst.should.have.property('_obj', state);
			inst.should.have.property('easing', Ease.in);
			inst.should.have.property('to', 1337);
			inst.should.have.property('duration', 42);
		});

		it('should create a valid instance param is a string and the name of a class', function() {
			global.SpecialTransition = function() {
				Transition.prototype.constructor.apply(this, arguments);
			};
			util.inherits(SpecialTransition, Transition);

			var state = new State();
			var inst = util.createFlexibleObject(Transition, 'specialTransition', null, null, state);
			inst.should.be.instanceof(Transition);
			inst.should.be.instanceof(global.SpecialTransition);
			inst.should.have.property('_obj', state);

			delete global.SpecialTransition;
		});
	});
});
