(require 'chai').should()
global.window = global
# TODO: simulate browser env here

{Manager, State, Transition} = require '../../src'
{Interpolation} = require '../../src/transition/interpolation'

describe 'Manager', ->
  describe '#push', ->
    shared = new Manager

    it 'should push a new state given its name', ->
      shared.push 'test'
      shared._states.should.have.deep.property('test.state').be.instanceof(State)
      shared._states.test.flag = 42

    it 'should not override an existing state', ->
      shared.push 'test'
      shared._states.test.should.have.property('flag', 42)

    it 'should push a state given a name and its instance', ->
      manager = new Manager
      state = new State
      manager.push 'test', state
      manager._states.test.state.should.be.eql state

    it 'should push a new state given its name and a transition name', ->
      manager = new Manager
      manager.push 'test', 'interpolation'
      manager._states.should.have.deep.property('test.state').be.instanceof(State)
      manager._states.test.trans.should.be.instanceof Transition

    it 'should push a new state given its name and a transition description', ->
      manager = new Manager
      manager.push 'test', 'interpolation', from: 42, to: 1337, duration: 666
      manager._states.test.trans.should.be.instanceof Transition
      manager._states.test.trans.should.have.property 'from', 42
      manager._states.test.trans.should.have.property 'to', 1337
      manager._states.test.trans.should.have.property 'duration', 666

    it 'should push a new state given its name and a transition instance', ->
      manager = new Manager
      interpolation = new Interpolation to: 42
      manager.push 'test', interpolation
      manager._states.test.trans.should.have.property 'from', 0

    it 'should push a new state without transition given its name and a invalid transition name', ->
      manager = new Manager
      manager.push 'test', 'wombat'
      manager._states.test.should.have.property 'trans', undefined

    it 'should push a new parent and then a child state given a state compouned name', ->
      manager = new Manager
      manager.push 'parent:child'
      manager._states.should.have.deep.property('parent.state').be.instanceof(State)
      manager._states.should.have.deep.property('parent:child.state').be.instanceof(State)
      manager._states.should.have.deep.property('parent:child.parent').eql(manager._states.parent)

    it 'should push as many childs as specified', ->
      manager = new Manager
      manager.push 'I:am:a:deep:hierarchy'
      manager._states.should.have.deep.property('I.state')
      manager._states.should.have.deep.property('I:am.state')
      manager._states.should.have.deep.property('I:am.parent').eql(manager._states['I'])
      manager._states.should.have.deep.property('I:am:a.state')
      manager._states.should.have.deep.property('I:am:a.parent').eql(manager._states['I:am'])
      manager._states.should.have.deep.property('I:am:a:deep.state')
      manager._states.should.have.deep.property('I:am:a:deep.parent').eql(manager._states['I:am:a'])
      manager._states.should.have.deep.property('I:am:a:deep:hierarchy.state')
      manager._states.should.have.deep.property('I:am:a:deep:hierarchy.parent').eql(manager._states['I:am:a:deep'])

    it 'should push a child of an existing state', ->
      shared.push 'test:child'
      shared._states.should.have.deep.property('test:child')
      shared._states.should.have.deep.property('test:child.parent').eql(shared._states.test)

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
    shared = new Manager

    it 'should change to the given state', (done) ->
      shared.push 'test'
      shared.change 'test', ->
        shared._current.name.should.equal 'test'
        shared._states.test.should.have.property 'active', true
        done()

    it 'should change to the given new state', (done) ->
      shared.push 'vadrouille'
      shared.change 'vadrouille', ->
        shared._current.name.should.equal 'vadrouille'
        shared._states.vadrouille.should.have.property 'active', true
        shared._states.test.should.have.property 'active', false
        done()

    it 'should change to a child state, activating parents', (done) ->
      shared.push 'test:child:of'
      shared.change 'test:child:of', ->
        shared._current.name.should.equal 'test:child:of'
        shared._states.test.should.have.property 'active', true
        shared._states['test:child'].should.have.property 'active', true
        shared._states['test:child:of'].should.have.property 'active', true
        done()

    it 'should change to a other hierarchy, setting active state correctly', (done) ->
      shared.push 'love:loopjs'
      shared.change 'love:loopjs', ->
        shared._current.name.should.equal 'love:loopjs'
        shared._states.love.should.have.property 'active', true
        shared._states['love:loopjs'].should.have.property 'active', true
        shared._states.test.should.have.property 'active', false
        shared._states['test:child'].should.have.property 'active', false
        shared._states['test:child:of'].should.have.property 'active', false
        done()

    it 'should change to an other child, setting active state correctly', (done) ->
      shared.push 'love:sarah:brian'
      shared._states.love.should.have.property 'active', true
      shared.change 'love:sarah:brian', ->
        shared._current.name.should.equal 'love:sarah:brian'
        shared._states.love.should.have.property 'active', true
        shared._states['love:sarah'].should.have.property 'active', true
        shared._states['love:sarah:brian'].should.have.property 'active', true
        shared._states['love:loopjs'].should.have.property 'active', false
        done()

    xit 'should call init event when the first time', (done) ->
      manager = new Manager
      manager.push 'test'
      manager._states.test.state.init = ->
        console.log manager._states.test
        manager._states.test.init.should.be.true
        done()
      manager.change 'test'

  describe '#fire', ->
    it 'should fire current state event given a event name', (done) ->
      manager = new Manager
      state = new State
      state.enter = -> done()
      manager.push 'test', state
      manager.change 'test'
      manager.fire 'enter'

    it 'should do nothing when there is no current state', ->
      manager = new Manager
      manager.push 'test'
      manager.fire 'init'

    it 'should fire current state with itself as context', (done) ->
      manager = new Manager
      state = new State
      state.enter = ->
        @.should.eql state
        done()
      manager.push 'test', state
      manager.change 'test'
      manager.fire 'enter'

    it 'should do nothing when the event is unknown', ->
      manager = new Manager
      manager.push 'test'
      manager.fire '42'
