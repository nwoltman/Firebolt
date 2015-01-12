/**
 * Unit tests for HTMLElement
 */

// References for Resharper
/// <reference path="../node_modules/qunitjs/qunit/qunit.js"/>
/// <reference path="../../src/firebolt.js"/>

QUnit.module('HTMLElement.prototype');

function areClassNamesEquivalent(classA, classB) {
	var rgxWhitespace = /\s+/;

	classA = classA.trim().split(rgxWhitespace).uniq().sort();
	classB = classB.trim().split(rgxWhitespace).uniq().sort();

	if (classA.length !== classB.length) return false;

	for (var i = 0; i < classA.length; i++) {
		if (classA[i] !== classB[i]) return false;
	}

	return true;
}

QUnit.test('addClass', function(assert) {
	var element = document.createElement('div');
	var tests = [
		// #1
		{originalClass: '', classToAdd: 'class', expectedResult: 'class'},
		
		// #2
		{originalClass: '', classToAdd: 'one two', expectedResult: 'one two'},
		
		// #3
		{originalClass: 'class', classToAdd: 'class', expectedResult: 'class'},
		
		// #4
		{originalClass: 'one two', classToAdd: 'one', expectedResult: 'one two'},
		
		// #5
		{originalClass: 'one two', classToAdd: 'three', expectedResult: 'one two three'},
		
		// #6
		{originalClass: 'one two', classToAdd: 'two three', expectedResult: 'one two three'},
		
		// #7
		{originalClass: 'one two', classToAdd: 'three one', expectedResult: 'one two three'},
		
		// #8
		{originalClass: 'one two', classToAdd: 'one two', expectedResult: 'one two'},
		
		// #9
		{originalClass: 'one two', classToAdd: 'three four', expectedResult: 'one two three four'}
	];

	for (var i = 0; i < tests.length; i++) {
		var test = tests[i];
		element.className = test.originalClass;
		element.addClass(test.classToAdd);
		assert.ok(areClassNamesEquivalent(element.className, test.expectedResult), '#' + (i + 1));
	}
});

QUnit.test('removeClass', function(assert) {
	var element = document.createElement('div');
	var tests = [
		// #1
		{originalClass: '', classToRemove: 'class', expectedResult: ''},

		// #2
		{originalClass: 'class', classToRemove: 'class', expectedResult: ''},

		// #3
		{originalClass: 'one two', classToRemove: 'one', expectedResult: 'two'},

		// #4
		{originalClass: 'one two', classToRemove: 'two', expectedResult: 'one'},

		// #5
		{originalClass: 'one two', classToRemove: 'three', expectedResult: 'one two'},

		// #6
		{originalClass: 'one two', classToRemove: 'two three', expectedResult: 'one'},

		// #7
		{originalClass: 'one two', classToRemove: 'three one', expectedResult: 'two'},

		// #8
		{originalClass: 'one two', classToRemove: 'one two', expectedResult: ''},

		// #9
		{originalClass: 'one two', classToRemove: 'two one', expectedResult: ''},

		// #10
		{originalClass: 'one two', classToRemove: 'three four', expectedResult: 'one two'}
	];

	for (var i = 0; i < tests.length; i++) {
		var test = tests[i];
		element.className = test.originalClass;
		element.removeClass(test.classToRemove);
		assert.ok(areClassNamesEquivalent(element.className, test.expectedResult), '#' + (i + 1));
	}
});

QUnit.test('toggleClass', function(assert) {
	var element = document.createElement('div');
	var tests = [
		// #1
		{originalClass: '', args: ['class'], expectedResult: 'class'},

		// #2
		{originalClass: 'class', args: ['class'], expectedResult: ''},

		// #3
		{originalClass: 'one two', args: ['one'], expectedResult: 'two'},

		// #4
		{originalClass: 'one two', args: ['two'], expectedResult: 'one'},

		// #5
		{originalClass: 'one two', args: ['three'], expectedResult: 'one two three'},

		// #6
		{originalClass: 'one two', args: ['two three'], expectedResult: 'one three'},

		// #7
		{originalClass: 'one two', args: ['three one'], expectedResult: 'three two'},

		// #8
		{originalClass: 'one two', args: ['one two'], expectedResult: ''},

		// #9
		{originalClass: 'one two', args: ['two one'], expectedResult: ''},

		// #10
		{originalClass: 'one two', args: ['three four'], expectedResult: 'one two three four'},

		// #11
		{originalClass: 'class', args: ['class', true], expectedResult: 'class'},

		// #12
		{originalClass: 'class', args: ['class', false], expectedResult: ''},

		// #13
		{originalClass: '', args: ['class', true], expectedResult: 'class'},

		// #14
		{originalClass: '', args: ['class', false], expectedResult: ''}
	];

	for (var i = 0; i < tests.length; i++) {
		var test = tests[i];
		element.className = test.originalClass;
		element.toggleClass.apply(element, test.args);
		assert.ok(areClassNamesEquivalent(element.className, test.expectedResult), '#' + (i + 1));
	}

	element.className = 'one two';
	element.toggleClass();
	assert.equal(element.className, '',
		'Toggles the entire class name when not passed any arguments (removing).');

	element.toggleClass();
	assert.equal(element.className, 'one two',
		'Toggles the entire class name when not passed any arguments (adding).');

	element.toggleClass(true);
	assert.equal(element.className, 'one two',
		'Toggles the entire class name when not passed any arguments (force adding, nothing to do).');

	element.toggleClass(false);
	assert.equal(element.className, '',
		'Toggles the entire class name when not passed any arguments (force removing).');

	element.toggleClass(false);
	assert.equal(element.className, '',
		'Toggles the entire class name when not passed any arguments (force removing, nothing to do).');

	element.toggleClass(true);
	assert.equal(element.className, 'one two',
		'Toggles the entire class name when not passed any arguments (force adding).');
});