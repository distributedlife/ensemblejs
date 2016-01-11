'use strict';

var kickstartPromiseChain = require('../workflow/promise').kickstartPromiseChain;
var saveCommon = require('../workflow/save-common');
var joinSaveJsonBuilder = require('../json-builders/join-save');

function joinSave (project, savesList) {
  return function buildJson (req) {

    function passThroughPlayerAndHostname (save) {
      var hostname = 'http://' + req.headers.host;

      return [save, req.player, hostname];
    }

    function passThroughProject (save, player, hostname) {
      return [save, player, hostname, project];
    }

    function addFlashMessages (json) {
      json.info = req.flash('info');
      json.warning = req.flash('warning');
      json.error = req.flash('error');

      return json;
    }

    return kickstartPromiseChain(savesList.get(req.params.saveId))
      .then(saveCommon.errorIfSaveDoesNotExist)
      .then(passThroughPlayerAndHostname)
      .spread(saveCommon.redirectIfPlayerIsInSave)
      .spread(saveCommon.redirectIfSaveHasNoSpace)
      .spread(passThroughProject)
      .spread(joinSaveJsonBuilder)
      .then(addFlashMessages);
  };
}

module.exports = joinSave;