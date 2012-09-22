var should = require('chai').should();
global.window = global;
// TODO: simulate browser env here

var Tween = require('../../lib').Tween;
var Ease = require('../../lib').Ease;

describe('Tween', function() {
	var tweenable = {
		opacity: 0,
		volume: 1
	};

	describe('constructor', function() {
		it('should initialize tween properly', function() {
			var tween = new Tween(tweenable, 'opacity', 0, 42, 1337, 'inOut');
			tween.from.should.eql(0);
			tween.to.should.eql(42);
			tween.duration.should.eql(1337);
			tween.easing.should.eql(Ease.inOut);
		});

		it('should default easing to linear', function() {
			var tween = new Tween(tweenable, 'opacity', 0, 1, 400);
			tween.easing.should.equal(Ease.linear);
		});

		it('should default duration to 400ms (jQuery default)', function() {
			var tween = new Tween(tweenable, 'opacity', 0, 1);
			tween.duration.should.equal(400);
		});

		it('should default to to 1', function() {
			var tween = new Tween(tweenable, 'opacity', 0);
			tween.to.should.equal(1);
		});

		it('should default from to 0', function() {
			var tween = new Tween(tweenable, 'opacity');
			tween.from.should.equal(0);
		});

		it('should initialize an array of properties', function() {
			new Tween(tweenable, ['opacity', 'volume'], 0, 42);
		});

		it('should initialize properties as function', function() {
			new Tween(tweenable, function() {}, 0, 42);
		});

		it('should do nothing without any parameter', function() {
			new Tween();
		});
	});

	describe('#start', function() {
		it('should set property to from value', function() {
			var tween = new Tween(tweenable, 'opacity volume', 0, 1, 400, 'in');
			tween.start();
			tweenable.opacity.should.eql(0);
			tweenable.volume.should.eql(0);

			tween = new Tween(tweenable, 'opacity volume', 1, 0, 400, 'in');
			tween.start();
			tweenable.opacity.should.eql(1);
			tweenable.volume.should.eql(1);
		});

		it('should set array of properties to from value', function() {
			var tween = new Tween(tweenable, ['opacity', 'volume'], 0, 1, 400, 'in');
			tween.start();
			tweenable.opacity.should.eql(0);
			tweenable.volume.should.eql(0);

			tween = new Tween(tweenable, ['opacity', 'volume'], 1, 0, 400, 'in');
			tween.start();
			tweenable.opacity.should.eql(1);
			tweenable.volume.should.eql(1);
		});

		it('should reset an already used tween', function() {
			var tween = new Tween(tweenable, 'opacity', 0, 1, 400, 'in');
			tween.start();
			tweenable.opacity.should.eql(0);
			tween.tick({ delta: 400 });
			tweenable.opacity.should.eql(1);
			tween.start();
			tweenable.opacity.should.eql(0);
			tween.tick({ delta: 400 });
			tweenable.opacity.should.eql(1);
		});
	});

	describe('#tick', function() {
		it('should update properties correctly', function() {
			var tween = new Tween(tweenable, 'opacity volume', 0, 1, 400, 'linear');
			tween.start();
			tween.tick({ delta: 200 });
			tweenable.opacity.should.eql(0.5);
			tweenable.volume.should.eql(0.5);

			tween.tick({ delta: 200 });
			tweenable.opacity.should.eql(1);
			tweenable.volume.should.eql(1);

			tween.tick({ delta: 100 });
			tweenable.opacity.should.be.gt(1);
			tweenable.volume.should.be.gt(1);
		});

		it('should update properties correctly when start is above 0', function() {
			var tween = new Tween(tweenable, 'opacity volume', 1, 2, 400, 'linear');
			tween.start();
			tween.tick({ delta: 200 });
			tweenable.opacity.should.eql(1.5);
			tweenable.volume.should.eql(1.5);

			tween.tick({ delta: 200 });
			tweenable.opacity.should.eql(2);
			tweenable.volume.should.eql(2);

			tween.tick({ delta: 100 });
			tweenable.opacity.should.be.gt(2);
			tweenable.volume.should.be.gt(2);
		});

		it('should update properties correctly when increment is negative', function() {
			var tween = new Tween(tweenable, 'opacity volume', 1, 0, 400, 'linear');
			tween.start();
			tween.tick({ delta: 200 });

			tweenable.opacity.should.eql(0.5);
			tweenable.volume.should.eql(0.5);

			tween.tick({ delta: 200 });
			tweenable.opacity.should.eql(0);
			tweenable.volume.should.eql(0);

			tween.tick({ delta: 100 });
			tweenable.opacity.should.be.lt(0);
			tweenable.volume.should.be.lt(0);
		});

		it('should return true when tween has reach the end', function() {
			var tween = new Tween(tweenable, 'opacity volume', 0, 1, 400, 'linear');
			tween.start();
			tween.tick({ delta: 400 }).should.be.true;

			tween.tick({ delta: 100 }).should.be.true;
		});

		it('should call a property if it is an object method', function(done) {
			var tween = new Tween(tweenable, 'callMeBaby', 0, 1, 400, 'linear');

			tweenable.callMeBaby = function(value, time, tween) {
				this.should.deep.eql(tweenable);
				value.should.eql(0);
				time.should.have.property('now');
				time.should.have.property('old');
				time.should.have.property('delta');
				time.should.have.property('frame');
				tween.should.be.instanceof(Tween);
			};
			tween.start({ now: 0, old: 0, delta: 0, frame: -1 });

			tweenable.callMeBaby = function(value) {
				value.should.eql(0.5);
				done();
			};
			tween.tick({ delta: 200 });
		});

		it('should call a property if it is a anonymous function, with the context of the object', function(done) {
			var tween = new Tween(tweenable, function() {
				this.should.deep.eql(tweenable);
				done();
			}, 0, 1, 400, 'linear');
			tween.start({ now: 0, old: 0, delta: 0, frame: -1 });
		});
	});

	describe('#end', function() {
		it('should set properties to to value', function() {
			var tween = new Tween(tweenable, 'opacity volume', 0, 1337, 400, 'linear');
			tween.start();
			tween.tick({ delta: 500 });
			tween.end();
			tweenable.opacity.should.eql(1337);
			tweenable.volume.should.eql(1337);
		});

		it('should return true when tween has reach the end', function() {
			var tween = new Tween(tweenable, 'opacity volume', 0, 1, 400, 'linear');
			tween.start();
			tween.tick({ delta: 400 }).should.be.true;

			tween.tick({ delta: 100 }).should.be.true;
		});

		// TODO: end should be called for very short / invalid durations
	});

	describe('#reverse', function() {
		it('should swap from and to values', function() {
			var tween = new Tween(tweenable, 'opacity', 0, 1, 400, 'linear');
			tween.reverse();
			tween.from.should.eql(1);
			tween.to.should.eql(0);
		});

		it('should reverse tweaning', function() {
			var tween = new Tween(tweenable, 'opacity', 0, 1, 400, 'linear');
			tween.start();
			tween.tick({ delta: 200 });
			tweenable.opacity.should.eql(0.5);
			tween.reverse();
			tween.tick({ delta: 200 });
			tweenable.opacity.should.eql(0);
		});
	});
});
