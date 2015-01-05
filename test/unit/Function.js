/**
 * Unit tests for Function.prototype
 */

// References for Resharper
/// <reference path="../node_modules/qunitjs/qunit/qunit.js"/>
/// <reference path="../../src/firebolt.js"/>

QUnit.module('Function.prototype');

QUnit.test('delay', function(assert) {
	assert.expect(16);

	var args = ['a', 2, {arg: 3}];

	var done1 = assert.async();
	var ref1 = (function fn() {
		assert.deepEqual(Array.from(arguments), args,
			'Applies the specified arguments to the function when `thisArg` is not specified.');

		assert.equal(this, ref1, 'Sets `this` to the returned reference object if `thisArg` is not specified.');

		assert.equal(ref1.fn, fn, '`.fn` is set to the function `.delay()` was called on.');

		assert.equal(ref1.hasExecuted, false, '`.hasExecuted` is `false` while the function executes.');

		done1();
	}).delay(50, args);

	assert.equal(ref1.hasExecuted, false, '`.hasExecuted` is `false` before the function executes.');


	var done2 = assert.async();
	var thisArg = {};
	(function() {
		// Final test for ref1
		assert.equal(ref1.hasExecuted, true, '`.hasExecuted` is `true` after the function executes.');

		assert.deepEqual(Array.from(arguments), args,
			'Applies the specified arguments to the function when `thisArg` is specified.');

		assert.equal(this, thisArg, 'Sets `this` to the value specified by the `thisArg` parameter.');

		done2();
	}).delay(50, args, thisArg);


	var done3 = assert.async();
	(function() {
		assert.equal(this, thisArg, 'Sets `this` to the value specified by the `thisArg` parameter' +
			                        ' when `args` is not specified and `thisArg` is not an array.');
		done3();
	}).delay(50, thisArg);


	var done4 = assert.async();
	var thisArgArray = [];
	(function() {
		assert.equal(this, thisArgArray, 'Sets `this` to the value specified by the `thisArg` parameter' +
			                             ' when `args` is `null` and `thisArg` is an array.');
		done4();
	}).delay(50, null, thisArgArray);


	var done5 = assert.async();
	var testVal5 = 0;
	var ref5 = (function() {
		testVal5++;
	}).delay(50);

	ref5.exec();
	assert.equal(testVal5, 1, 'Calling `.exec()` executes the function immediately.');
	assert.equal(ref5.hasExecuted, true,
		'`.hasExecuted` is `true` after the function is executed manually with `.exec()`.');

	setTimeout(function() {
		assert.equal(testVal5, 1,
			'Calling `.exec()` without the parameter `false` cancels the delayed callback.');
		done5();
	}, 50);


	var done6 = assert.async();
	var testVal6 = 0;
	(function() {
		testVal6++;
	}).delay(50).exec(false);

	setTimeout(function() {
		assert.equal(testVal6, 2,
			'Calling `.exec()` with the parameter `false` does not cancel the delayed callback.');
		done6();
	}, 50);


	var done7 = assert.async();
	var testVal7 = 0;
	var ref7 = (function() {
		testVal7++;
	}).delay(50);

	ref7.cancel();
	setTimeout(function() {
		assert.equal(testVal7, 0, 'Calling `.cancel()` cancels the delayed callback.');
		assert.equal(ref7.hasExecuted, false, '`.hasExecuted` remains `false` when a callback is cancelled.');
		done7();
	}, 50);
});
