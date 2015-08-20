'use strict';

var expect = require('expect');
var sinon = require('sinon');
var assert = require('assert');
var isEqual = require('lodash').isEqual;
var defer = require('../../support').defer;
var plugin = require('../../support').plugin();
var modulePath = '../../../src/state/client/tracker';

var the = function (name) { return function (state) { return state[name]; }; };
var to = function (name) { return function (state) { return state[name]; }; };
var from = function (name) { return function (state) { return state[name]; }; };
var within = function (name) { return function (state) { return state[name]; }; };
var equals = function (expectedValue) {
  return function (currentValue) {
      return isEqual(currentValue, expectedValue);
  };
};

var tracker;
var rawStateAccess = {
	get: sinon.spy(),
	resetTo: sinon.spy()
};

function forceCurrentRawState (newState) {
	rawStateAccess.get = function () { return newState; };
}

describe('StateTracker', function () {
	var callback = sinon.spy();
	var onPhysicsFrameComplete;

	beforeEach(function () {
		callback.reset();
		plugin.reset();
		tracker = require(modulePath).func(defer(plugin.define));
		onPhysicsFrameComplete = plugin.deps().OnPhysicsFrameComplete(defer(rawStateAccess));
	});

	describe('working with property', function () {
		describe('when a property changes', function() {
			beforeEach(function () {
				forceCurrentRawState({ property: 'unchanged' });
				onPhysicsFrameComplete();
				tracker.onChangeOf(the('property'), callback, 'data');
			});

			it('should invoke the callback when the change occurs', function() {
				forceCurrentRawState({property: 'changed'});
				onPhysicsFrameComplete();
				assert(callback.calledOnce);
			});

			it('should not invoke the callback when the thing does not change', function () {
				forceCurrentRawState({property: 'unchanged'});
				onPhysicsFrameComplete();
				expect(callback.calledOnce).toBe(false);
			});

			it('should pass the old and new values of the thing and the data to the callback', function() {
				forceCurrentRawState({property: 'changed'});
				onPhysicsFrameComplete();
				expect(callback.firstCall.args).toEqual(['changed', 'unchanged', 'data']);
			});
		});

		describe('when there is no prior state', function() {
			beforeEach(function () {
				tracker.onChangeOf(the('property'), callback, 'data');
			});

			it('should invoke the callback when the change occurs', function() {
				forceCurrentRawState({property: 'changed'});
				onPhysicsFrameComplete();
				assert(callback.calledOnce);
			});

			it('should pass only the new values of the thing and the data to the callback', function() {
				forceCurrentRawState({property: 'changed'});
				onPhysicsFrameComplete();
				expect(callback.firstCall.args).toEqual(['changed', undefined, 'data']);
			});
		});

		describe('when detecting a change to a particular value', function() {
			beforeEach(function () {
				forceCurrentRawState({property: 'unchanged'});
				onPhysicsFrameComplete();
				tracker.onChangeTo(the('property'), equals('changed'), callback, 'data');
			});

			it('should invoke the callback when the change occurs', function() {
				forceCurrentRawState({property: 'changed'});
				onPhysicsFrameComplete();
				assert(callback.calledOnce);
			});

			it('should not invoke the callback when the thing does not change to the correct state', function () {
				forceCurrentRawState({property: 'other'});
				onPhysicsFrameComplete();
				expect(callback.calledOnce).toBe(false);
			});

			it('should pass the old and new values of the thing and the data to the callback', function() {
				forceCurrentRawState({property: 'changed'});
				onPhysicsFrameComplete();
				expect(callback.firstCall.args).toEqual(['changed', 'unchanged', 'data']);
			});

			it('should call the callback immediately if the state is already true', function() {
				callback.reset();
				tracker.onChangeTo(the('property'), equals('unchanged'), callback, 'data');
				assert(callback.calledOnce);
			});
		});
	});

	describe('working with objects', function () {
		describe('when the object changes', function() {
			beforeEach(function () {
				forceCurrentRawState({obj: {child: 'value'}});
				onPhysicsFrameComplete();
				tracker.onChangeOf(the('obj'), callback, 'data');
			});

			it('should invoke the callback when the change occurs', function() {
				forceCurrentRawState({obj: {child: 'newValue'}});
				onPhysicsFrameComplete();
				assert(callback.calledOnce);
			});

			it('should not invoke the callback when the thing does not change', function () {
				forceCurrentRawState({obj: {child: 'value'}});
				onPhysicsFrameComplete();
				expect(callback.calledOnce).toBe(false);
			});

			it('should pass the old and new values of the thing and the data to the callback', function() {
				forceCurrentRawState({obj: {child: 'newValue'}});
				onPhysicsFrameComplete();
				expect(callback.firstCall.args).toEqual([{ child: 'newValue'}, { child: 'value'}, 'data']);
			});
		});

		describe('when there is no prior state', function() {
			beforeEach(function () {
				tracker.onChangeOf(the('obj'), callback, 'data');
			});

			it('should invoke the callback when the change occurs', function() {
				forceCurrentRawState({obj: {child: 'newValue'}});
				onPhysicsFrameComplete();
				assert(callback.calledOnce);
			});

			it('should pass the new values of the thing and the data to the callback', function() {
				forceCurrentRawState({obj: {child: 'newValue'}});
				onPhysicsFrameComplete();
				expect(callback.firstCall.args).toEqual([{ child: 'newValue'}, undefined, 'data']);
			});
		});

		describe('when detecting a change to a particular value', function() {
			beforeEach(function () {
				forceCurrentRawState({obj: {child: 'value'}});
				onPhysicsFrameComplete();
				tracker.onChangeTo(the('obj'), equals({child: 'newValue'}), callback, 'data');
			});

			it('should invoke the callback when the change occurs', function() {
				forceCurrentRawState({obj: {child: 'newValue'}});
				onPhysicsFrameComplete();
				assert(callback.calledOnce);
			});

			it('should not invoke the callback when the thing does not change to the desired state', function () {
				forceCurrentRawState({obj: {child: 'otherValue'}});
				onPhysicsFrameComplete();
				expect(callback.calledOnce).toBe(false);
			});

			it('should pass the old and new values of the thing and the data to the callback', function() {
				forceCurrentRawState({obj: {child: 'newValue'}});
				onPhysicsFrameComplete();
				expect(callback.firstCall.args).toEqual([{ child: 'newValue'}, { child: 'value'}, 'data']);
			});

			it('should call the callback immediately if the state is already true', function() {
				callback.reset();
				tracker.onChangeTo(the('obj'), equals({child: 'value'}), callback, 'data');
				assert(callback.calledOnce);
			});
		});
	});

	describe('working with arrays', function () {
		var callback2 = sinon.spy();

		beforeEach(function () {
			callback2.reset();
		});

		describe('when an element is added', function() {
			beforeEach(function() {
				forceCurrentRawState({ numbers: [] });
				onPhysicsFrameComplete();
				tracker.onElementAdded(to('numbers'), callback, callback2, 'data');
				forceCurrentRawState({ numbers: [{id: 1, value: '7'}] });
				onPhysicsFrameComplete();
			});

			it('should invoke the callback with the new element and the data', function() {
				assert(callback.calledOnce);
				expect(callback.firstCall.args).toEqual([1, {id: 1, value: '7'}, 'data']);
			});

			it('should accept a second callback that is invoked when there are elements already in the array', function() {
				callback2.reset();
				plugin.reset();
				tracker = require(modulePath).func(defer(plugin.define));
				onPhysicsFrameComplete = plugin.deps().OnPhysicsFrameComplete(defer(rawStateAccess));

				forceCurrentRawState({ numbers: [{id: 1, value: '7'}] });
				onPhysicsFrameComplete();
				tracker.onElementAdded(to('numbers'), callback, callback2, 'data');
				assert(callback2.calledOnce);
				expect(callback2.firstCall.args).toEqual([[{id: 1, value: '7'}], undefined, 'data']);
			});
		});

		describe('when an element is removed', function() {
			beforeEach(function() {
				forceCurrentRawState({ numbers: [{id: 1, value: '7'}] });
				onPhysicsFrameComplete();
				tracker.onElementRemoved(from('numbers'), callback, 'data');
				forceCurrentRawState({ numbers: [] });
				onPhysicsFrameComplete();
			});

			it('should invoke the callback with the removed element and the data', function() {
				assert(callback.calledOnce);
				expect(callback.firstCall.args).toEqual([1, {id: 1, value: '7'}, 'data']);
			});
		});

		describe('when an element is changed', function() {
			beforeEach(function() {
				forceCurrentRawState({ numbers: [{id: 1, value: '6'}] });
				onPhysicsFrameComplete();
				tracker.onElementChanged(within('numbers'), callback, 'data');
				forceCurrentRawState({ numbers: [{id: 1, value: '7'}] });
				onPhysicsFrameComplete();
			});

			it('should invoke the callback with the removed element and the data', function() {
				assert(callback.calledOnce);
				expect(callback.firstCall.args).toEqual([1, {id: 1, value: '7'}, {id: 1, value: '6'}, 'data']);
			});

			it('should not invoke the callback when nothing has changed', function() {
				callback.reset();
				forceCurrentRawState({ numbers: [{id: 1, value: '7'}] });
				onPhysicsFrameComplete();
				expect(callback.called).toEqual(false);
			});
		});
	});

	describe.skip('on setup', function () {
		it('should update the state', function () {
			forceCurrentRawState({prop: 'a'});
			onPhysicsFrameComplete();
			expect(plugin.deps().CurrentState().get(the('prop'))).toEqual('a');

			forceCurrentRawState({prop: 'b'});
			onPhysicsFrameComplete();
			expect(plugin.deps().CurrentState().get(the('prop'))).toEqual('b');
		});
	});

	describe.skip('on packet', function () {
		it('should update the state', function () {
			plugin.deps().OnPacket()({id: 1, gameState: {prop: 'c'}});
			expect(plugin.deps().CurrentState().get(the('prop'))).toEqual('c');
		});

		it('should ignore old packets', function () {
			var onPacket = plugin.deps().OnPacket();
			onPacket({id: 2, gameState: {prop: 'c'}});
			onPacket({id: 1, gameState: {prop: 'd'}});
			expect(plugin.deps().CurrentState().get(the('prop'))).toEqual('c');
		});
	});

	describe('getting the current value', function () {
		it('should return the current value', function() {
			forceCurrentRawState({property: 'unchanged'});
			onPhysicsFrameComplete();
			expect(plugin.deps().CurrentState().get(the('property'))).toEqual('unchanged');
		});
	});
});