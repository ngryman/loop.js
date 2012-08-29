(require 'chai').should()
global.window = global
# TODO: simulate browser env here

{Machine, State, Transition} = require '../../lib'
{Interpolation} = require '../../lib/transition/interpolation'

describe 'Machine', ->
  describe '#push', ->
    shared = new Machine

    it 'should push a new state given its name', ->
      shared.push 'test'
      shared._states.should.have.deep.property('test.state').be.instanceof(State)
      shared._states.test.flag = 42

    it 'should not override an existing state', ->
      shared.push 'test'
      shared._states.test.should.have.property('flag', 42)

    it 'should push a state given a name and its instance', ->
      machine = new Machine
      state = new State
      machine.push 'test', state
      machine._states.test.state.should.be.eql state

    it 'should push a new state given its name and a transition name', ->
      machine = new Machine
      machine.push 'test', 'interpolation'
      machine._states.should.have.deep.property('test.state').be.instanceof(State)
      machine._states.test.trans.should.be.instanceof Transition

    it 'should push a new state given its name and a transition description', ->
      machine = new Machine
      machine.push 'test', 'interpolation', from: 42, to: 1337, duration: 666
      machine._states.test.trans.should.be.instanceof Transition
      machine._states.test.trans.should.have.property 'from', 42
      machine._states.test.trans.should.have.property 'to', 1337
      machine._states.test.trans.should.have.property 'duration', 666

    it 'should push a new state given its name and a transition instance', ->
      machine = new Machine
      interpolation = new Interpolation to: 42
      machine.push 'test', interpolation
      machine._states.test.trans.should.have.property 'from', 0

    it 'should push a new state without transition given its name and a invalid transition name', ->
      machine = new Machine
      machine.push 'test', 'wombat'
      machine._states.test.should.have.property 'trans', undefined

    it 'should push a new parent and then a child state given a state compouned name', ->
      machine = new Machine
      machine.push 'parent:child'
      machine._states.should.have.deep.property('parent.state').be.instanceof(State)
      machine._states.should.have.deep.property('parent:child.state').be.instanceof(State)
      machine._states.should.have.deep.property('parent:child.parent').eql(machine._states.parent)

    it 'should push as many childs as specified', ->
      machine = new Machine
      machine.push 'I:am:a:deep:hierarchy'
      machine._states.should.have.deep.property('I.state')
      machine._states.should.have.deep.property('I:am.state')
      machine._states.should.have.deep.property('I:am.parent').eql(machine._states['I'])
      machine._states.should.have.deep.property('I:am:a.state')
      machine._states.should.have.deep.property('I:am:a.parent').eql(machine._states['I:am'])
      machine._states.should.have.deep.property('I:am:a:deep.state')
      machine._states.should.have.deep.property('I:am:a:deep.parent').eql(machine._states['I:am:a'])
      machine._states.should.have.deep.property('I:am:a:deep:hierarchy.state')
      machine._states.should.have.deep.property('I:am:a:deep:hierarchy.parent').eql(machine._states['I:am:a:deep'])

    it 'should push a child of an existing state', ->
      shared.push 'test:child'
      shared._states.should.have.deep.property('test:child')
      shared._states.should.have.deep.property('test:child.parent').eql(shared._states.test)

    it 'should inherit parent transition', ->
      machine = new Machine
      interpolation = new Interpolation
      machine.push 'parent:child', interpolation
      machine._states.should.have.deep.property('parent.trans', interpolation)
      machine._states.should.have.deep.property('parent:child.trans', interpolation)

    it 'should do nothing given no params', ->
      shared.push()
      shared._states.should.not.have.keys 'undefined'

  describe '#change', ->
    shared = new Machine

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

    it 'should change back to parent, setting active state correctly', (done) ->
      machine = new Machine
      machine.push 'parent:child:of:mine'
      machine.change 'parent:child:of:mine'
      machine.change 'parent', ->
        machine._current.name.should.equal 'parent'
        machine._states.parent.should.have.property 'active', true
        machine._states['parent:child'].should.have.property 'active', false
        machine._states['parent:child:of'].should.have.property 'active', false
        machine._states['parent:child:of:mine'].should.have.property 'active', false
        done()

    it 'should call enter/exit events when changing states', (done) ->
      count = 0
      cb = -> count++; done() if count == 2
      machine = new Machine
      machine.push 'test'
      machine.push 'test2'
      machine._states.test.state.exit = cb
      machine._states.test2.state.enter = cb
      machine.change 'test'
      machine.change 'test2'

    it 'should call init event when it is the first time the state is entered', (done) ->
      machine = new Machine
      machine.push 'test'
      machine._states.test.state.init = ->
        machine._states.test.init.should.be.true
        done()
      machine.change 'test'

    it 'should call focus/blur event when changing states', (done) ->
      count = 0
      cb = -> count++; done() if count == 2
      machine = new Machine
      machine.push 'test'
      machine.push 'test2'
      machine._states.test.state.blur = cb
      machine._states.test2.state.focus = cb
      machine.change 'test'
      machine.change 'test2'

    it 'should call focus/blur correctly when switching states of the same hierarchy', (done) ->
      gameFocus = 0
      gameBlur = 0
      menuFocus = 0
      menuBlur = 0
      cb = ->
        done() if 2 == gameFocus and 1 == gameBlur and 1 == menuFocus and 1 == menuBlur
      machine = new Machine
      machine.push 'game:menu'
      machine._states.game.state.focus = -> gameFocus++; cb()
      machine._states.game.state.blur = -> gameBlur++; cb()
      machine._states['game:menu'].state.focus = -> menuFocus++; cb()
      machine._states['game:menu'].state.blur = -> menuBlur++; cb()
      machine.change 'game'
      machine.change 'game:menu'
      machine.change 'game'

  describe '#fire', ->
    it 'should fire current state event given a event name', (done) ->
      machine = new Machine
      state = new State
      state.pause = -> done()
      machine.push 'test', state
      machine.change 'test'
      machine.fire 'pause'

    it 'should do nothing when there is no current state', ->
      machine = new Machine
      machine.push 'test'
      machine.fire 'init'

    it 'should fire current state with itself as context', (done) ->
      machine = new Machine
      state = new State
      state.pause = ->
        @.should.eql state
        done()
      machine.push 'test', state
      machine.change 'test'
      machine.fire 'pause'

    it 'should do nothing when the event is unknown', ->
      machine = new Machine
      machine.push 'test'
      machine.fire '42'
