'use strict';

import { each, reject } from 'lodash';

const sequence = require('distributedlife-sequence');
const config = require('../../util/config');
const setFixedInterval = require('fixed-setinterval');

import { getBySaveAndPlayer } from '../../util/tracking-device-input-received';

module.exports = {
  type: 'StatePusher',
  deps: ['RawStateAccess', 'On', 'DefinePlugin', 'Time'],
  func: function StatePusher (rawStateAccess, on, define, time) {
    let intervals = [];

    const toPush = {};

    function start (save, socket, playerId, deviceNumber) {
      console.info({save, playerId, deviceNumber}, 'Starting State Pusher');

      toPush[save.id] = toPush[save.id] || {};
      toPush[save.id][playerId] = toPush[save.id][playerId] || {};
      toPush[save.id][playerId][deviceNumber] = toPush[save.id][playerId][deviceNumber] || [];

      function updateClient () {
        const changes = rawStateAccess().flush(save.id);

        Object.keys(toPush[save.id]).forEach((player) => {
          Object.keys(toPush[save.id][player]).forEach((device) => {
            toPush[save.id][player][device].push(...changes);
          });
        });

        const packet = {
          measure: time().precise(),
          id: sequence.next('server-origin-messages'),
          timestamp: time().present(),
          highestProcessedMessage: getBySaveAndPlayer(save.id, playerId),
          changeDeltas: toPush[save.id][playerId][deviceNumber].splice(0)
        };

        on().outgoingServerPacket(socket.id, packet);
      }

      socket.emit('initialState', rawStateAccess().snapshot(save.id));

      const cancel = setFixedInterval(updateClient, config.get().server.pushUpdateFrequency);
      intervals.push(cancel);

      define()('OnClientDisconnect', function OnClientDisconnect () {
        return function resetLastPacketSentAndStopPushing () {
          cancel();
          intervals = reject(intervals, (interval) => interval === cancel);
        };
      });
    }

    function stop (save, playerId, deviceNumber) {
      console.info({save, playerId, deviceNumber}, 'Stopping State Pusher');
      delete toPush[save.id][playerId][deviceNumber];
    }

    define()('OnServerStop', function () {
      return function stopAllPushers () {
        each(intervals, function eachInterval (cancel) {
          cancel();
        });
      };
    });

    return { start, stop };
  }
};
