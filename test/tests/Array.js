/**
 * Unit tests for Array.prototype
 */

// References for Resharper
/// <reference path="../qunit/qunit.js"/>
/// <reference path="../../src/firebolt.js"/>

module('Array.prototype');

test('get', function() {
	var array = ['a', 'b', 'c'];

	ok(array.get(0) === 'a');
	ok(array.get(1) === 'b');
	ok(array.get(2) === 'c');
	ok(array.get(3) === undefined);
	ok(array.get(-1) === 'c');
	ok(array.get(-2) === 'b');
	ok(array.get(-3) === 'a');
	ok(array.get(-4) === undefined);
});
