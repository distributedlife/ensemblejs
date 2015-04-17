'use strict';

var assert = require('assert');
var sinon = require('sinon');

var deferDep = require('../helpers.js').deferDep;

var update = sinon.spy();
var paused = false;
var state = {
	get: function () { return function() { return paused; }; }
};
var mutator = {
	mutate: sinon.spy()
};

describe('the engine', function() {
	var engine;
	var clock;
	var interval;

	beforeEach(function() {
		update.reset();

		clock = sinon.useFakeTimers();

		engine = require('../../src/engine.js').func(deferDep([update]), deferDep(state), deferDep(mutator));
	});

	afterEach(function() {
		clearInterval(interval);
		clock.restore();
	});

	describe('when unpaused', function() {
		it('should call each function passed in with the delta in ms', function() {
			clock.tick(5000);
			interval = engine.run(0.5);
			assert.deepEqual(update.firstCall.args, [5]);
		});
	});

	describe('when paused', function() {
		it('it should not call any update functions', function() {
			paused = true;
			interval = engine.run(1);
			assert(!update.called);
		});
	});
});