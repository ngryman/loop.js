class State

  # ## *constructor*
  #
  # **does** construct internal variables used by the system
  # **and** has to be called when subclassing

  constructor: (manager) ->
    @manager = manager

  # **overridable**
  # - - - - - - - -

  # ## *init*
  #
  # **called** when state is entered the first time
  # **and** should be used to initialize the state (i.e. loading resources, creating maps, ...)

  init: ->

  # ## *cleanup*
  #
  # **called** when state
  # TODO: when? manually? automatically? configurable?

  cleanup: ->

  # ## *enter*
  #
  # **called** each time the state become *active*
  # **and** should be used to prepare the state (i.e. show objects, configure, ...)

  enter: ->

  # ## *exit*
  #
  #
  exit: ->

  # ## *focus*
  #
  #
  focus: ->

  # ## *blur*
  #
  #
  blur: ->

  # ## *pause*
  #
  #
  pause: ->

  # ## *resume*
  #
  #
  resume: ->

  # ## *update*
  #
  #
  update: (time) ->

  # ## *draw*
  #
  #
  draw: (time) ->

  # ## *transition*
  #
  #
  transition: () ->

  # **internal sugar**
  # - - - - - - - - -

# **exports**
module.exports.State = State
