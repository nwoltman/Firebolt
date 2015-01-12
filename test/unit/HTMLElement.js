/**
 * Unit tests for HTMLElement
 */

// References for Resharper
/// <reference path="../node_modules/qunitjs/qunit/qunit.js"/>
/// <reference path="../../src/firebolt.js"/>

QUnit.module('HTMLElement.prototype');

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
		assert.equal(element.className, test.expectedResult, '#' + (i + 1));
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
		assert.equal(element.className, test.expectedResult, '#' + (i + 1));
	}
});
