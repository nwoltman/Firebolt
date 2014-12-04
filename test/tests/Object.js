/**
 * Unit tests for Object
 */

// References for Resharper
/// <reference path="../qunit/qunit.js"/>
/// <reference path="../../src/firebolt.js"/>

module('Object');

test('each', function() {
	expect(9);

	var seen,
		i;

	seen = {};
	Object.each([3, 4, 5], function(v, k) {
		seen[k] = v;
	});
	deepEqual(seen, { '0': 3, '1': 4, '2': 5 }, 'Array iteration');

	seen = {};
	Object.each({ name: 'name', lang: 'lang' }, function(v, k) {
		seen[k] = v;
	});
	deepEqual(seen, { name: 'name', lang: 'lang' }, 'Object iteration');

	seen = [];
	Object.each([1, 2, 3], function(v, k) {
		seen.push(v);
		if (k === '1') {
			return false;
		}
	});
	deepEqual(seen, [1, 2], 'Broken array iteration');

	seen = [];
	Object.each({ a: 1, b: 2, c: 3 }, function(v) {
		seen.push(v);
		return false;
	});
	deepEqual(seen, [1], 'Broken object iteration');

	i = [{}, []];
	Object.each(i, function(v, k, a) {
		strictEqual(this, v, k + ' - `this` equals the first argument to the callback.');
		strictEqual(i, a, k + ' - The third argument to the callback is the object.');
	});

	strictEqual(Object.each(i, function() { }), i, 'Returns the object.');
});

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

	ok(Object.getClassOf(window) === 'Window', 'Gets class of `window`.');
	
	ok(Object.getClassOf(document) === 'HTMLDocument', 'Gets class of `document`.');

	ok(Object.getClassOf(document.querySelectorAll('a')) === 'NodeList', 'Gets class of a NodeList.');
});
