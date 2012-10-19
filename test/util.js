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

	describe('.commonAssignement', function() {
		it('should take a simple word', function() {
			var assignement = util.commonAssignement('hello', 42);
			assignement.should.be.a('object');
			assignement.should.have.property('hello', 42);
		});

		it('should take multiple words', function() {
			var assignement = util.commonAssignement('hello how are you', 42);
			assignement.should.be.a('object');
			assignement.should.have.property('hello', 42);
			assignement.should.have.property('how', 42);
			assignement.should.have.property('are', 42);
			assignement.should.have.property('you', 42);
		});

		it('should take an array', function() {
			var assignement = util.commonAssignement(['hello', 'how', 'are', 'you'], 42);
			assignement.should.be.a('object');
			assignement.should.have.property('hello', 42);
			assignement.should.have.property('how', 42);
			assignement.should.have.property('are', 42);
			assignement.should.have.property('you', 42);
		});

		it('should take an object', function() {
			var assignement = util.commonAssignement({ hello: 'mummy', bye: 'puppy' });
			assignement.should.be.a('object');
			assignement.should.have.property('hello', 'mummy');
			assignement.should.have.property('bye', 'puppy');
		});

		it('should take an object with depp hierarchy', function() {
			var assignement = util.commonAssignement({
				'hello bye': 'puppy'
			});
			assignement.should.be.a('object');
			assignement.should.have.property('hello', 'puppy');
			assignement.should.have.property('bye', 'puppy');
		});

		it('should share the same reference assignment', function() {
			var foo = function() {};
			var assignement = util.commonAssignement(['hello', 'how', 'are', 'you'], foo);
			assignement.should.be.a('object');
			assignement.should.have.property('hello', foo).and.not.eql(function() {});
			assignement.should.have.property('how', foo).and.not.eql(function() {});
			assignement.should.have.property('are', foo).and.not.eql(function() {});
			assignement.should.have.property('you', foo).and.not.eql(function() {});
		});
	});

	describe('.multipleAssign', function() {
		it('should take a simple word as key and a value as assignments', function() {
			util.multipleAssign('foo', 'bar', function(key, prop, value) {
				key.should.be.eql('foo');
				should.not.exist(prop);
				value.should.be.eql('bar');
			});
		});

		it('should take a simple word as key and an object as assignments', function() {
			var obj = {};

			util.multipleAssign('foo', { bar: 'baz', qux: 666 }, function(key, prop, value) {
				obj[key] = obj[key] || {};
				obj[key][prop] = value;
			});

			obj.should.have.property('foo');
			obj.should.have.deep.property('foo.bar', 'baz');
			obj.should.have.deep.property('foo.qux', 666);
		});

		it('should take a multiple words as key and an object as assignments', function() {
			var obj = {};

			util.multipleAssign('foo bar', { bar: 'baz', qux: 666 }, function(key, prop, value) {
				obj[key] = obj[key] || {};
				obj[key][prop] = value;
			});

			obj.should.have.property('foo');
			obj.should.have.deep.property('foo.bar', 'baz');
			obj.should.have.deep.property('foo.qux', 666);
			obj.should.have.property('bar');
			obj.should.have.deep.property('bar.bar', 'baz');
			obj.should.have.deep.property('bar.qux', 666);
		});

		it('should take a multiple words as key and an object as assignments and return a composed object when no callback is defined', function() {
			var obj = util.multipleAssign('foo bar', { bar: 'baz', qux: 666 });
			obj.should.have.property('foo');
			obj.should.have.deep.property('foo.bar', 'baz');
			obj.should.have.deep.property('foo.qux', 666);
			obj.should.have.property('bar');
			obj.should.have.deep.property('bar.bar', 'baz');
			obj.should.have.deep.property('bar.qux', 666);
		});
	});
});
