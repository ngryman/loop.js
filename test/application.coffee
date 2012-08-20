(require 'chai').should()
global.window = global
# TODO: simulate browser env here

{Application, State} = require '../src'

describe 'Application', ->
  shared = new Application

  describe '#when', ->
    it 'should only create the backed state given event and state names', ->
      app = new Application
      app.when 'init', 'test'
      app._states.should
        .have.deep.property('test.state').be.instanceof(State)
      app._states.test.state.should
        .have.deep.property('init', State::init)

    it 'should only create the backed state given multiple events name and a state name', ->
      app = new Application
      app.when 'init cleanup', 'test'
      app._states.should
        .have.deep.property('test.state')
        .be.instanceof(State)
      app._states.test.state.should
        .have.deep.property('init', State::init)
      app._states.test.state.should
        .have.deep.property('cleanup', State::cleanup)

    it 'should override with the given delegate given event and state names', ->
      app = new Application
      delegate = -> "hi, I'm Mister delegate"
      app.when 'init', 'test', delegate
      app._states.should
        .have.deep.property('test.state')
        .be.instanceof(State)
      app._states.test.state.should
        .have.deep.property('init', delegate)

    it 'should override with the given delegate given multiple events name and a state name', ->
      delegate = -> "hi, I'm Mister delegate"
      shared.when 'init cleanup', 'test', delegate
      shared._states.should
        .have.deep.property('test.state')
        .be.instanceof(State)
      shared._states.test.state.should
        .have.deep.property('init', delegate)
      shared._states.test.state.should
        .have.deep.property('cleanup', delegate)

    it 'should override when redefining existing events for the same state', ->
      delegate = -> "hi, I'm Miss delegatess"
      shared.when 'init cleanup', 'test', delegate
      shared._states.test.state.should
        .have.deep.property('init', delegate)
      shared._states.test.state.should
        .have.deep.property('cleanup', delegate)

  describe '#loop', ->
    it 'should launch the game loop and do nothing when there is not a current state', (done) ->
      app = new Application
      app.loop()
      setTimeout ->
        app.abort()
        done()
      , 50

    it 'should launch the game loop using the first registered state and invoking its tick event', (done) ->
      app = new Application
      app
        .tick 'test', ->
          app.abort()
          done()
        .loop()

    it 'should pass time informations to a tick event', (done) ->
      app = new Application
      app
        .tick 'test', (time) ->
          app.abort()
          time.should.not.be.undefined
          time.should.have.property 'now'
          time.should.have.property 'delta'
          time.should.have.property 'frame'
          done()
        .loop()

    it 'should pass valid time informations at the first frame', (done) ->
      app = new Application
      now = Date.now()
      app
        .tick 'test', (time) ->
          app.abort()
          time.should.have.property('now').within(now - 100, now + 100)
          time.should.have.property 'delta', 0
          time.should.have.property 'frame', 0
          done()
        .loop()

    it 'should increment frames', (done) ->
      @timeout = 500
      app = new Application
      app
        .tick 'test', (time) ->
          if 3 == time.frame
            app.abort()
            done()
        .loop()
