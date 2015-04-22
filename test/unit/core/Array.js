QUnit.module('core/Array');

QUnit.test('.from', function(assert) {
  var arrayLike = {0: 'a', 1: 'b', length: 2};
  var result = Array.from(arrayLike);

  assert.ok(Array.isArray(result) && result.constructor === Array, 'Returns a true array.');
  assert.ok(result.length === 2 && result[0] === 'a' && result[1] === 'b',
    'Correctly creates an array from the input array-like object.');

  assert.strictEqual(Array.from(1).length, 0, 'Creates an empty array when passed a non-object.');

  assert.throws(function() {
    Array.from();
  }, TypeError, 'Throws a type error when the `arrayLike` argument is undefined.');

  assert.throws(function() {
    Array.from(null);
  }, TypeError, 'Throws a type error when the `arrayLike` argument is null.');
});

QUnit.test('.of', function(assert) {
  var result = Array.of(1, 'a', null);

  assert.ok(Array.isArray(result) && result.constructor === Array, 'Returns a true array.');
  assert.deepEqual(result, [1, 'a', null], 'Correctly creates an array from the input arguments.');

  assert.deepEqual(Array.of(), [], 'Returns an empty array when called with no arguments.');
});

QUnit.test('#clean', function(assert) {
  function isClean(array) {
    return array.every(function(item) {
      return !Firebolt.isEmpty(item);
    });
  }

  var origArray = [function() {}, 1, null, 0, '', 'str', undefined, false, {}, [], true, {notEmpty: true}, {}];
  var cleanArray = origArray.clean();
  assert.ok(isClean(cleanArray), 'Cleans an array with both empty and not-empty items.');
  assert.deepEqual(cleanArray, [origArray[0], 1, 0, 'str', false, true, origArray[11]],
    'Preserves the order of non-empty items.');

  origArray = [undefined, [], null, '', {}];
  cleanArray = origArray.clean();
  assert.deepEqual(cleanArray, [], 'Returns an empty array when cleaning an array with only empty items.');

  origArray = [Firebolt.elem('div'), 100, -1, 0, false, true, 'random string', {notEmpty: true}, [1, 'a']];
  cleanArray = origArray.clean();
  assert.ok(isClean(cleanArray), 'Cleans an array with both no empty items.');
  assert.ok(cleanArray != origArray && cleanArray.equals(origArray),
    'Returns a clone of an array with no empty items.');
});

QUnit.test('#clear', function(assert) {
  var array = [1, 2, 3];

  array.clear();

  assert.ok(array.length === 0, 'Cleared array has no length.');
  assert.ok(array[0] === undefined && array[1] === undefined && array[3] === undefined,
    'Items are no longer in the array (the indices where the items used to be are now undefined).');
});

QUnit.test('#clone', function(assert) {
  var origArray = [1, 99, '', {}, ['a', 'b'], false, /regex/],
    clonedArray = origArray.clone();

  assert.notEqual(clonedArray, origArray, 'Cloned array is not the same as the original array.');
  assert.deepEqual(clonedArray, origArray, 'Cloned array contains the same items as the original array.');
});

QUnit.test('#diff', function(assert) {
  var array = [1, 2, 3, 4, 5, 2];

  assert.deepEqual(array.diff(), array, 'Returns a clone when called with no parameters.');

  assert.deepEqual(array.diff([5, 2, 10]), [1, 3, 4],
    'Correctly performs a set difference when given one array as input.');

  assert.deepEqual(array.diff([5, 2], [1, 4]), [3],
    'Correctly performs a set difference when given multiple arrays as input.');

  assert.deepEqual((function() {
    return array.diff(arguments);
  })(1, 2, 5), [3, 4], 'Correctly performs a set difference when given an array-like object as input.');
});

QUnit.test('#each', function(assert) {
  assert.expect(9);

  var seen = {};
  [3, 4, 5].each(function(v, k) {
    seen[k] = v;
  });
  assert.deepEqual(seen, {'0': 3, '1': 4, '2': 5}, 'Array iteration');

  seen = [];
  [1, 2, 3].each(function(v, k) {
    seen.push(v);
    if (k === 1) {
      return false;
    }
  });
  assert.deepEqual(seen, [1, 2], 'Broken iteration');

  var i = [{}, []];
  i.each(function(v, k, a) {
    assert.strictEqual(this, v, k + ' - `this` equals the first argument to the callback.');
    assert.strictEqual(i, a, k + ' - The third argument to the callback is the array.');
  });

  assert.strictEqual(i.each(function() {}), i, 'Returns the array.');

  document.querySelectorAll('body').each(function(v) {
    assert.strictEqual(v, document.body, 'Works on the prototype of NodeList');
  });

  i = 0;
  Array.prototype.each.call(document.styleSheets, function() {
    i++;
  });
  assert.equal(i, document.styleSheets.length, 'Iteration over document.styleSheets');
});

QUnit.test('#equals', function(assert) {
  var array = [1, 2, 3];

  assert.ok(array.equals(array), 'Reports that an array equals itself.');

  assert.ok(array.equals([1, 2, 3]),
    'Reports that an array equals another array with the same values.');

  assert.ok(!array.equals([3, 2, 1]),
    'Reports that an array does not equal another array with the same values but in another order.');

  assert.ok(!array.equals([1, 2]),
    'Reports that an array does not equal another that has a different length.');

  assert.ok((function() {
    return array.equals(arguments);
  })(1, 2, 3), 'Reports that an array equals another array-like object with the same values.');

  assert.throws(array.equals, TypeError, 'Throws a TypeError when executed with undefined input.');
});

