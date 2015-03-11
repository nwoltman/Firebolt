QUnit.module('data');

QUnit.test('Firebolt.data()', function(assert) {
  var object = {};
  var dataStore = Firebolt.data(object);

  assert.ok(Firebolt.isPlainObject(dataStore) && Firebolt.isEmptyObject(dataStore),
    'When passed just an object, returns its data store object.');

  assert.ok(Firebolt.isEmptyObject(object),
    'Defines the data store at a non-enumerable property on the specifed object');

  assert.strictEqual(Firebolt.data(object, 'a', 1), object,
    'Returns the passed in object when setting properties.');

  assert.strictEqual(dataStore.a, 1, 'Can store data properties.');

  Firebolt.data(object, { b: 'b', c: null });
  assert.deepEqual(dataStore, { a: 1, b: 'b', c: null }, 'Can store multiple properties at once.');

  assert.strictEqual(Firebolt.data(object, 'a'), 1, 'Can retrieve previously set properties.');

  var element = Firebolt.elem('div', { 'data-stuff': 23 });
  dataStore = Firebolt.data(element, undefined, undefined, 1);

  assert.strictEqual(dataStore.stuff, 23,
    'Adds data from custom "data-*" attributes on elements to the data store and parses the data to the correct JavaScript type.');

  assert.strictEqual(Firebolt.data(element, 'stuff', undefined, 1), 23,
    'Can retrieve data in custom "data-*" attributes on an element as the correct JavaScript type.');

  Firebolt.data(element, 'stuff', ['a', 'b'], 1);
  assert.deepEqual(dataStore.stuff, ['a', 'b'],
    'Overwrites data retrieved from custom "data-*" attributes on an element when new data with the same key is set.');

  delete dataStore.stuff;
  assert.strictEqual(Firebolt.data(element, undefined, undefined, 1).stuff, undefined,
    'When retrieving the data store object, it will not have any data at a key that was recently removed.');

  assert.strictEqual(Firebolt.data(element, 'stuff', undefined, 1), 23,
    'Retrieves "data-*" attributes data when it is being retrieved specifically by name and there is currently no data with the same name.');

  assert.strictEqual(Firebolt.data(element, undefined, undefined, 1).stuff, 23,
    'Adds data retrieved from custom "data-*" attributes to the data store object.');

  element = Firebolt.elem('div', { 'data-a': '100.000', 'data-b': '1E02', 'data-c': '19.' });
  dataStore = Firebolt.data(element, undefined, undefined, 1);
  assert.ok(dataStore.a === '100.000' && dataStore.b === '1E02' && dataStore.c === '19.',
    'Retrieves numeric values as strings if their numeric representation would look different from the string representation.');
});

QUnit.test('Firebolt.hasData()', function(assert) {
  var object = {};

  assert.strictEqual(Firebolt.hasData(object), false,
    'Correctly reports that an object without Firebolt data does not have data.');

  Firebolt.data(object, 'a', 0);
  assert.strictEqual(Firebolt.hasData(object), true,
    'Correctly reports that an object with Firebolt data has data.');

  Firebolt.removeData(object, 'a');
  assert.strictEqual(Firebolt.hasData(object), false,
    'Correctly reports that an object that used to have Firebolt data does not have data.');

  object = Firebolt.elem('div', { 'data-stuff': 23 });
  assert.strictEqual(Firebolt.hasData(object), false,
    'Correctly reports that an element that has not had the $.data() function called on it yet does not have data.');

  Firebolt.data(object, undefined, undefined, 1);
  assert.strictEqual(Firebolt.hasData(object), true,
    'Correctly reports that an element with data pulled from a "data-*" attribute has data.');
});

QUnit.test('Firebolt.removeData()', function(assert) {
  var object = {};
  var testData = { a: 1, b: 2, c: 3 };
  var dataStore = Firebolt.data(object, testData);

  Firebolt.removeData(object, 'a');
  assert.ok(!('a' in dataStore), 'Removes a single piece of data.');

  Firebolt.data(object, testData);
  Firebolt.removeData(object, 'a b');
  assert.ok(!('a' in dataStore) && !('b' in dataStore),
    'Removes multiple pieces of data when given a space-separated string.');

  Firebolt.data(object, testData);
  Firebolt.removeData(object, ['b', 'c']);
  assert.ok(!('b' in dataStore) && !('c' in dataStore),
    'Removes multiple pieces of data when given an array of strings.');

  Firebolt.data(object, testData);
  Firebolt.removeData(object);
  assert.ok(Firebolt.isEmptyObject(dataStore), 'Removes all data when called with no specified values.');

  object = Firebolt.elem('div', { 'data-test': true });
  dataStore = Firebolt.data(object, undefined, undefined, 1);
  Firebolt.removeData(object, 'test');
  assert.ok(!('test' in dataStore), 'Removes a single piece of data that was pulled from a "data-*" attribute.');
});

QUnit.test('Element#data()', function(assert) {
  var el = document.createElement('div');
  var key = 'key';
  var value = 'value';
  var data = Firebolt.data;

  // Spy on Firebolt.data()
  Firebolt.data = function(_obj, _key, _value, _isElement) {
    assert.strictEqual(_obj, el);
    assert.strictEqual(_key, key);
    assert.strictEqual(_value, value);
    assert.strictEqual(_isElement, 1);

    return 'retVal';
  };

  assert.strictEqual(el.data(key, value), 'retVal', 'Returns what Firebolt.data() returns.');

  // Restore the function
  Firebolt.data = data;
});

QUnit.test('Element#removeData()', function(assert) {
  var el = document.createElement('div');
  var key = 'key';
  var removeData = Firebolt.removeData;

  // Spy on Firebolt.removeData()
  Firebolt.removeData = function(_obj, _key) {
    assert.strictEqual(_obj, el);
    assert.strictEqual(_key, key);
  };

  assert.strictEqual(el.removeData(key), el, 'Returns the element.');

  // Restore the function
  Firebolt.removeData = removeData;
});
