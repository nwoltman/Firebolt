/**
 * Unit tests for Object
 */

// References for Resharper
/// <reference path="../node_modules/qunitjs/qunit/qunit.js"/>
/// <reference path="../../src/firebolt.js"/>

QUnit.module('Object');

QUnit.test('each', function(assert) {
  assert.expect(9);

  var seen = {};
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

  var i = [{}, []];
  Object.each(i, function(v, k, a) {
    assert.strictEqual(this, v, k + ' - `this` equals the first argument to the callback.');
    assert.strictEqual(i, a, k + ' - The third argument to the callback is the object.');
  });

  assert.strictEqual(Object.each(i, function() { }), i, 'Returns the object.');
});

QUnit.test('getClassOf', function(assert) {
  /* jshint -W053, -W054 */

  assert.expect(19);
  
  assert.ok(Object.getClassOf([]) === 'Array', 'Gets the class of an array.');
  
  assert.ok(Object.getClassOf(false) === 'Boolean', 'Gets the class of a boolean literal.');

  assert.ok(Object.getClassOf(new Boolean()) === 'Boolean', 'Gets the class of a constructed boolean.');

  assert.ok(Object.getClassOf(new Date()) === 'Date', 'Gets the class of a Date object.');

  assert.ok(Object.getClassOf(new Error()) === 'Error', 'Gets the class of an Error object.');
  
  assert.ok(Object.getClassOf(function() { }) === 'Function', 'Gets the class of a function literal.');

  assert.ok(Object.getClassOf(new Function()) === 'Function', 'Gets the class of a constructed function.');
  
  assert.ok(Object.getClassOf(JSON) === 'JSON', 'Gets the class of the JSON object.');

  assert.ok(Object.getClassOf(Math) === 'Math', 'Gets the class of the Math object.');

  assert.ok(Object.getClassOf(document.body.childNodes) === 'NodeList', 'Gets the class of a NodeList.');
  
  assert.ok(Object.getClassOf(null) === 'Null', 'Get the the class of `null`.');
  
  assert.ok(Object.getClassOf(1) === 'Number', 'Gets the class of a number literal.');
  
  assert.ok(Object.getClassOf(Infinity) === 'Number', 'Gets the class of `infinity`.');

  assert.ok(Object.getClassOf(new Number()) === 'Number', 'Gets the class of a constructed number.');

  assert.ok(Object.getClassOf({}) === 'Object', 'Gets the class of a plain object literal.');

  function MyClass() { }
  assert.ok(Object.getClassOf(new MyClass()) === 'Object', 'Gets the class of a constructed, custom object.');

  assert.ok(Object.getClassOf(/^.+reg/) === 'RegExp', 'Gets the class of a RegExp literal.');

  assert.ok(Object.getClassOf(new RegExp('regex')) === 'RegExp', 'Gets the class of a RegExp object.');

  assert.ok(Object.getClassOf(undefined) === 'Undefined', 'Gets the class of `undefined`.');
});
