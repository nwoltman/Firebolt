/**
 * Unit tests for Object
 */

// References for Resharper
/// <reference path="../node_modules/qunitjs/qunit/qunit.js"/>
/// <reference path="../../src/firebolt.js"/>

QUnit.module('Object');

QUnit.test('each', function(assert) {
	assert.expect(9);

	var seen,
		i;

	seen = {};
	Object.each([3, 4, 5], function(v, k) {
		seen[k] = v;
	});
	assert.deepEqual(seen, {'0': 3, '1': 4, '2': 5}, 'Array iteration');

	seen = {};
	Object.each({name: 'name', lang: 'lang'}, function(v, k) {
		seen[k] = v;
	});
	assert.deepEqual(seen, {name: 'name', lang: 'lang'}, 'Object iteration');

	seen = [];
	Object.each([1, 2, 3], function(v, k) {
		seen.push(v);
		if (k === '1') {
			return false;
		}
	});
	assert.deepEqual(seen, [1, 2], 'Broken array iteration');

	seen = [];
	Object.each({a: 1, b: 2, c: 3}, function(v) {
		seen.push(v);
		return false;
	});
	assert.deepEqual(seen, [1], 'Broken object iteration');

	i = [{}, []];
	Object.each(i, function(v, k, a) {
		assert.strictEqual(this, v, k + ' - `this` equals the first argument to the callback.');
		assert.strictEqual(i, a, k + ' - The third argument to the callback is the object.');
	});

	assert.strictEqual(Object.each(i, function() { }), i, 'Returns the object.');
});

QUnit.test('getClassOf', function(assert) {
	// Testing every single case is unnecessary, so this tests some regular cases but mainly edge cases
	assert.expect(11);

	assert.ok(Object.getClassOf(undefined) === 'Undefined', 'Gets class of `undefined`.');
	
	assert.ok(Object.getClassOf(null) === 'Null', 'Gets class of `null`.');
	
	assert.ok(Object.getClassOf(function() {}) === 'Function', 'Gets class of a function.');
	
	assert.ok(Object.getClassOf([]) === 'Array', 'Gets class of an array.');

	assert.ok(Object.getClassOf({}) === 'Object', 'Gets class of a plain object.');
	
	assert.ok(Object.getClassOf(0) === 'Number', 'Gets class of a number.');
	
	assert.ok(Object.getClassOf(Infinity) === 'Number', 'Gets class of `infinity`.');
	
	assert.ok(Object.getClassOf(false) === 'Boolean', 'Gets class of a boolean.');

	assert.ok(Object.getClassOf(window) === 'Window', 'Gets class of `window`.');
	
	assert.ok(Object.getClassOf(document) === 'HTMLDocument', 'Gets class of `document`.');

	assert.ok(Object.getClassOf(document.querySelectorAll('a')) === 'NodeList', 'Gets class of a NodeList.');
});
