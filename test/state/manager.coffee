(require 'chai').should()
global.window = global
# TODO: simulate browser env here

{Manager, State, Transition} = require '../../src'
{Interpolation} = require '../../src/transition/interpolation'

describe 'Manager', ->
  shared = new Manager
  testState = null;

  describe '#push', ->
    it 'should push a new state given a state name', ->
      shared.push 'test'
      shared._states.should.have.deep.property('test.state').be.instanceof(State)
      testState = shared._states.test.state

    it 'should not push a new state given an already existing name', ->
      shared.push 'test'
      testState.should.deep.equal shared._states.test.state

    it 'should push an existing state given a state name and its instance', ->
      manager = new Manager
      state = new State
      manager.push 'test', state
      manager._states.test.state.should.be.eql state

    it 'should push a new state given a state name and a transition name', ->
      manager = new Manager
      manager.push 'test', 'interpolation'
      manager._states.should.have.deep.property('test.state').be.instanceof(State)
      manager._states.test.trans.should.be.instanceof Transition

    it 'should push a new state given a state name and a transition description', ->
      manager = new Manager
      manager.push 'test', 'interpolation', from: 42, to: 1337, duration: 666
      manager._states.test.trans.should.be.instanceof Transition
      manager._states.test.trans.should.have.property 'from', 42
      manager._states.test.trans.should.have.property 'to', 1337
      manager._states.test.trans.should.have.property 'duration', 666

    it 'should push a new state given a state name and a transition instance', ->
      manager = new Manager
      interpolation = new Interpolation to: 42
      manager.push 'test', interpolation
      manager._states.test.trans.should.have.property 'from', 0

    it 'should push a new state without transition given a state name and a invalid transition name', ->
      manager = new Manager
      manager.push 'test', 'wombat'
      manager._states.test.should.have.property 'trans', undefined

    it 'should push a new parent and then a child state given a state compouned name', ->
      manager = new Manager
      manager.push 'parent:child'
      manager._states.should.have.deep.property('parent.state').be.instanceof(State)
      manager._states.should.have.deep.property('parent:child.state').be.instanceof(State)

    it 'should push a many childs as specified', ->
      manager = new Manager
      manager.push 'I:am:a:deep:hierarchy'
      manager._states.should.have.deep.property("I.state")
      manager._states.should.have.deep.property("I:am.state")
      manager._states.should.have.deep.property("I:am:a.state")
      manager._states.should.have.deep.property("I:am:a:deep.state")
      manager._states.should.have.deep.property("I:am:a:deep:hierarchy.state")

    it 'should inherit parent transition', ->
      manager = new Manager
      interpolation = new Interpolation
      manager.push 'parent:child', interpolation
      manager._states.should.have.deep.property('parent.trans', interpolation)
      manager._states.should.have.deep.property('parent:child.trans', interpolation)

    it 'should do nothing given no params', ->
      shared.push()
      shared._states.should.not.have.keys 'undefined'

  describe '#change', ->
    manager = new Manager

  describe '#fire', ->
    it 'should fire current state event given a event name', (done) ->
      manager = new Manager
      state = new State
      state.init = -> done()
      manager.push 'test', state
      manager.change 'test'
      manager.fire 'init'

    it 'should do nothing when there is no current state', ->
      manager = new Manager
      manager.push 'test'
      manager.fire 'init'

    it 'should fire current state with itself as context', (done) ->
      manager = new Manager
      state = new State
      state.init = ->
        @.should.eql state
        done()
      manager.push 'test', state
      manager.change 'test'
      manager.fire 'init'

    it 'should do nothing when the event is unknown', ->
      manager = new Manager
      manager.push 'test'
      manager.fire '42'
