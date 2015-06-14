'use strict';

var each = require('lodash').each;
var reject = require('lodash').reject;
var select = require('lodash').filter;
var contains = require('lodash').contains;
var getModeOf = require('lodash').first;
var getFuncOf = require('lodash').last;

module.exports = {
  type: 'ServerSideEngine',
  deps: ['ServerSideUpdate', 'StateAccess', 'StateMutator', 'GamesList'],
  func: function (serverSideUpdate, state, mutator, games) {
    var priorStepTime = Date.now();

    var pausedGames = function(game) {
      return state().for(game.id).for('ensemble').get('paused');
    };

    var update = function(dt) {
      each(reject(games().all(), pausedGames), function(game) {
        var gameState = state().for(game.id);
        var callbacksForGame = select(serverSideUpdate(), function(callback) {
          return contains(['*', game.mode], getModeOf(callback));
        });

        each(callbacksForGame, function(callback) {
          mutator()(game.id, getFuncOf(callback)(gameState, dt, game.id));
        });
      });
    };

    var step = function() {
      var now = Date.now();
      var dt = (now - priorStepTime) / 1000;

      update(dt);

      priorStepTime = now;
    };

    return {
      run: function(frequency) {
        step();
        return setInterval(step, 1000 / frequency);
      }
    };
  }
};