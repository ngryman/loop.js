{Transition} = require '../transition'

class Interpolation extends Transition
  constructor: (options) ->
    super(options)

    @from = @from ? 0
    @to = @to ? 1
    @duration = @duration ? 400

  start: (state) ->
    @value = @from
    state.transition @value

  update: (state, time) ->
    @value = @from + (+new Date - time) * @to
    state.transition @value

  end: (state) ->
    @value = @to
    state.transition @value

module.exports.Interpolation = Interpolation
