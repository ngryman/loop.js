async = require 'async'
{State} = require '../state'
{Transition} = require '../transition'

defaults =
  separator: ':'

class Manager
  constructor: (@_options = []) ->
    @_options[k] = @_options[k] ? v for k, v of defaults
    @_states = {}
    @_stack = {}

  # **api**
  # - - - -

  # ## *start*
  #
  #

  start: ->

  # ## *push*
  #
  # **given** a name<br>
  # **and** an optional state<br>
  # **and** an optional transition or its name or a its description<br>
  # **and** optional options for transition<br>
  # **then** pushes the state into the state stack and make it available for use.
  # if a parent was specified but was inexistant, it is created on the fly
  #
  #    `push 'menu'`<br>
  #    `push 'menu', state`<br>
  #    `push 'menu', 'interpolation'`<br>
  #    `push 'menu', new Interpolation`<br>
  #    `push 'menu', state, 'interpolation'`<br>
  #    `push 'menu', state, 'interpolation', duration: 1000`

  push: (name, state, trans...) ->
    return @ if @_states[name]? or not name

    if state not instanceof State
      trans[1] = trans[0]
      trans[0] = state
      state = null

    if trans[0]? and trans[0] not instanceof Transition
      try
        tname = trans[0]
        kname = tname[0].toUpperCase() + tname[1..-1].toLowerCase()
        klass = require("../transition/#{tname}")[kname]
        trans[0] = new klass trans?[1]
      catch err
        trans[0] = null

    names = name.split @_options.separator
    name = names.shift()
    root = name

    # TODO: from child to parent
    # for each state, add to states, link to the previous one child
    # if a state already exist, just link to the previous one child
    parent = @_pushEntry root, null, state, trans[0]
    while names.length
      name = name + @_options.separator + names.shift()
      break if @_states[name]?
      parent = @_pushEntry name, parent, new State, trans[0]

    @_launchEntry = @_launchEntry ? @_states[root]
    @

  # ## *change*
  #
  # **given** a state name<br>
  # **and** a optional callback<br>
  # **then** switch the current state, if it exists, to the new one.<br>
  # if transitions are attached to the states, they are applyied.

  change: (name, callback) ->
#    async.parallel [
#      (cb) => @_enter entry, cb
#      (cb) => @__exit entry, cb
#    ], ->
#      @current = entry.state

    toexit = []
    toenter = []
    tochange = []

    if @_current?
      e = @_current
      while e?
        toexit.push e
        e = e.parent
      toexit.reverse()

    e = @_states[name]
    while e?
      toenter.push e
      e = e.parent
    toenter.reverse()

    if toexit.length > 0
      if toenter.length > toexit.length
        while toenter[0] is toexit[0]
          toenter.shift()
          toexit.shift()
      for e in toexit
        tochange.push do (e) => (cb) => @_exit e, cb

    for e in toenter
      tochange.push do (e) => (cb) => @_enter e, cb

    async.parallel tochange, =>
      @_current?.state.blur()
      @_current = toenter[toenter.length - 1]
      @_current.state.focus()
      callback?()

    @

  # ## *fire*
  #
  #

  fire: (event, args...) ->
    @_current?.state[event]? args...
    @

  # **internal sugar**
  # - - - - - - - - -

  _pushEntry: (name, parent, state, trans) ->
    return @_states[name] if @_states[name]?

    entry =
      name: name
      state: state or new State
      trans: trans
      parent: parent
      stack: {}

    @_states[name] = entry
    entry.parent.stack[name] = entry if parent
    entry

  # ## *_enter*
  #
  #

  _enter: (entry, cb) ->
    # initialize if this is the first time state is entered
    unless entry.init
      entry.init = true
      entry.state.init()

    cbw = ->
      entry.active = true
      entry.state.enter()
      cb()

    # launch transition if their is one or enter directly
#    if entry.trans?
#      entry.trans cbw
#    else
    cbw()

  _exit: (entry, cb) ->
    cbw = ->
      entry.active = false
      entry.state.exit()
      cb()

    # launch transition if their is one or enter directly
#    if entry.trans?
#      entry.trans cbw
#    else
    cbw()

# **exports**
module.exports.Manager = Manager
