/**
 * Unit tests for Object
 */

// References for Resharper
/// <reference path="../qunit/qunit.js"/>
/// <reference path="../../src/firebolt.js"/>

module('Object');

test('getClassOf', function () {
	// Testing every single case is unnecessary, so this tests some regular cases but mainly edge cases
	expect(11);

	ok(Object.getClassOf(undefined) === 'Undefined', 'Gets class of `undefined`.');
	
	ok(Object.getClassOf(null) === 'Null', 'Gets class of `null`.');
	
	ok(Object.getClassOf(function() {}) === 'Function', 'Gets class of a function.');
	
	ok(Object.getClassOf([]) === 'Array', 'Gets class of an array.');

	ok(Object.getClassOf({}) === 'Object', 'Gets class of a plain object.');
	
	ok(Object.getClassOf(0) === 'Number', 'Gets class of a number.');
	
	ok(Object.getClassOf(Infinity) === 'Number', 'Gets class of `infinity`.');
	
	ok(Object.getClassOf(false) === 'Boolean', 'Gets class of a boolean.');

	ok(Object.getClassOf(window) === 'Object', 'Gets class of `window`.');
	
	ok(Object.getClassOf(document) === 'HTMLDocument', 'Gets class of `document`.');

	ok(Object.getClassOf(document.querySelectorAll('a')) === 'NodeList', 'Gets class of a NodeList.');
});
