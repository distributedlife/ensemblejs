'use strict';

var appRoot = require('app-root-path');
var packageInfo = require(appRoot + '/package.json');
var logger = require('./logging/logger.js').logger;
var defaults = require('lodash').defaults;
var defaultConfig = require('../config/defaults.json');

function getConfig() {
  var config = {};

  try {
    config = require(appRoot + '/config.json');
    logger.info('Using custom config.');
  } catch (error) {
    logger.info('Not using custom config.');
  }

  config = defaults(config, defaultConfig);
  logger.info(config, 'Initial Configuration');

  return config;
}

var config = getConfig();
logger.logLevel = config.logging.logLevel;

var plugins = require('plug-n-play').configure(
  logger,
  require('./conf/array-plugins'),
  require('./conf/default-mode-plugins'),
  config.logging.silencedPlugins
);

plugins.load({
  type: 'Config',
  func: function() {
    return config;
  }
});

plugins.load(require('./server.js'));
plugins.load(require('./input/input_handler.js'));
plugins.load(require('./jobs/job_manager.js'));
plugins.load(require('./socket.js'));
plugins.load(require('./engine.js'));
plugins.load(require('./state/mutator.js'));
plugins.load(require('./events/on_pause.js'));
plugins.load(require('./events/on_unpause.js'));
plugins.load(require('./events/on_player_connected.js'));
plugins.load(require('./events/on_player_disconnected.js'));
plugins.load(require('./events/on_observer_connected.js'));
plugins.load(require('./events/on_observer_disconnected.js'));
plugins.load(require('./state/initialiser.js'));
plugins.load(require('./state/seed.js'));
plugins.load(require('./state/games.js'));
plugins.load(require('./debug/input_state.js'));
plugins.load(require('./debug/mouse_action_map.js'));
plugins.load(require('./debug/key_action_map.js'));
plugins.load(require('./debug/touch_action_map.js'));

function run (pathToGame, modes) {
  plugins.get('HttpServer').start(pathToGame, modes);
  plugins.get('ServerSideEngine').run(120);
}

function runGameAtPath (path) {
  logger.info('ensemblejs@' + packageInfo.version + ' started.');

  plugins.loadPath(path + '/js/logic');
  plugins.loadPath(path + '/js/state');
  plugins.loadPath(path + '/js/events');
  plugins.loadPath(path + '/js/maps');

  if (require('fs').existsSync(path + '/js/modes.json')) {
    run(path, require(path + '/js/modes.json'));
  } else {
    run(path, []);
  }
}

module.exports = {
  runGameAtPath: runGameAtPath
};