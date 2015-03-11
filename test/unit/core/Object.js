QUnit.module('core/Object');

QUnit.test('.each', function(assert) {
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

QUnit.test('.getClassOf', function(assert) {
  /* jshint -W053, -W054 */

  assert.expect(17);

  assert.equal(Object.getClassOf([]), 'Array', 'Gets the class of an array.');

  assert.equal(Object.getClassOf(false), 'Boolean', 'Gets the class of a boolean literal.');

  assert.equal(Object.getClassOf(new Boolean()), 'Boolean', 'Gets the class of a constructed boolean.');

  assert.equal(Object.getClassOf(new Date()), 'Date', 'Gets the class of a Date object.');

  assert.equal(Object.getClassOf(new Error()), 'Error', 'Gets the class of an Error object.');

  assert.equal(Object.getClassOf(function() { }), 'Function', 'Gets the class of a function literal.');

  assert.equal(Object.getClassOf(new Function()), 'Function', 'Gets the class of a constructed function.');

  assert.equal(Object.getClassOf(JSON), 'JSON', 'Gets the class of the JSON object.');

  assert.equal(Object.getClassOf(Math), 'Math', 'Gets the class of the Math object.');

  assert.equal(Object.getClassOf(document.body.childNodes), 'NodeList', 'Gets the class of a NodeList.');

  assert.equal(Object.getClassOf(1), 'Number', 'Gets the class of a number literal.');

  assert.equal(Object.getClassOf(Infinity), 'Number', 'Gets the class of `infinity`.');

  assert.equal(Object.getClassOf(new Number()), 'Number', 'Gets the class of a constructed number.');

  assert.equal(Object.getClassOf({}), 'Object', 'Gets the class of a plain object literal.');

  function MyClass() { }
  assert.equal(Object.getClassOf(new MyClass()), 'Object', 'Gets the class of a constructed, custom object.');

  assert.equal(Object.getClassOf(/^.+reg/), 'RegExp', 'Gets the class of a RegExp literal.');

  assert.equal(Object.getClassOf(new RegExp('regex')), 'RegExp', 'Gets the class of a RegExp object.');
});
