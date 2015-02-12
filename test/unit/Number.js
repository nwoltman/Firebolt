/**
 * Unit tests for Number.prototype
 */

// References for Resharper
/// <reference path="../node_modules/qunitjs/qunit/qunit.js"/>
/// <reference path="../../src/firebolt.js"/>

QUnit.module('Number.prototype');

QUnit.test('toPaddedString', function(assert) {
  assert.expect(7);

  assert.strictEqual((255).toPaddedString(4), '0255', 'Pads a positive number.');

  assert.strictEqual((255).toPaddedString(6), '000255', 'Pads a positive number more.');

  assert.strictEqual((-255).toPaddedString(5), '-0255', 'Pads a negative number.');

  assert.strictEqual((255).toPaddedString(4, 16), '00ff', 'Pads a positive number given a radix.');

  assert.strictEqual((25589).toPaddedString(4), '25589',
    'Does not pad a number longer than the specified padding length.');

  assert.strictEqual((3).toPaddedString(5, 2), '00011', 'Pads another positive number given a radix.');

  assert.strictEqual((-3).toPaddedString(5, 2), '-0011', 'Pads a negative number given a radix.');
});
