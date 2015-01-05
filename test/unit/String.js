/**
 * Unit tests for String.prototype
 */

// References for Resharper
/// <reference path="../node_modules/qunitjs/qunit/qunit.js"/>
/// <reference path="../../src/firebolt.js"/>

QUnit.module('String.prototype');

QUnit.test('appendParams', function(assert) {
	var url = 'www.fireboltjs.com';

	url = url.appendParams('p1=a');
	assert.equal(url, 'www.fireboltjs.com?p1=a',
		'Correctly appends parameters to a url that has no query string.');

	assert.equal(url.appendParams('p2=b'), 'www.fireboltjs.com?p1=a&p2=b',
		'Correctly appends parameters to a url that already has a query string.');
});

QUnit.test('contains', function(assert) {
	var str = 'Winter is coming.';

	// True
	assert.strictEqual(str.contains(' is '), true, 'Reports that a substring is in the string.');

	assert.strictEqual(str.contains('Wint'), true, 'Reports that the beginning of the string is in the string.');

	assert.strictEqual(str.contains(' coming.'), true, 'Reports that the end of the string is in the string.');

	assert.strictEqual(str.contains(str), true, 'Reports that the string contains itself');

	// False
	assert.strictEqual(str.contains('Summer is'), false, 'Reports that a non-substring is not in the string.');

	assert.strictEqual(str.contains(' is ', 7), false,
		'Reports that a substring is not in the string if the `position` parameter is a large enough value.');
});

QUnit.test('endsWith', function(assert) {
	var str = 'Who am I, Gamling?';

	// True
	assert.strictEqual(str.endsWith('Gamling?'), true);             // 1
	assert.strictEqual(str.endsWith('Gamling?', 99), true);         // 2
	assert.strictEqual(str.endsWith('Gamling?', str.length), true); // 3
	assert.strictEqual(str.endsWith('am I', 8), true);              // 4
	assert.strictEqual(str.endsWith('a', 5), true);                 // 5

	// False
	assert.strictEqual(str.endsWith('Gamling?', -1), false); // 6
	assert.strictEqual(str.endsWith('am I'), false);         // 7
	assert.strictEqual(str.endsWith('am I', 9), false);      // 8
	assert.strictEqual(str.endsWith('am I', 7), false);      // 9
	assert.strictEqual(str.endsWith('a', 6), false);         // 10
	assert.strictEqual(str.endsWith('a', 4), false);         // 11
	assert.strictEqual(str.endsWith(str + 'a'), false);      // 12
	assert.strictEqual(str.endsWith('?', 0), false);         // 13
});

QUnit.test('escapeHTML', function(assert) {
	assert.equal('<img src="site.com" data-a="a&b\'c" />'.escapeHTML(), '&lt;img src="site.com" data-a="a&amp;b\'c" /&gt;',
		'Escapes "<", ">", and "&".');

	assert.equal('  a& \n\t  '.escapeHTML(), '  a&amp; \n\t  ', 'Preserves whitespace.');
});

QUnit.test('repeat', function(assert) {
	var str = 'abc';

	// Test return value
	assert.strictEqual(str.repeat(), '', 'Returns an empty string when no input is given.');

	assert.strictEqual(str.repeat('a'), '', 'Returns an empty string when non-number is given.');

	assert.strictEqual(str.repeat(0), '', 'Returns an empty string when given 0 as input.');

	assert.strictEqual(str.repeat(1), str, 'Returns the original string when given 1 as input.');

	assert.strictEqual(str.repeat(3), 'abcabcabc', 'Correctly repeats the string the specified number of times.');

	assert.strictEqual(str.repeat(2.5), 'abcabc', 'Rounds down the input number before repeating the string.');

	// Test for throwing errors
	assert.throws(function() {
		str.repeat(-1);
	}, RangeError, 'Thows a RangeError when given a negative number as input.');

	assert.throws(function() {
		str.repeat(1/0);
	}, RangeError, 'Thows a RangeError when given infinity as input.');


	/* The following tests will only work if the browser supports strict mode */

	var strict = (function() { 'use strict'; return !this; })();
	if (!strict) return; // Return if strict mode is not supported

	assert.throws(function() {
		String.prototype.repeat.call(null);
	}, TypeError, 'Throws a TypeError when called on null.');

	assert.throws(function() {
		String.prototype.repeat.call(undefined);
	}, TypeError, 'Throws a TypeError when called on undefined.');
});

QUnit.test('startsWith', function(assert) {
	var str = 'Who am I, Gamling?';

	// True
	assert.strictEqual(str.startsWith('Who'), true);      // 1
	assert.strictEqual(str.startsWith('am I', 4), true);  // 2

	// False
	assert.strictEqual(str.startsWith('Who are'), false); // 3
	assert.strictEqual(str.startsWith('am I'), false);    // 4
});

QUnit.test('tokenize', function(assert) {
	assert.deepEqual('The boy who lived.'.tokenize(), ['The', 'boy', 'who', 'lived.'],
		'Tokenizes a simple string.');

	assert.deepEqual('class1\nclass2\t class3 '.tokenize(), ['class1', 'class2', 'class3'],
		'Tokenizes an ill-formated class name string.');

	assert.deepEqual(''.tokenize(), [],
		'Returns an empty array when tokenizing an empty string.');

	assert.deepEqual('\n   \t\r'.tokenize(), [],
		'Returns an empty array when tokenizing a string made up of only whitespace.');
});

QUnit.test('unescapeHTML', function(assert) {
	assert.equal('&lt;img src="site.com" data-a="a&amp;b\'c" /&gt;'.unescapeHTML(), '<img src="site.com" data-a="a&b\'c" />',
		'Unescapes "<", ">", and "&".');

	assert.equal('  a&amp; \n\t  '.unescapeHTML(), '  a& \n\t  ', 'Preserves whitespace.');
});
