var chai = chai || require('chai');
global.window = undefined == typeof window ? window : global;

var should = chai.should();

var Application = require('../lib').Application;
var State = require('../lib').State;
var Transition = require('../lib').Transition;

describe('Application', function() {
	var shared = new Application();

	describe('#when', function() {
		it('should only create the backed state given event and state name', function() {
			var app = new Application();
			app.when('init', 'test');
			app._states.should.have.deep.property('test.state').be.instanceof(State);
			app._states.test.state.should.have.deep.property('init', State.prototype.init);
		});

		it('should only create the backed state given multiple events name and a state name', function() {
			var app = new Application();
			app.when('init cleanup', 'test');
			app._states.should.have.deep.property('test.state').and.be.instanceof(State);
			app._states.test.state.should.have.deep.property('init', State.prototype.init);
			app._states.test.state.should.have.deep.property('cleanup', State.prototype.cleanup);
		});

		it('should accept multiple state names', function() {
			var app = new Application();
			app.when('init cleanup', 'state1 state2');
			app._states.should.have.deep.property('state1.state').and.be.instanceof(State);
			app._states.state1.state.should.have.deep.property('init', State.prototype.init);
			app._states.state1.state.should.have.deep.property('cleanup', State.prototype.cleanup);
			app._states.should.have.deep.property('state1.state').and.be.instanceof(State);
			app._states.state2.state.should.have.deep.property('init', State.prototype.init);
			app._states.state2.state.should.have.deep.property('cleanup', State.prototype.cleanup);
		});

		it('should accept an object as events', function() {
			var app = new Application();
			var init = function() {};
			var enterExit = function() {};
			app.when({
				init: init,
				'enter exit': enterExit
			}, 'state1 state2');
			app._states.should.have.deep.property('state1.state').and.be.instanceof(State);
			app._states.state1.state.should.have.deep.property('init', init);
			app._states.state1.state.should.have.deep.property('enter', enterExit);
			app._states.state1.state.should.have.deep.property('exit', enterExit);
			app._states.should.have.deep.property('state1.state').and.be.instanceof(State);
			app._states.state2.state.should.have.deep.property('init', init);
			app._states.state2.state.should.have.deep.property('enter', enterExit);
			app._states.state2.state.should.have.deep.property('exit', enterExit);
		});

		it('should override with the given delegate given event and state names', function() {
			var app = new Application();
			var delegate = function() { return "hi, I'm Mister delegate" };
			app.when('init', 'test', delegate);
			app._states.should.have.deep.property('test.state').and.be.instanceof(State);
			app._states.test.state.should.have.deep.property('init', delegate);
		});

		it('should override with the given delegate given multiple events name and a state name', function() {
			var delegate = function() { return "hi, I'm Mister delegate" };
			shared.when('init cleanup', 'test', delegate);
			shared._states.should.have.deep.property('test.state').and.be.instanceof(State);
			shared._states.test.state.should.have.deep.property('init', delegate);
			shared._states.test.state.should.have.deep.property('cleanup', delegate);
		});

		it('should override when redefining existing events for the same state', function() {
			var delegate = function() { return "hi, I'm Miss delegatess" };
			shared.when('init cleanup', 'test', delegate);
			shared._states.test.state.should.have.deep.property('init', delegate);
			shared._states.test.state.should.have.deep.property('cleanup', delegate);
		});

		it('should pass the event name as argument', function(done) {
			var app = new Application();
			app.when('enter exit', 'test', function(event) {
				event.should.eql('enter');
				done();
			});
			app.change('test');
		});

		it('should accept additional transition parameter for transition', function() {
			var app = new Application();
			var called = 0;
			app.when('transition', 'test', function() { called++ }, 'inOut');
			app._states.test.trans.should.be.instanceof(Transition);
		});

		it('should pass the from value at the first call of transition event', function(done) {
			var called = true;
			var app = new Application();
			app.init('state1', function() {})
				.when('enter exit', 'state1', function() {})
				.when('focus blur', 'state1', function() {})
				.transition('state1', function(event, value) {
					if (called) return;
					called = true;
					value.should.eql(0);
				}, 'out');
			app.init('state2', function() {})
				.when('enter exit', 'state2', function() {}).when('focus blur', 'state2', function() {});
			app.change('state1', done);
		});
	});

	describe('#for', function() {
		it('should only create the backed state given event and a state name', function() {
			var app = new Application();
			app.for('test', 'init');
			app._states.should.have.deep.property('test.state').be.instanceof(State);
			app._states.test.state.should.have.deep.property('init', State.prototype.init);
		});

		it('should only create the backed state given multiple events name and a state name', function() {
			var app = new Application();
			app.for('test', 'init cleanup');
			app._states.should.have.deep.property('test.state').and.be.instanceof(State);
			app._states.test.state.should.have.deep.property('init', State.prototype.init);
			app._states.test.state.should.have.deep.property('cleanup', State.prototype.cleanup);
		});

		it('should accept multiple state names', function() {
			var app = new Application();
			app.for('state1 state2', 'init cleanup');
			app._states.should.have.deep.property('state1.state').and.be.instanceof(State);
			app._states.state1.state.should.have.deep.property('init', State.prototype.init);
			app._states.state1.state.should.have.deep.property('cleanup', State.prototype.cleanup);
			app._states.should.have.deep.property('state1.state').and.be.instanceof(State);
			app._states.state2.state.should.have.deep.property('init', State.prototype.init);
			app._states.state2.state.should.have.deep.property('cleanup', State.prototype.cleanup);
		});

		it('should accept an object as events', function() {
			var app = new Application();
			var init = function() {};
			var enterExit = function() {};
			app.for('state1 state2', {
				init: init,
				'enter exit': enterExit
			});
			app._states.should.have.deep.property('state1.state').and.be.instanceof(State);
			app._states.state1.state.should.have.deep.property('init', init);
			app._states.state1.state.should.have.deep.property('enter', enterExit);
			app._states.state1.state.should.have.deep.property('exit', enterExit);
			app._states.should.have.deep.property('state1.state').and.be.instanceof(State);
			app._states.state2.state.should.have.deep.property('init', init);
			app._states.state2.state.should.have.deep.property('enter', enterExit);
			app._states.state2.state.should.have.deep.property('exit', enterExit);
		});

		it('should override with the given delegate given event and state names', function() {
			var app = new Application();
			var delegate = function() { return "hi, I'm Mister delegate" };
			app.for('test', 'init', delegate);
			app._states.should.have.deep.property('test.state').and.be.instanceof(State);
			app._states.test.state.should.have.deep.property('init', delegate);
		});

		it('should override with the given delegate given multiple events name and a state name', function() {
			var delegate = function() { return "hi, I'm Mister delegate" };
			shared.for('test', 'init cleanup', delegate);
			shared._states.should.have.deep.property('test.state').and.be.instanceof(State);
			shared._states.test.state.should.have.deep.property('init', delegate);
			shared._states.test.state.should.have.deep.property('cleanup', delegate);
		});

		it('should override when redefining existing events for the same state', function() {
			var delegate = function() { return "hi, I'm Miss delegatess" };
			shared.for('test', 'init cleanup', delegate);
			shared._states.test.state.should.have.deep.property('init', delegate);
			shared._states.test.state.should.have.deep.property('cleanup', delegate);
		});

		it('should pass the event name as argument', function(done) {
			var app = new Application();
			app.for('test', 'enter exit', function(event) {
				event.should.eql('enter');
				done();
			});
			app.change('test');
		});

		it('should accept additional transition parameter for transition', function() {
			var app = new Application();
			var called = 0;
			app.for('test', 'transition', function() { called++ }, 'inOut');
			app._states.test.trans.should.be.instanceof(Transition);
		});

		it('should pass the from value at the first call of transition event', function(done) {
			var called = true;
			var app = new Application();
			app.init('state1', function() {})
				.for('state1', 'enter exit', function() {})
				.for('state1', 'focus blur', function() {})
				.transition('state1', function(event, value) {
					if (called) return;
					called = true;
					value.should.eql(0);
				}, 'out');
			app.init('state2', function() {})
				.for('state2', 'enter exit', function() {})
				.for('state2', 'focus blur', function() {});
			app.change('state1', done);
		});
	});

	describe('#loop', function() {
		it('should launch the game loop and do nothing when there is not a current state', function(done) {
			var app = new Application();
			app.loop();
			setTimeout(function() {
				app.abort();
				done();
			}, 50);
		});

		it('should launch the game loop using the first registered state and invoking its tick event', function(done) {
			var app = new Application();
			app.tick('test', function() {
				app.abort();
				done();
			}).loop();
		});

		it('should pass time information to a tick event', function(done) {
			var app = new Application();
			app.tick('test', function(event, time) {
				app.abort();
				time.should.not.be.undefined;
				time.should.have.property('now');
				time.should.have.property('old');
				time.should.have.property('delta');
				time.should.have.property('frame');
				done();
			}).loop();
		});

		it('should pass valid time information at the first frame', function(done) {
			var app = new Application();
			var now = +Date.now();
			app.tick('test', function(event, time) {
				app.abort();
				time.should.have.property('now').closeTo(now, 100);
				time.should.have.property('delta', 0);
				time.should.have.property('frame', 0);
				done();
			}).loop();
		});

		it('should increment frames', function(done) {
			var app = new Application();
			app.tick('test', function(event, time) {
				if (3 == time.frame) {
					app.abort();
					done();
				}
			}).loop();
		});
	});
});
