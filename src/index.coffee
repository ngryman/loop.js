# **gamestate** implements the *game state pattern*.

# **exports**
module.exports =
  Application: require('./application').Application
  State: require('./state').State
  Manager: require('./state/manager').Manager
  Transition: require('./transition').Transition
