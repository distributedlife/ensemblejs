'use strict';

module.exports = {
  type: 'View',
  deps: ['StateTracker', 'AnchorAction'],
  func: function View (tracker, anchorAction) {
    var $ = require('zepto-browserify').$;
    var isArray = require('lodash').isArray;

    var keys = require('../../../public/partials/keys.jade');
    var anchorActions = require('../../../public/partials/anchor-actions.jade');
    var keyState = require('../../../public/partials/key-state.jade');

    //TODO: pull this out.
    $.id = function id (key) {
      if (isArray(key)) {
        return $('#' + key.join('_'));
      } else {
        return $('#' + key);
      }
    };

    function keysPressed (state) {
      return state.ensembleDebug.keys;
    }

    var unsupportedIds = {
      '=': 'equals',
      ';': 'semicolon',
      '\'': 'single-quote',
      ',': 'comma',
      '.': 'period',
      '/': 'forward-slash',
      '\\': 'back-slash',
      '`': 'back-tick',
      '[': 'open-square-bracket',
      ']': 'close-square-bracket'
    };

    function safeId (key) {
      return unsupportedIds[key] ? unsupportedIds[key] : key;
    }

    function addKey (id) {
      var domId = ['key', safeId(id)].join('_');
      $.id('keys').append(keyState({id: domId, key: id}));
    }

    function removeKey (id) {
      $.id(['key', safeId(id)]).remove();
    }

    function addPulse (id) {
      $.id(['key', safeId(id)]).addClass('pulse');
    }

    return function setupKeyStateDebugView () {
      $('#debug').append(keys());
      $('#debug').append(anchorActions());

      anchorAction().add($('.anchor-action'));

      tracker().onElementAdded(keysPressed, addKey);
      tracker().onElementRemoved(keysPressed, removeKey);
      tracker().onElementAdded(keysPressed, addPulse);
    };
  }
};