QUnit.test('#get', function(assert) {
  var array = ['a', 'b', 'c'];

  assert.ok(array.get(0) === 'a', 'Get first item with positive index.');
  assert.ok(array.get(1) === 'b', 'Get middle item with positive index.');
  assert.ok(array.get(2) === 'c', 'Get last item with positive index.');
  assert.ok(array.get(3) === undefined, 'Get no item with positive out-of-range index.');
  assert.ok(array.get(-1) === 'c', 'Get last item with negative index.');
  assert.ok(array.get(-2) === 'b', 'Get middle item with negative index.');
  assert.ok(array.get(-3) === 'a', 'Get first item with negative index.');
  assert.ok(array.get(-4) === undefined, 'Get no item with out-of-range negative index.');
});

QUnit.test('#includes', function(assert) {
  var array = ['a', 'b'];

  assert.strictEqual(array.includes('a'), true,
    'Correctly reports that an item in the array is in the array.');

  assert.strictEqual(array.includes('c'), false,
    'Correctly reports that an item not in the array is not in the array.');

  assert.strictEqual(array.includes(), false,
    'Returns `false` when called with no arguments.');

  var arrayLike = {0: 'a', 1: 'b', length: 2};
  var includes = Array.prototype.includes;
  assert.ok(includes.call(arrayLike, 'b') === true && includes.call(arrayLike, 'c') === false,
    'Works when called on array-like objects.');
});

QUnit.test('#intersect', function(assert) {
  var array = [1, 2, 3];

  assert.deepEqual(array.intersect(), array, 'Returns a clone when called with no parameters.');

  assert.deepEqual(array.intersect([2, 3, 4]), [2, 3],
    'Correctly performs a set intersection when given one array as input.');

  assert.deepEqual(array.intersect([107, 1, 50, 2], [2, 1]), [1, 2],
    'Correctly performs a set intersection when given multiple arrays as input.');

  assert.deepEqual((function() {
    return array.intersect(arguments);
  })(5, 2, 1), [1, 2], 'Correctly performs a set intersection when given an array-like object as input.');
});

QUnit.test('#remove', function(assert) {
  var array = [1, 2, 3, 3, 4, 3];

  var retArray = array.remove(2);
  assert.strictEqual(array, retArray, 'Returns the array.');
  assert.deepEqual(array, [1, 3, 3, 4, 3], 'Can remove a single item from the array.');

  assert.deepEqual(array.remove(3), [1, 4], 'Removes all instances of the input value.');

  assert.deepEqual(array.remove(2), [1, 4], 'Removes nothing if the specified value is not in the array.');

  assert.deepEqual(array.remove(1, 4), [], 'Removes all instances of each input value.');
});

QUnit.test('#union', function(assert) {
  var array = [1, 2, 3];

  assert.deepEqual(array.union(), array, 'Returns a clone when called with no parameters.');

  assert.deepEqual(array.union([2, 3, 4, 5]), [1, 2, 3, 4, 5],
    'Correctly performs a set union when given one array as input.');

  assert.deepEqual(array.union([3, 4], [50, 9]), [1, 2, 3, 4, 50, 9],
    'Correctly performs a set union when given multiple arrays as input.');

  assert.deepEqual((function() {
    return array.union(arguments);
  })(2, 3, 4, 5), [1, 2, 3, 4, 5], 'Correctly performs a set union when given an array-like object as input.');
});

QUnit.test('#uniq', function(assert) {
  assert.deepEqual([1, 2, 3, 0].uniq(), [1, 2, 3, 0],
    'Returns a clone when called on an array that already contains unique elements.');

  assert.deepEqual([4, 2, 3, 2, 1, 4].uniq(), [4, 2, 3, 1],
    'Returns a unique set when called on an unsorted array with duplicates.');

  assert.deepEqual([1, 2, 2, 3, 4, 4].uniq(), [1, 2, 3, 4],
    'Returns a unique set when called on a sorted array with duplicates.');

  assert.deepEqual([1, 2, 2, 3, 4, 4].uniq(true), [1, 2, 3, 4],
    'Returns a unique set when called on a sorted array with duplicates and `isSorted` is `true`.');

  assert.deepEqual([1, 2, 2, 3, undefined].uniq(true), [1, 2, 3, undefined],
    'Returns a unique set when called on an array with `undefined` as the last element and `isSorted` is `true`.');
});

QUnit.test('#without', function(assert) {
  var array = [1, 2, 3, 3, 4, 3];

  var retArray = array.without(2);
  assert.ok(array != retArray, 'Returns a new array.');
  assert.deepEqual(retArray, [1, 3, 3, 4, 3], 'Can return a new array without a single specified item.');

  assert.deepEqual(array.without(), array, 'Returns a clone when called with no parameters.');

  assert.deepEqual(array.without(3), [1, 2, 4], 'Can return a new array minus all instances of the input value.');

  assert.deepEqual(array.without(1, 4, 3), [2], 'Returns a new array minus all instances of each input value.');
});
