var chai = chai || require('chai');
global.window = undefined == typeof window ? window : global;

var should = chai.should();

var Loop = require('../lib').Loop;
var Cycle = require('../lib').Cycle;

describe('Loop', function() {
	describe('#add', function() {
		it('should add a cycle starting it if the loop is started', function(done) {
			var loop = new Loop();
			loop.start();
			var cycle = new Cycle();
			var called = false;
			cycle.start = function(time) {
				time.should.have.property('now');
				time.should.have.property('old');
				time.should.have.property('delta');
				time.should.have.property('frame');
				called = true
			};
			loop.add(cycle);
			called.should.be.true;
			setTimeout(function() {
				loop.halt();
				done();
			}, 25);
		});

		it('should add a cycle without starting it if the loop has not started yet', function() {
			var loop = new Loop();
			var cycle = new Cycle();
			var called = false;
			cycle.start = function() { called = true };
			loop.add(cycle);
			called.should.be.false;
		});

		it('should call the callback when cycle has finished', function(done) {
			var loop = new Loop();
			var cycle = new Cycle();
			cycle.tick = function() { return false };
			loop.start();
			loop.add(cycle, function(c) {
				loop.halt();
				c.should.be.instanceof(Cycle);
				done();
			});
		});
	});

	describe('#remove', function() {
		it('should remove a cycle and stop calling tick', function(done) {
			var loop = new Loop();
			var cycle = new Cycle();
			var startCalled = true;
			var tickCalled = false;
			cycle.start = function() { startCalled = true };
			cycle.tick = function() { tickCalled = true };
			loop.start();
			loop.add(cycle);
			loop.remove(cycle);
			setTimeout(function() {
				loop.halt();
				tickCalled.should.be.false;
				done();
			}, 25);
		});

		it('should do nothing when the cycle is not present', function() {
			var loop = new Loop();
			var cycle = new Cycle();
			loop.add(cycle);
			loop.remove(new Cycle());
			loop._cycles[0].should.eql(cycle);
		});
	});

	describe('#start', function() {
		it('should start the loop', function(done) {
			var loop = new Loop();
			loop.start();
			setTimeout(function() {
				loop.halt();
				done();
			}, 25);
		});

		it('should update time information correctly', function(done) {
			var loop = new Loop();
			var now = +Date.now();
			loop.start();
			setTimeout(function() {
				loop.halt();
				loop._time.should.have.property('now').closeTo(now, 200);
				loop._time.should.have.property('delta').gt(0);
				done();
			}, 100);
		});

		it('should increment frames', function(done) {
			var loop = new Loop();
			loop.start();
			setTimeout(function() {
				loop.halt();
				loop._time.frame.should.be.gt(0);
				done();
			}, 100);
		});
	});

	describe('#halt', function() {
		it('should halt the loop for the next frame', function(done) {
			var loop = new Loop();
			var cycle = new Cycle();
			var calledNb = 0;
			cycle.tick = function() { calledNb++ };
			loop.add(cycle);
			loop.start();
			loop.halt();
			setTimeout(function() {
				loop.halt();
				calledNb.should.equal(1);
				done();
			}, 25);
		});
	});

	it('should stop cycle and remove it when tick return false', function(done) {
		var loop = new Loop();
		var cycle = new Cycle();
		cycle.tick = function() { return false; };
		cycle.end = function(time) {
			loop.halt();
			time.should.have.property('now');
			time.should.have.property('old');
			time.should.have.property('delta');
			time.should.have.property('frame');
			loop._cycles.should.have.length(0);
			done();
		};
		loop.start();
		loop.add(cycle);
	});
});
