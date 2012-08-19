{State} = require './state'
{Manager} = require './state/manager'

class Application extends Manager
  init: (name, delegate) ->
    @when 'init', name, delegate

  cleanup: (name, delegate) ->
    @when 'cleanup', name, delegate

  enter: (name, delegate) ->
    @when 'enter', name, delegate

  exit: (name, delegate) ->
    @when 'exit', name, delegate

  pause: (name, delegate) ->
    @when 'pause', name, delegate

  resume: (name, delegate) ->
    @when 'resume', name, delegate

  tick: (name, delegate) ->
    @when 'tick', name, delegate

  transition: (name, delegate) ->
    @when 'transition', name, delegate

  when: (events, name, delegate) ->
    events = events.split(' ')

    @push name if not @_states[name]?

    if 'function' is typeof delegate
      state = @_states[name].state
      state[event] = delegate for event in events
    @

  loop: ->
    @push '__empty__' if not @_launchEntry
    @change @_launchEntry.name if not @_current
    @_loop()
    @

  abort: ->
    window.cancelAnimationFrame @_frameId

  _loop: (time) ->
    @_frameId = window.requestAnimationFrame (time) => @_loop(time)
    @fire 'tick', time
    return

window.requestAnimationFrame or=
  window.webkitRequestAnimationFrame or
  window.mozRequestAnimationFrame    or
  window.oRequestAnimationFrame      or
  window.msRequestAnimationFrame     or
  (callback) ->
    window.setTimeout callback, 1000 / 60, 1000 / 60

window.cancelAnimationFrame or=
  window.webkitCancelRequestAnimationFrame or
  window.mozCancelRequestAnimationFrame    or
  window.oCancelRequestAnimationFrame      or
  window.msCancelRequestAnimationFrame     or
  (id) ->
    window.clearTimeout id

window.performance = (->
  perf = window.performance or {}
  perf.now or=
    perf.webkitNow or
    perf.mozNow    or
    perf.msNow     or
    perf.oNow      or
    ->
      Date.now()
)()

# **exports**
module.exports.Application = Application
