/**
 * Unit tests for String.prototype
 */

// References for Resharper
/// <reference path="../qunit/qunit.js"/>
/// <reference path="../../src/firebolt.js"/>

module('String.prototype');

test('appendParams', function() {
	var url = 'www.fireboltjs.com';

	url = url.appendParams('p1=a');
	equal(url, 'www.fireboltjs.com?p1=a',
		'Correctly appends parameters to a url that has no query string.');

	equal(url.appendParams('p2=b'), 'www.fireboltjs.com?p1=a&p2=b',
		'Correctly appends parameters to a url that already has a query string.');
});

test('contains', function() {
	var str = 'Winter is coming.';

	// True
	strictEqual(str.contains(' is '), true, 'Reports that a substring is in the string.');

	strictEqual(str.contains('Wint'), true, 'Reports that the beginning of the string is in the string.');

	strictEqual(str.contains(' coming.'), true, 'Reports that the end of the string is in the string.');

	strictEqual(str.contains(str), true, 'Reports that the string contains itself');

	// False
	strictEqual(str.contains('Summer is'), false, 'Reports that a non-substring is not in the string.');

	strictEqual(str.contains(' is ', 7), false,
		'Reports that a substring is not in the string if the `position` parameter is a large enough value.');
});

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
	var str = 'abc';

	//Test return value
	strictEqual(str.repeat(), '', 'Returns an empty string when no input is given.');

	strictEqual(str.repeat(0), '', 'Returns an empty string when given 0 as input.');

	strictEqual(str.repeat(1), str, 'Returns the original string when given 1 as input.');

	strictEqual(str.repeat(3), 'abcabcabc', 'Correctly repeats the string the specified number of times.');

	strictEqual(str.repeat(2.5), 'abcabc', 'Rounds down the input number before repeating the string.');

	//Test for throwing errors
	throws(function() {
		str.repeat(-1);
	}, RangeError, 'Thows a RangeError when given a negative number as input.');

	throws(function() {
		str.repeat(1/0);
	}, RangeError, 'Thows a RangeError when given infinity as input.');
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

test('tokenize', function() {
	deepEqual('The boy who lived.'.tokenize(), ['The', 'boy', 'who', 'lived.'], 'Tokenizes a simple string.');

	deepEqual('class1\nclass2\t class3 '.tokenize(), ['class1', 'class2', 'class3'], 'Tokenizes an ill-formated class name string.');

	deepEqual(''.tokenize(), [], 'Returns an empty array when tokenizing an empty string.');

	deepEqual('\n   \t\r'.tokenize(), [], 'Returns an empty array when tokenizing a string made up of only whitespace.');
});

test('unescapeHTML', function() {
	equal('&lt;img src="site.com" data-a="a&amp;b\'c" /&gt;'.unescapeHTML(), '<img src="site.com" data-a="a&b\'c" />',
		'Unescapes "<", ">", and "&".');

	equal('  a&amp; \n\t  '.unescapeHTML(), '  a& \n\t  ', 'Preserves whitespace.');
});
