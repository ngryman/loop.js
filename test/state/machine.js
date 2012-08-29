require('chai').should();
global.window = global;
// TODO: simulate browser env here

var Manager = require('../../lib').Manager;
var State = require('../../lib').State;
var Transition = require('../../lib').Transition;
var Interpolation = require('../../lib/transition/interpolation').Interpolation;

describe('Manager', function() {
	describe('#push', function() {
		var shared = new Manager();

		it('should push a new state given its name', function() {
			shared.push('test');
			shared._states.should.have.deep.property('test.state').be.instanceof(State);
			shared._states.test.flag = 42;
		});

		it('should not override an existing state', function() {
			shared.push('test');
			shared._states.test.should.have.property('flag', 42);
		});

		it('should push a state given a name and its instance', function() {
			var manager = new Manager();
			var state = new State();
			manager.push('test', state);
			manager._states.test.state.should.be.eql(state);
		});

		it('should push a new state given its name and a transition name', function() {
			var manager = new Manager();
			manager.push('test', 'interpolation');
			manager._states.should.have.deep.property('test.state').be.instanceof(State);
			manager._states.test.trans.should.be.instanceof(Transition);
		});

		it('should push a new state given its name and a transition description', function() {
			var manager = new Manager();
			manager.push('test', 'interpolation', { from: 42, to: 1337, duration: 666 });
			manager._states.test.trans.should.be.instanceof(Transition);
			manager._states.test.trans.should.have.property('from', 42);
			manager._states.test.trans.should.have.property('to', 1337);
			manager._states.test.trans.should.have.property('duration', 666);
		});

		it('should push a new state given its name and a transition instance', function() {
			var manager = new Manager();
			var interpolation = new Interpolation({ to: 42 });
			manager.push('test', interpolation);
			manager._states.test.trans.should.have.property('from', 0);
		});

		it('should push a new state without transition given its name and a invalid transition name', function() {
			var manager = new Manager();
			manager.push('test', 'wombat');
			manager._states.test.should.have.property('trans', undefined);
		});

		it('should push a new parent and then a child state given a state compouned name', function() {
			var manager = new Manager();
			manager.push('parent:child');
			manager._states.should.have.deep.property('parent.state').be.instanceof(State);
			manager._states.should.have.deep.property('parent:child.state').be.instanceof(State);
			manager._states.should.have.deep.property('parent:child.parent').eql(manager._states.parent);
		});

		it('should push as many childs as specified', function() {
			var manager = new Manager();
			manager.push('I:am:a:deep:hierarchy');
			manager._states.should.have.deep.property('I.state');
			manager._states.should.have.deep.property('I:am.state');
			manager._states.should.have.deep.property('I:am.parent').eql(manager._states['I']);
			manager._states.should.have.deep.property('I:am:a.state');
			manager._states.should.have.deep.property('I:am:a.parent').eql(manager._states['I:am']);
			manager._states.should.have.deep.property('I:am:a:deep.state');
			manager._states.should.have.deep.property('I:am:a:deep.parent').eql(manager._states['I:am:a']);
			manager._states.should.have.deep.property('I:am:a:deep:hierarchy.state');
			manager._states.should.have.deep.property('I:am:a:deep:hierarchy.parent').eql(manager._states['I:am:a:deep']);
		});

		it('should push a child of an existing state', function() {
			shared.push('test:child');
			shared._states.should.have.deep.property('test:child');
			shared._states.should.have.deep.property('test:child.parent').eql(shared._states.test);
		});

		it('should inherit parent transition', function() {
			var manager = new Manager();
			var interpolation = new Interpolation();
			manager.push('parent:child', interpolation);
			manager._states.should.have.deep.property('parent.trans', interpolation);
			manager._states.should.have.deep.property('parent:child.trans', interpolation);
		});

		it('should do nothing given no params', function() {
			shared.push();
			shared._states.should.not.have.keys('undefined');
		});
	});

	describe('#change', function() {
		var shared = new Manager();

		it('should change to the given state', function(done) {
			shared.push('test');
			shared.change('test', function() {
				shared._current.name.should.equal('test');
				shared._states.test.should.have.property('active', true);
				done();
			});
		});

		it('should change to the given new state', function(done) {
			shared.push('vadrouille');
			shared.change('vadrouille', function() {
				shared._current.name.should.equal('vadrouille');
				shared._states.vadrouille.should.have.property('active', true);
				shared._states.test.should.have.property('active', false);
				done();
			});
		});

		it('should change to a child state, activating parents', function(done) {
			shared.push('test:child:of');
			shared.change('test:child:of', function() {
				shared._current.name.should.equal('test:child:of');
				shared._states.test.should.have.property('active', true);
				shared._states['test:child'].should.have.property('active', true);
				shared._states['test:child:of'].should.have.property('active', true);
				done();
			});
		});

		it('should change to a other hierarchy, setting active state correctly', function(done) {
			shared.push('love:loopjs');
			shared.change('love:loopjs', function() {
				shared._current.name.should.equal('love:loopjs');
				shared._states.love.should.have.property('active', true);
				shared._states['love:loopjs'].should.have.property('active', true);
				shared._states.test.should.have.property('active', false);
				shared._states['test:child'].should.have.property('active', false);
				shared._states['test:child:of'].should.have.property('active', false);
				done();
			});
		});

		it('should change to an other child, setting active state correctly', function(done) {
			shared.push('love:sarah:brian');
			shared._states.love.should.have.property('active', true);
			shared.change('love:sarah:brian', function() {
				shared._current.name.should.equal('love:sarah:brian');
				shared._states.love.should.have.property('active', true);
				shared._states['love:sarah'].should.have.property('active', true);
				shared._states['love:sarah:brian'].should.have.property('active', true);
				shared._states['love:loopjs'].should.have.property('active', false);
				done();
			});
		});

		it('should change back to parent, setting active state correctly', function(done) {
			var manager = new Manager();
			manager.push('parent:child:of:mine');
			manager.change('parent:child:of:mine');
			manager.change('parent', function() {
				manager._current.name.should.equal('parent');
				manager._states.parent.should.have.property('active', true);
				manager._states['parent:child'].should.have.property('active', false);
				manager._states['parent:child:of'].should.have.property('active', false);
				manager._states['parent:child:of:mine'].should.have.property('active', false);
				done();
			});
		});

		it('should call enter/exit events when changing states', function(done) {
			var count = 0;
			var cb = function() { count++; if (count == 2) done(); };
			var manager = new Manager();
			manager.push('test');
			manager.push('test2');
			manager._states.test.state.exit = cb;
			manager._states.test2.state.enter = cb;
			manager.change('test');
			manager.change('test2');
		});

		it('should call init event when it is the first time the state is entered', function(done) {
			var manager = new Manager();
			manager.push('test');
			manager._states.test.state.init = function() {
				manager._states.test.init.should.be.true;
				done();
			};
			manager.change('test');
		});

		it('should call focus/blur event when changing states', function(done) {
			var count = 0;
			var cb = function() { count++; if (count == 2) done(); };
			var manager = new Manager();
			manager.push('test');
			manager.push('test2');
			manager._states.test.state.blur = cb;
			manager._states.test2.state.focus = cb;
			manager.change('test');
			manager.change('test2');
		});

		it('should call focus/blur correctly when switching states of the same hierarchy', function(done) {
			var gameFocus = 0;
			var gameBlur = 0;
			var menuFocus = 0;
			var menuBlur = 0;
			var cb = function() {
				if (2 == gameFocus && 1 == gameBlur && 1 == menuFocus && 1 == menuBlur) done();
			};
			var manager = new Manager();
			manager.push('game:menu');
			manager._states.game.state.focus = function() { gameFocus++; cb(); };
			manager._states.game.state.blur = function() { gameBlur++; cb(); };
			manager._states['game:menu'].state.focus = function() { menuFocus++; cb(); };
			manager._states['game:menu'].state.blur = function() { menuBlur++; cb(); };
			manager.change('game');
			manager.change('game:menu');
			manager.change('game');
		});
	});

	describe('#fire', function() {
		it('should fire current state event given a event name', function(done) {
			var manager = new Manager();
			var state = new State();
			state.pause = function() { done() };
			manager.push('test', state);
			manager.change('test');
			manager.fire('pause');
		});

		it('should do nothing when there is no current state', function() {
			var manager = new Manager();
			manager.push('test');
			manager.fire('init');
		});

		it('should fire current state with itself as context', function(done) {
			var manager = new Manager();
			var state = new State();
			state.pause = function() {
				this.should.eql(state);
				done();
			};
			manager.push('test', state);
			manager.change('test');
			manager.fire('pause');
		});

		it('should do nothing when the event is unknown', function() {
			var manager = new Manager();
			manager.push('test');
			manager.fire('42');
		});
	});
});
