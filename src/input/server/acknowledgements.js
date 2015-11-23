'use strict';

var each = require('lodash').each;
var last = require('lodash').last;
var select = require('lodash').select;
var reject = require('lodash').reject;
var unique = require('lodash').unique;
var map = require('lodash').map;
var contains = require('lodash').contains;
var filterPluginsByMode = require('../../util/modes').filterPluginsByMode;

function toggleAck (players, playerId) {
  if (contains(players, playerId)) {
    return unique(reject(players, function(n) { return n === playerId;}));
  } else {
    players.push(playerId);
    return unique(players);
  }
}

function ackEvery (action, ack, game, onProgress, onComplete) {
  onComplete(action);
}

function ackFirstOnly (action, ack, game, onProgress, onComplete) {
  if (action.fired) {
    return;
  }

  action.fired = true;

  onComplete(action);
}

module.exports = {
  type: 'AcknowledgementProcessing',
  deps: ['Config', 'StateMutator', 'StateAccess', 'AcknowledgementMap', 'Logger', 'DefinePlugin'],
  func: function AcknowledgementProcessing (config, mutate, state, acknowledgementMaps, logger, define) {

    var serverAcks = [];

    function ackOnceForAll (action, ack, game, onProgress, onComplete) {
      action.players = action.players || [];
      action.fired = action.fired || false;

      if (action.fired) {
        logger().trace(action, 'Action has already fired.');
        return;
      }

      action.players = toggleAck(action.players, ack.playerId);

      if (action.players.length === config().maxPlayers(game.mode)) {
        logger().trace(action, 'Ack for player ' + ack.playerId + '.');
        onProgress(action);

        logger().trace(action, 'All players have ack\'d.');
        onComplete(action);

        action.fired = true;
        return true;
      } else {
        logger().trace(action, 'Ack for player ' + ack.playerId + '.');
        onProgress(action);
      }
    }

    function ackOnceEach (action, ack, game, onProgress, onComplete) {
      action.players = action.players || [];
      action.fired = action.fired || false;

      if (action.fired) {
        logger().trace(action, 'Action has already fired.');
        return;
      }

      if (contains(action.players, ack.playerId)) {
        logger().trace(action, 'Player ' + ack.playerId + ' has already fired ack.');
        return;
      }

      action.players.push(ack.playerId);
      action.players = unique(action.players);
      onProgress(action);

      if (action.players.length === config().maxPlayers(game.mode)) {
        action.fired = true;
        onComplete(action);
      }

      return true;
    }

    var ackMapTypeCanFireHandler = {
      'once-for-all': ackOnceForAll,
      'every': ackEvery,
      'once-each': ackOnceEach,
      'first-only': ackFirstOnly
    };

    define()('OnIncomingClientInputPacket', function () {
      return function handleAcknowledgements (packet, game) {
        var serverAcksForGame = select(serverAcks, {gameId: game.id});
        serverAcks = reject(serverAcks, {gameId: game.id});

        var acks = packet.pendingAcks.concat(serverAcksForGame);
        acks = map(acks, function (ack) {
          ack.playerId = packet.playerId;
          return ack;
        });

        each(acks, function (ack) {
          var byMode = filterPluginsByMode(acknowledgementMaps(), game.mode);
          var hasMatchingName = select(byMode, function(ackMap) {
            return last(ackMap)[ack.name];
          });

          function onProgress (action) {
            logger().debug('Acknowledgement "' + ack.name + '" progressed.');

            mutate()(
              game.id,
              action.onProgress(
                state().for(game.id),
                ack,
                action.players,
                action.data
              )
            );
          }

          function onComplete (action) {
            logger().debug('Acknowledgement "' + ack.name + '" complete.');

            mutate()(
              game.id,
              action.onComplete(
                state().for(game.id),
                ack,
                action.data
              )
            );
          }

          each(hasMatchingName, function(ackMap) {
            var actions = last(ackMap)[ack.name];

            each(actions, function (action) {
              ackMapTypeCanFireHandler[action.type](action, ack, game, onProgress, onComplete);
            });
          });
        });
      };
    });
  }
};