/**
 * Unit tests for AJAX functionality
 */

// References for Resharper
/// <reference path="../node_modules/qunitjs/qunit/qunit.js"/>
/// <reference path="../../src/firebolt.js"/>

QUnit.module('ajax/shared');

QUnit.test('Firebolt.ajaxSetup()', function(assert) {
  var ajaxSettings = Firebolt.ajaxSetup(),
    testObject = {
      a: [1, 2, 3],
      b: false,
      c: 0,
      d: {inner: 24}
    };

  Firebolt.ajaxSetup({test: 1});
  assert.strictEqual(ajaxSettings.test, 1, 'Extends the AJAX settings object.');

  Firebolt.ajaxSetup({test: testObject});
  assert.deepEqual(ajaxSettings.test, testObject, 'Deep-extends the AJAX settings object.');
  assert.notEqual(ajaxSettings.test, testObject);
});
