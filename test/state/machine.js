var chai = chai || require('chai');
global.window = undefined == typeof window ? window : global;

var should = chai.should();

var Machine = require('../../lib').Machine;
var State = require('../../lib').State;
var Transition = require('../../lib').Transition;
var Ease = require('../../lib').Ease;

describe('Machine', function() {
	describe('#push', function() {
		var shared = new Machine();

		it('should push a new state given its name', function() {
			shared.push('test');
			shared._states.should.have.deep.property('test.state').be.instanceof(State);
			shared._states.test.flag = 42;
		});

		it('should not override an existing state', function() {
			shared.push('test');
			shared._states.test.should.have.property('flag', 42);
		});

		// TEMP: disabled feature for now
//		xit('should push a state given a name and its instance', function() {
//			var machine = new Machine();
//			var state = new State();
//			machine.push('test', state);
//			machine._states.test.state.should.be.eql(state);
//		});

		it('should push a new state given its name and a transition name', function() {
			var machine = new Machine();
			machine.push('test', 'linear');
			machine._states.should.have.deep.property('test.state').be.instanceof(State);
			machine._states.test.trans.should.be.instanceof(Transition);
			machine._states.test.trans.should.have.property('easing', Ease.linear);
		});

		it('should push a new state given its name and a transition description', function() {
			var machine = new Machine();
			machine.push('test', { from: 42, to: 1337, duration: 666 });
			machine._states.test.trans.should.be.instanceof(Transition);
			machine._states.test.trans.should.have.property('from', 42);
			machine._states.test.trans.should.have.property('to', 1337);
			machine._states.test.trans.should.have.property('duration', 666);
		});

		// TEMP: disabled feature for now
//		xit('should push a new state given its name and a transition instance', function() {
//			var machine = new Machine();
//			var transition = new Transition({ to: 42 });
//			machine.push('test', transition);
//			machine._states.test.trans.should.have.property('to', 42);
//		});

		it('should push a new parent and then a child state given a state compound name', function() {
			var machine = new Machine();
			machine.push('parent:child');
			machine._states.should.have.deep.property('parent.state').be.instanceof(State);
			machine._states.should.have.deep.property('parent:child.state').be.instanceof(State);
			machine._states.should.have.deep.property('parent:child.parent').eql(machine._states.parent);
		});

		it('should push as many children as specified', function() {
			var machine = new Machine();
			machine.push('I:am:a:deep:hierarchy');
			machine._states.should.have.deep.property('I.state');
			machine._states.should.have.deep.property('I:am.state');
			machine._states.should.have.deep.property('I:am.parent').eql(machine._states['I']);
			machine._states.should.have.deep.property('I:am:a.state');
			machine._states.should.have.deep.property('I:am:a.parent').eql(machine._states['I:am']);
			machine._states.should.have.deep.property('I:am:a:deep.state');
			machine._states.should.have.deep.property('I:am:a:deep.parent').eql(machine._states['I:am:a']);
			machine._states.should.have.deep.property('I:am:a:deep:hierarchy.state');
			machine._states.should.have.deep.property('I:am:a:deep:hierarchy.parent').eql(machine._states['I:am:a:deep']);
		});

		it('should push a child of an existing state', function() {
			shared.push('test:child');
			shared._states.should.have.deep.property('test:child');
			shared._states.should.have.deep.property('test:child.parent').eql(shared._states.test);
		});

		// TEMP: disabled feature for now
//        xit('should copy parent transition', function() {
//            var machine = new Machine();
//            var transition = new Transition({ from: 1337 });
//            machine.push('parent:child', transition);
//            machine._states.should.have.deep.property('parent.trans.from', 1337);
//            machine._states.should.have.deep.property('parent:child.trans.from', 1337);
//        });

		it('should copy parent transition', function() {
			var machine = new Machine();
			machine.push('parent:child', { from: 1337 });
			machine._states.should.have.deep.property('parent.trans.from', 1337);
			machine._states.should.have.deep.property('parent:child.trans.from', 1337);
		});

		it('should do nothing given no params', function() {
			shared.push();
			shared._states.should.not.have.keys('undefined');
		});
	});

	describe('#get', function() {
		it('should get an existing state', function() {
			var machine = new Machine();
			machine.push('test');
			var state = machine.get('test');
			state.should.be.instanceof(State);
		});

		it('should get undefined for a non-existing state', function() {
			var machine = new Machine();
			machine.push('test');
			var state = machine.get('void');
			should.not.exist(state);
		});
	});

	describe('#change', function() {
		var shared = new Machine();

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
				shared._states['vadrouille'].should.have.property('active', true);
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
				shared._states['love'].should.have.property('active', true);
				shared._states['love:loopjs'].should.have.property('active', true);
				shared._states.test.should.have.property('active', false);
				shared._states['test:child'].should.have.property('active', false);
				shared._states['test:child:of'].should.have.property('active', false);
				done();
			});
		});

		it('should change to an other child, setting active state correctly', function(done) {
			shared.push('love:sarah:brian');
			shared._states['love'].should.have.property('active', true);
			shared.change('love:sarah:brian', function() {
				shared._current.name.should.equal('love:sarah:brian');
				shared._states['love'].should.have.property('active', true);
				shared._states['love:sarah'].should.have.property('active', true);
				shared._states['love:sarah:brian'].should.have.property('active', true);
				shared._states['love:loopjs'].should.have.property('active', false);
				done();
			});
		});

		it('should change back to parent, setting active state correctly', function(done) {
			var machine = new Machine();
			machine.push('parent:child:of:mine');
			machine.change('parent:child:of:mine', function() {
				machine.change('parent', function() {
					machine._current.name.should.equal('parent');
					machine._states.parent.should.have.property('active', true);
					machine._states['parent:child'].should.have.property('active', false);
					machine._states['parent:child:of'].should.have.property('active', false);
					machine._states['parent:child:of:mine'].should.have.property('active', false);
					done();
				});
			});
		});

		it('should call enter/exit events when changing states', function(done) {
			var count = 0;
			var cb = function(event) {
				count++;
				if (count == 1) {
					event.should.eql('exit');
				}
				if (count == 2) {
					event.should.eql('enter');
					done();
				}
			};
			var machine = new Machine();
			machine.push('test');
			machine.push('test2');
			machine._states['test'].state.exit = cb;
			machine._states['test2'].state.enter = cb;
			machine.change('test', function() {
				machine.change('test2');
			});
		});

		it('should call init event when it is the first time the state is entered', function(done) {
			var machine = new Machine();
			machine.push('test');
			machine._states.test.state.init = function() {
				machine._states.test.init.should.be.true;
				done();
			};
			machine.change('test');
		});

		it('should call focus/blur event when changing states', function(done) {
			var count = 0;
			var cb = function(event) {
				count++;
				if (count == 1) {
					event.should.eql('blur');
				}
				if (count == 2) {
					event.should.eql('focus');
					done();
				}
			};
			var machine = new Machine();
			machine.push('test');
			machine.push('test2');
			machine._states['test'].state.blur = cb;
			machine._states['test2'].state.focus = cb;
			machine.change('test', function() {
				machine.change('test2');
			});
		});

		it('should call focus/blur correctly when switching states of the same hierarchy', function(done) {
			var gameFocus = 0;
			var gameBlur = 0;
			var menuFocus = 0;
			var menuBlur = 0;
			var cb = function() {
				if (2 == gameFocus && 1 == gameBlur && 1 == menuFocus && 1 == menuBlur) done();
			};
			var machine = new Machine();
			machine.push('game:menu');
			machine._states['game'].state.focus = function() {
				gameFocus++;
				cb();
			};
			machine._states['game'].state.blur = function() {
				gameBlur++;
				cb();
			};
			machine._states['game:menu'].state.focus = function() {
				menuFocus++;
				cb();
			};
			machine._states['game:menu'].state.blur = function() {
				menuBlur++;
				cb();
			};
			machine.change('game', function() {
				machine.change('game:menu', function() {
					machine.change('game');
				});
			});
		});

		it('should call enter/exit and focus/blur in the correct order', function(done) {
			var expectOrder = 'state1#enter state1#focus state1#blur state1#exit state2#enter state2#focus ';
			var order = '';
			var state1 = new State();
			state1.enter = function() { order += 'state1#enter ' };
			state1.exit = function() { order += 'state1#exit ' };
			state1.focus = function() { order += 'state1#focus ' };
			state1.blur = function() { order += 'state1#blur ' };
			var state2 = new State();
			state2.enter = function() { order += 'state2#enter ' };
			state2.exit = function() { order += 'state2#exit ' };
			state2.focus = function() { order += 'state2#focus ' };
			state2.blur = function() { order += 'state2#blur ' };
			var machine = new Machine();
			machine.push('state1', state1);
			machine.push('state2', state2);
			machine.change('state1', function() {
				machine.change('state2', function() {
					order.should.eql(expectOrder);
					done();
				});
			});
		});

		it('should not call exit/enter when a child give the focus to its parent', function(done) {
			var expectOrder = 'parent#enter parent:child#enter parent:child#focus parent:child#blur parent:child#exit parent#focus ';
			var order = '';
			var parent = new State();
			parent.enter = function() { order += 'parent#enter ' };
			parent.exit = function() { order += 'parent#exit ' };
			parent.focus = function() { order += 'parent#focus ' };
			parent.blur = function() { order += 'parent#blur ' };
			var child = new State();
			child.enter = function() { order += 'parent:child#enter ' };
			child.exit = function() { order += 'parent:child#exit ' };
			child.focus = function() { order += 'parent:child#focus ' };
			child.blur = function() { order += 'parent:child#blur ' };
			var machine = new Machine();
			machine.push('parent', parent);
			machine.push('parent:child', child);
			machine.change('parent:child', function() {
				machine.change('parent', function() {
					order.should.eql(expectOrder);
					done();
				});
			});
		});

		it('should do nothing when changing to an already active state', function(done) {
			var blur = 0;
			var focus = 0;
			var machine = new Machine();
			machine.push('test');
			machine.get('test').blur = function() {
				blur++;
			};
			machine.get('test').focus = function() {
				focus++;
			};
			machine.change('test', function() {
				machine.change('test', function() {
					blur.should.eql(0);
					focus.should.eql(1);
					done();
				});
			});
		});

		it('should apply a transition when changing', function(done) {
			var machine = new Machine();
			var called = 0;
			machine.push('test', { duration: 25 });
			machine.get('test').transition = function(event, value) {
				if (0 == called) value.should.eql(0);
				called++;
			};
			machine.change('test', function() {
				called.should.be.gt(0);
				done();
			});
		});

		it('should reverse transition correctly when changing multiple times', function(done) {
			var machine = new Machine();
			var values = [], changeNb = 0;
			machine.push('test', { duration: 25 });
			machine.push('test2');
			machine.get('test').transition = function(event, value) {
				if (undefined === values[changeNb]) values[changeNb] = value;
			};
			machine.change('test', function() {
				changeNb++;
				machine.change('test2', function() {
					changeNb++;
					machine.change('test', function() {
						changeNb++;
						machine.change('test2', function() {
							changeNb++;
							machine.change('test', function() {
								changeNb++;
								machine.change('test2', function() {
									values[0].should.eql(0);
									values[1].should.eql(1);
									values[2].should.eql(0);
									values[3].should.eql(1);
									done();
								});
							});
						});
					});
				});
			});
		});

		it('should call the callback with the new active state as context', function() {
			var machine = new Machine();
			var state = new State();
			machine.push('test', state);
			machine.change('test', function() {
				this.should.be.eql(state);
			});
		});
	});

	describe('should fire', function() {
		it('state event given a event name', function(done) {
			var machine = new Machine();
			var state = new State();
			state.pause = function() { done() };
			machine.push('test', state);
			machine.change('test', function() {
				machine._fire(this, 'pause');
			});
		});

		it('should fire current state with itself as context', function(done) {
			var machine = new Machine();
			var state = new State();
			state.pause = function() {
				this.should.eql(state);
				done();
			};
			machine.push('test', state);
			machine.change('test', function() {
				machine._fire(this, 'pause');
			});
		});
	});
});
