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

QUnit.test('$$', function(assert) {
	assert.equal(window.$$('qunit'), document.getElementById('qunit'),
		'Acts as an alias for document.getElementById');
});

QUnit.test('$CLS', function(assert) {
	assert.equal(window.$CLS('class1'), document.getElementsByClassName('class1'),
		'Acts as an alias for document.getElementsByClassName');
});

QUnit.test('$ID', function(assert) {
	assert.equal(window.$ID, window.$$, 'Is an alias of `window.$$`.');
});

QUnit.test('$NAME', function(assert) {
	assert.equal(window.$NAME('name1'), document.getElementsByName('name1'),
		'Acts as an alias for document.getElementsByName');
});

QUnit.test('$QS', function(assert) {
	assert.equal(window.$QS('#qunit'), document.querySelector('#qunit'),
		'Acts as an alias for document.querySelector');
});

QUnit.test('$QSA', function(assert) {
	assert.deepEqual(window.$QSA('body > div'), document.querySelectorAll('body > div'),
		'Acts as an alias for document.querySelectorAll');
});

QUnit.test('$TAG', function(assert) {
	assert.equal(window.$TAG('div'), document.getElementsByTagName('div'),
		'Acts as an alias for document.getElementsByTagName');
});
