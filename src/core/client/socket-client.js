'use strict';

var io = require('socket.io-client');

module.exports = {
  type: 'SocketClient',
  deps: ['Window', 'GameMode', 'ServerUrl', 'On', 'DefinePlugin', 'Time', '$'],
  func: function SocketClient (window, gameMode, host, on, define, time, $) {

    function url () {
      return host() + '/' + gameMode() + '/primary';
    }

    function connect () {
      var socket = io.connect(url(), { reconnection: false });

      socket.on('startTime', function (serverOffset) {
        var currentClientTime = time().present();
        time().setOffset(serverOffset - currentClientTime);
      });
      socket.on('connect', function connect () {
        on().connect('client', gameMode());
      });
      socket.on('disconnect', function disconnect () {
        on().disconnect('client', gameMode());
      });

      socket.on('playerId', function savePlayerId (playerId) {
        socket.playerId = playerId;
      });

      socket.on('initialState', function initialState (packet) {
        on().clientStart(packet, gameMode());
      });
      socket.on('updateState', on().incomingServerPacket);
      socket.on('error', on().error);

      if (window().document.hasFocus()) { socket.emit('unpause'); }
      $()(window()).on('blur', function () { socket.emit('pause'); });
      $()(window()).on('focus', function () { socket.emit('unpause'); });
      $()(window()).on('mousedown', function () { socket.emit('unpause'); });
      $()(window()).on('mouseup', function () { socket.emit('unpause'); });

      define()('OnOutgoingClientPacket', function SocketClient () {
        return function sendPacketToServer (packet) {
          socket.emit('input', packet);
        };
      });

      define()('OnIncomingServerPacket', function SocketClient () {
        return function ackPacket (packet) {
          socket.emit('ack', packet.id);
        };
      });
    }

    return {
      connect: connect
    };
  }
};