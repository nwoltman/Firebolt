/**
 * Unit tests for String.prototype
 */

// References for Resharper
/// <reference path="../qunit/qunit.js"/>
/// <reference path="../../src/firebolt.js"/>

module('String.prototype');

test('endsWith', function() {
	var str = 'Who am I, Gamling?';

	//True
	strictEqual(str.endsWith('Gamling?'), true);             // 1
	strictEqual(str.endsWith('Gamling?', 99), true);         // 2
	strictEqual(str.endsWith('Gamling?', str.length), true); // 3
	strictEqual(str.endsWith('am I', 8), true);              // 4
	strictEqual(str.endsWith('a', 5), true);                 // 5

	//False
	strictEqual(str.endsWith('Gamling?', -1), false); // 6
	strictEqual(str.endsWith('am I'), false);         // 7
	strictEqual(str.endsWith('am I', 9), false);      // 8
	strictEqual(str.endsWith('am I', 7), false);      // 9
	strictEqual(str.endsWith('a', 6), false);         // 10
	strictEqual(str.endsWith('a', 4), false);         // 11
	strictEqual(str.endsWith(str + 'a'), false);      // 12
	strictEqual(str.endsWith('?', 0), false);         // 13
});

test('escapeHTML', function() {
	equal('<img src="site.com" data-a="a&b\'c" />'.escapeHTML(), '&lt;img src="site.com" data-a="a&amp;b\'c" /&gt;',
		'Escapes "<", ">", and "&".');

	equal('  a& \n\t  '.escapeHTML(), '  a&amp; \n\t  ', 'Preserves whitespace.');
});

test('repeat', function() {
	expect(7);

	var str = 'abc';

	//Test return value
	strictEqual(str.repeat(), '', 'Returns an empty string when no input is given.');
	strictEqual(str.repeat(0), '', 'Returns an empty string when given 0 as input.');
	strictEqual(str.repeat(1), str, 'Returns the original string when given 1 as input.');
	strictEqual(str.repeat(3), 'abcabcabc', 'Correctly repeats the string the specified number of times.');
	strictEqual(str.repeat(2.5), 'abcabc', 'Rounds down the input number before repeating the string.');

	//Test for throwing errors
	try {
		str.repeat(-1);
	}
	catch (e) {
		ok(true, 'Thows an error when given a negative number as input.');
	}

	try {
		str.repeat(1/0);
	}
	catch (e) {
		ok(true, 'Thows an error when given infinity as input.');
	}
});

test('startsWith', function() {
	var str = 'Who am I, Gamling?';

	//True
	strictEqual(str.startsWith('Who'), true);      // 1
	strictEqual(str.startsWith('am I', 4), true);  // 2

	//False
	strictEqual(str.startsWith('Who are'), false); // 3
	strictEqual(str.startsWith('am I'), false);    // 4
});

test('unescapeHTML', function() {
	equal('&lt;img src="site.com" data-a="a&amp;b\'c" /&gt;'.unescapeHTML(), '<img src="site.com" data-a="a&b\'c" />',
		'Unescapes "<", ">", and "&".');

	equal('  a&amp; \n\t  '.unescapeHTML(), '  a& \n\t  ', 'Preserves whitespace.');
});
