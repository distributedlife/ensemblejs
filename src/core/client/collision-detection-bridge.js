'use strict';

var forEachMode = require('../../util/modes').forEachMode;

module.exports = {
  type: 'CollisionDetectionBridge',
  deps: ['DefinePlugin', 'CollisionMap', 'CollisionDetectionSystem'],
  func: function CollisionDetectionBridge (define, maps, collisionDetectionSystem) {

    function OnPhysicsFrame (mode) {
      return function callSystemWithRelevantMapsAndGameId () {
        forEachMode(maps(), mode(), function (map) {
          collisionDetectionSystem().detectCollisions(map, 'client');
        });
      };
    }

    define()('OnPhysicsFrame', ['GameMode'], OnPhysicsFrame);
  }
};