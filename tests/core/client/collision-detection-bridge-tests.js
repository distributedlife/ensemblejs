'use strict';

var expect = require('expect');
var sinon = require('sinon');

var defer = require('../../support').defer;
var makeTestible = require('../../support').makeTestible;

var start12 = sinon.spy();
var during12 = sinon.spy();
var finish12 = sinon.spy();

var start13 = sinon.spy();
var during13 = sinon.spy();
var finish13 = sinon.spy();

var onEachFrame;
var physicsSystem;

physicsSystem = makeTestible('core/shared/physics-system')[0];

physicsSystem.create(1, 'dot1', {x: 0, y: 0});
physicsSystem.create(1, 'dot2', {x: 1, y: 1});
physicsSystem.create(1, 'dot3', {x: 2, y: 2});
physicsSystem.create(2, 'dot1', {x: 0, y: 0});
physicsSystem.create(2, 'dot2', {x: 1, y: 1});
physicsSystem.create(2, 'dot3', {x: 0, y: 0});

describe('the collision detection bridge', function () {
  var cd = { detectCollisions: sinon.spy() };

  describe('on each frame', function () {
    beforeEach(function () {
      cd.detectCollisions.reset();

      var map1 = ['*', {
        'dot1': [{
          and: ['dot2'],
          start: [start12],
          during: [during12],
          finish: [finish12]
        }]
      }];
      var map2 = ['endless', {
        'dot1': [{
          and: ['dot3'],
          start: [start13],
          during: [during13],
          finish: [finish13]
        }]
      }];

      var bridge = makeTestible('core/client/collision-detection-bridge', {
        CollisionDetectionSystem: cd,
        CollisionMap: [map1, map2]
      });

      onEachFrame = bridge[1].OnPhysicsFrame(defer('arcade'));
      onEachFrame();
    });

    it('should pass in a fake gameId as only one game runs on the client', function () {
      expect(cd.detectCollisions.firstCall.args[1]).toEqual('client');
    });

    it('should pass in the application collision maps for the mode', function () {
      expect(cd.detectCollisions.firstCall.args[0]).toEqual({
        'dot1': [{
          and: ['dot2'],
          start: [start12],
          during: [during12],
          finish: [finish12]
        }]
      });
    });
  });
});