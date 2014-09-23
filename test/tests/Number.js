/**
 * Unit tests for Number.prototype
 */

// References for Resharper
/// <reference path="../qunit/qunit.js"/>
/// <reference path="../../src/firebolt.js"/>

module('Number.prototype');

test('toPaddedString', function() {
	expect(7);

	strictEqual((255).toPaddedString(4), '0255', 'Pads a positive number.');

	strictEqual((255).toPaddedString(6), '000255', 'Pads a positive number more.');

	strictEqual((-255).toPaddedString(5), '-0255', 'Pads a negative number.');

	strictEqual((255).toPaddedString(4, 16), '00ff', 'Pads a positive number given a radix.');

	strictEqual((25589).toPaddedString(4), '25589', 'Does not pad a number longer than the specified padding length.');

	strictEqual((3).toPaddedString(5, 2), '00011', 'Pads another positive number given a radix.');

	strictEqual((-3).toPaddedString(5, 2), '-0011', 'Pads a negative number given a radix.');
});
