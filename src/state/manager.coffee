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

    parent = @_pushEntry name, null, state ? new State, trans[0]
    while names.length
      name = name + @_options.separator + names.shift()
      parent = @_pushEntry name, parent, new State, trans[0]

    @_launchEntry = @_launchEntry ? @_states[name]
    @

  # ## *change*
  #
  # **given** a state name<br>
  # **then** switch the current state, if it exists, to the new one.<br>
  # if transitions are attached to the states, they are applyied.

  change: (name) ->
    entry = @_states[name]

#    async.parallel [
#      (cb) => @_enter entry, cb
#      (cb) => @__exit entry, cb
#    ], ->
#      @current = entry.state

    if @_current
      @_current.active = false
      parent = @_current
      while parent
        parent.active = false
        parent = parent.parent

    parent = entry.parent
    while parent
      parent.active = true
      parent = parent.parent

    entry.active = true
    @_current = entry
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
    entry =
      name: name
      state: state
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
      entry.state.init?()
      entry.init = true

    cbw = ->
      state.enter()
      cb()

    # launch transition if their is one or enter directly
    if entry.enterTrans?
      entry.enterTrans cbw
    else
      cbw()

  # states stack
#  _stack: []
  # reference to states stack, used in *push* and *pop*
#  __children: Manager::_states

# **exports**
module.exports.Manager = Manager
