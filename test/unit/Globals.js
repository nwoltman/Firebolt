/**
 * Unit tests for Globals
 */

// References for Resharper
/// <reference path="../node_modules/qunitjs/qunit/qunit.js"/>
/// <reference path="../../src/firebolt.js"/>

QUnit.module('Globals');

QUnit.test('FB', function(assert) {
	assert.equal(window.FB, Firebolt, 'window.FB === Firebolt');
});

QUnit.test('$', function(assert) {
	assert.equal(window.$, Firebolt, 'window.$ === Firebolt');
});