/**
 * Unit tests for NodeCollection
 */

// References for Resharper
/// <reference path="../qunit/qunit.js"/>
/// <reference path="../../src/firebolt.js"/>

module('NodeCollection');

test('#toArray', function() {
	expect(2);

	var nc = Firebolt('div');
	var array = nc.toArray();

	ok(Array.isArray(array) && (array instanceof Array), 'Returns a true Array.');

	deepEqual(nc, array, 'Contains the exact same items as the original collection.');
});
