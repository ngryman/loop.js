var chai = chai || require('chai');
global.window = undefined == typeof window ? window : global;

var should = chai.should();

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

		it('should accept a custom tweening function', function() {
			var tween = new Tween(tweenable, 'opacity', 0, 1, 400, function() {});
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
			tweenable.opacity.should.eql(1);
			tweenable.volume.should.eql(1);
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
			tweenable.opacity.should.eql(2);
			tweenable.volume.should.eql(2);
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
			tweenable.opacity.should.eql(0);
			tweenable.volume.should.eql(0);
		});

		it('should return false when it has reach the end', function() {
			var tween = new Tween(tweenable, 'opacity volume', 0, 1, 400, 'linear');
			tween.start();
			tween.tick({ delta: 400 }).should.be.false;
			tween.tick({ delta: 100 }).should.be.false;
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

		it('should return false at the first call if duration is 0', function() {
			var tween = new Tween(tweenable, 'opacity', 0, 1, 0, 'linear');
			tween.start();
			tween.tick({ delta: 50 }).should.be.false;
		});

		it('should set properties to to value', function() {
			var tween = new Tween(tweenable, 'opacity volume', 0, 1337, 400, 'linear');
			tween.start();
			tween.tick({ delta: 500 });
			tweenable.opacity.should.eql(1337);
			tweenable.volume.should.eql(1337);
		});

		it('should return false when tween has reach the end', function() {
			var tween = new Tween(tweenable, 'opacity volume', 0, 1, 400, 'linear');
			tween.start();
			tween.tick({ delta: 400 }).should.be.false;
			tween.tick({ delta: 100 }).should.be.false;
		});

		it('should use the custom tweening function if provided', function() {
			var tween = new Tween(tweenable, 'opacity', 0, 42, 400, function(t, b, c, d) {
				t.should.eql(tween._cur);
				b.should.eql(tween.from);
				c.should.eql(tween.to - tween.from);
				d.should.eql(tween.duration);
				return t;
			});
			tween.start();
			tween.tick({ delta: 123 });
			tween.value.should.eql(123);
		});
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
			machine.push('test', 'linear', { duration: 25 });
			machine.get('test').transition = function(value) {
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
			machine.get('test').transition = function(value) {
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
var chai = chai || require('chai');
global.window = undefined == typeof window ? window : global;

var should = chai.should();

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

		it('should pass the event name as argument', function(done) {
			var app = new Application();
			app.when('enter exit', 'test', function(event) {
				event.should.eql('enter');
				done();
			});
			app.change('test');
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
