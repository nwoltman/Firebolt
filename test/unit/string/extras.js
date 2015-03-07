/**
 * Unit tests for the string/extras module
 */

// References for Resharper
/// <reference path="../node_modules/qunitjs/qunit/qunit.js"/>
/// <reference path="../../src/firebolt.js"/>

QUnit.module('string/extras');

QUnit.test('String#appendParams', function(assert) {
  var url = 'www.fireboltjs.com';

  url = url.appendParams('p1=a');
  assert.equal(url, 'www.fireboltjs.com?p1=a',
    'Correctly appends parameters to a url that has no query string.');

  assert.equal(url.appendParams('p2=b'), 'www.fireboltjs.com?p1=a&p2=b',
    'Correctly appends parameters to a url that already has a query string.');
});

QUnit.test('String#escapeHTML', function(assert) {
  assert.equal('<img src="site.com" data-a="a&b\'c" />'.escapeHTML(), '&lt;img src="site.com" data-a="a&amp;b\'c" /&gt;',
    'Escapes "<", ">", and "&".');

  assert.equal('  a& \n\t  '.escapeHTML(), '  a&amp; \n\t  ', 'Preserves whitespace.');
});

QUnit.test('String#toCamelCase', function(assert) {
  assert.equal('background-color'.toCamelCase(), 'backgroundColor',
    'correctly converts "background-color" to camelCase.');

  assert.equal('z-index'.toCamelCase(), 'zIndex',
    'correctly converts "z-index" to camelCase.');

  assert.equal('-moz-osx-font-smoothing'.toCamelCase(), 'MozOsxFontSmoothing',
    'correctly converts "-moz-osx-font-smoothing" to camelCase.');
});

QUnit.test('String#tokenize', function(assert) {
  assert.deepEqual('The boy who lived.'.tokenize(), ['The', 'boy', 'who', 'lived.'],
    'Tokenizes a simple string.');

  assert.deepEqual('class1\nclass2\t class3 '.tokenize(), ['class1', 'class2', 'class3'],
    'Tokenizes an ill-formated class name string.');

  assert.deepEqual(''.tokenize(), [],
    'Returns an empty array when tokenizing an empty string.');

  assert.deepEqual('\n   \t\r'.tokenize(), [],
    'Returns an empty array when tokenizing a string made up of only whitespace.');
});

QUnit.test('String#unescapeHTML', function(assert) {
  assert.equal('&lt;img src="site.com" data-a="a&amp;b\'c" /&gt;'.unescapeHTML(), '<img src="site.com" data-a="a&b\'c" />',
    'Unescapes "<", ">", and "&".');

  assert.equal('  a&amp; \n\t  '.unescapeHTML(), '  a& \n\t  ', 'Preserves whitespace.');
});
