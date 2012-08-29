require('chai').should();
global.window = global;
// TODO: simulate browser env here

var Application = require('../lib').Application;
var State = require('../lib').State;

describe('Application', function() {
	var shared = new Application();

	describe('#when', function() {
		it('should only create the backed state given event and state names', function() {
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

		it('should pass time informations to a tick event', function(done) {
			var app = new Application();
			app.tick('test', function(time) {
				app.abort();
				time.should.not.be.undefined;
				time.should.have.property('now');
				time.should.have.property('old');
				time.should.have.property('delta');
				time.should.have.property('frame');
				done();
			}).loop();
		});

		it('should pass valid time informations at the first frame', function(done) {
			var app = new Application();
			var now = Date.now();
			app.tick('test', function(time) {
				app.abort();
				time.should.have.property('now').within(now - 100, now + 100);
				time.should.have.property('delta', 0);
				time.should.have.property('frame', 0);
				done();
			}).loop();
		});

		it('should increment frames', function(done) {
			this.timeout = 500;
			var app = new Application();
			app.tick('test', function(time) {
				if(3 == time.frame) {
					app.abort();
					done();
				}
			}).loop();
		});
	});
});
