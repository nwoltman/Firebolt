/**
 * Unit tests for Globals
 */

// References for Resharper
/// <reference path="../node_modules/qunitjs/qunit/qunit.js"/>
/// <reference path="../../src/firebolt.js"/>

QUnit.module('core/Globals');

QUnit.test('FB', function(assert) {
  assert.equal(window.FB, Firebolt, 'window.FB === Firebolt');
});

QUnit.test('$', function(assert) {
  assert.equal(window.$, Firebolt, 'window.$ === Firebolt');
});

QUnit.test('$$', function(assert) {
  assert.equal(window.$$('qunit'), document.getElementById('qunit'),
    'Acts as an alias for document.getElementById');
});

QUnit.test('$1', function(assert) {
  var selectors = {
    id: '#qunit',
    nonExistantId: '#fake',
    tagName: 'div',
    nonExistantTagName: 'fake',
    className: '.class1',
    nonExistantClassName: '.fake',
    multipleClassNames: '.class1.first',
    attribute: '[src]',
    randomQuerySelector: 'body > div, script'
  };

  for (var selectorType in selectors) {
    var selector = selectors[selectorType];
    var result = window.$1(selector);
    var expected = document.querySelector(selector);

    assert.equal(result, expected, 'Correctly selects an element by ' + selectorType + '.');
  }

  var element = window.$1('<div>content</div><p>hmm<span>col</span></p>');
  assert.ok(element instanceof HTMLDivElement && element.parentNode === null,
    'Creates a single element when the first character in the string is a "<".');
});

QUnit.test('$CLS', function(assert) {
  var result = window.$CLS('class1');
  var expected = document.getElementsByClassName('class1');
  assert.ok(result.constructor === expected.constructor && result.equals(expected),
    'Acts as an alias for document.getElementsByClassName');
});

QUnit.test('$ID', function(assert) {
  assert.equal(window.$ID, window.$$, 'Is an alias of `window.$$`.');
});

QUnit.test('$NAME', function(assert) {
  var result = window.$NAME('name1');
  var expected = document.getElementsByName('name1');
  assert.ok(result.constructor === expected.constructor && result.equals(expected),
    'Acts as an alias for document.getElementsByName');
});

QUnit.test('$QS', function(assert) {
  assert.equal(window.$QS('#qunit'), document.querySelector('#qunit'),
    'Acts as an alias for document.querySelector');
});

QUnit.test('$QSA', function(assert) {
  var result = window.$QSA('body > div');
  var expected = document.querySelectorAll('body > div');
  assert.ok(result.constructor === expected.constructor && result.equals(expected),
    'Acts as an alias for document.querySelectorAll');
});

QUnit.test('$TAG', function(assert) {
  var result = window.$TAG('div');
  var expected = document.getElementsByTagName('div');
  assert.ok(result.constructor === expected.constructor && result.equals(expected),
    'Acts as an alias for document.getElementsByTagName');
});
