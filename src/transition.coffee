class Transition
  constructor: (options) ->
    @[k] = v for k, v of options if options?

  start: (state) ->

  update: (state, time) ->

  end: (state) ->

module.exports.Transition = Transition
