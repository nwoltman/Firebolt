/**
 * Unit tests for Array.prototype
 */

// References for Resharper
/// <reference path="../qunit/qunit.js"/>
/// <reference path="../../src/firebolt.js"/>

module('Array.prototype');

test('clean', function() {
	var isClean = function(array) {
			return array.every(function(item) {
				return !$.isEmpty(item);
			});
		},
		origArray,
		cleanArray;

	origArray = [function() {}, 1, null, 0, '', 'str', undefined, false, {}, [], true, {notEmpty: true}, {}];
	cleanArray = origArray.clean();
	ok(isClean(cleanArray), 'Cleans an array with both empty and not-empty items.');
	deepEqual(cleanArray, [origArray[0], 1, 0, 'str', false, true, origArray[11]], 'Preserves the order of non-empty items.');

	origArray = [undefined, [], null, '', {}];
	cleanArray = origArray.clean();
	deepEqual(cleanArray, [], 'Returns an empty array when cleaning an array with only empty items.');

	origArray = [$.elem('div'), 100, -1, 0, false, true, 'random string', { notEmpty: true }, [1, 'a']];
	cleanArray = origArray.clean();
	ok(isClean(cleanArray), 'Cleans an array with both no empty items.');
	ok(cleanArray != origArray && cleanArray.equals(origArray), 'Returns a clone of an array with no empty items.');
});

test('clear', function() {
	var array = [1, 2, 3];

	array.clear();

	ok(array.length === 0, 'Cleared array has no length.');
	ok(array[0] === undefined && array[1] === undefined && array[3] === undefined,
		'Items are no longer in the array (the indices where the items used to be are now undefined).');
});

test('clone', function() {
	var origArray = [1, 99, '', {}, ['a', 'b'], false, /regex/],
		clonedArray = origArray.clone();

	notEqual(clonedArray, origArray, 'Cloned array is not the same as the original array.');
	deepEqual(clonedArray, origArray, 'Cloned array contains the same items as the original array.');
});

test('contains', function() {
	var array = ['a', 'b'];

	ok(array.contains('a'), 'Correctly reports that an item in the array is in fact in the array.');
	ok(array.contains('b'), 'Correctly reports that an item in the array is in fact in the array.');
	ok(!array.contains('c'), 'Correctly reports that an item not in the array is not in the array.');
	ok(!array.contains(1), 'Correctly reports that an item not in the array is not in the array.');
});

test('diff', function() {
	var array = [1, 2, 3, 4, 5];

	deepEqual(array.diff(), array, 'Returns a clone when called with no parameters.');

	deepEqual(array.diff([5, 2, 10]), [1, 3, 4], 'Correctly performs a set difference when given one array as input.');

	deepEqual(array.diff([5, 2], [1, 4]), [3], 'Correctly performs a set difference when given multiple arrays as input.');

	deepEqual((function() {
		return array.diff(arguments);
	})(1, 2, 5), [3, 4], 'Correctly performs a set difference when given an array-like object as input.');
});

test('each', function() {
	var array = [],
		callback = function() {},
		thisArg;

	Firebolt.each = function(_obj, _callback, _thisArg, _isArrayLike) {
		strictEqual(_obj, array);
		strictEqual(_callback, callback);
		strictEqual(_thisArg, thisArg);
		strictEqual(_isArrayLike, 1);
	}

	array.each(callback);

	thisArg = 'this';
	array.each(callback, thisArg);
});

test('equals', function() {
	var array = [1, 2, 3];

	ok(array.equals(array), 'Reports that an array equals itself.');

	ok(array.equals([1, 2, 3]), 'Reports that an array equals another array with the same values.');

	ok(!array.equals([3, 2, 1]), 'Reports that an array does not equal another array with the same values but in another order.');

	ok(!array.equals([1, 2]), 'Reports that an array does not equal another that has a different length.');

	ok((function() {
		return array.equals(arguments);
	})(1, 2, 3), 'Reports that an array equals another array-like object with the same values.');

	throws(array.equals, TypeError, 'Throws a TypeError when executed with undefined input.');
});

test('get', function() {
	var array = ['a', 'b', 'c'];

	ok(array.get(0) === 'a', 'Get first item with positive index.');
	ok(array.get(1) === 'b', 'Get middle item with positive index.');
	ok(array.get(2) === 'c', 'Get last item with positive index.');
	ok(array.get(3) === undefined, 'Get no item with positive out-of-range index.');
	ok(array.get(-1) === 'c', 'Get last item with negative index.');
	ok(array.get(-2) === 'b', 'Get middle item with negative index.');
	ok(array.get(-3) === 'a', 'Get first item with negative index.');
	ok(array.get(-4) === undefined, 'Get no item with out-of-range negative index.');
});

test('intersect', function() {
	var array = [1, 2, 3];

	deepEqual(array.intersect(), array, 'Returns a clone when called with no parameters.');

	deepEqual(array.intersect([2, 3, 4]), [2, 3],
		'Correctly performs a set intersection when given one array as input.');

	deepEqual(array.intersect([107, 1, 50, 2], [2, 1]), [1, 2],
		'Correctly performs a set intersection when given multiple arrays as input.');

	deepEqual((function() {
		return array.intersect(arguments);
	})(5, 2, 1), [1, 2], 'Correctly performs a set intersection when given an array-like object as input.');
});

test('remove', function() {
	var array = [1, 2, 3, 3, 4, 3];

	var retArray = array.remove(2);
	strictEqual(array, retArray, 'Returns the array.');
	deepEqual(array, [1, 3, 3, 4, 3], 'Can remove a single item from the array.');

	deepEqual(array.remove(3), [1, 4], 'Removes all instances of the input value.');

	deepEqual(array.remove(2), [1, 4], 'Removes nothing if the specified value is not in the array.');

	deepEqual(array.remove(1, 4), [], 'Removes all instances of each input value.');
});

test('union', function() {
	var array = [1, 2, 3];

	deepEqual(array.union(), array, 'Returns a clone when called with no parameters.');

	deepEqual(array.union([2, 3, 4, 5]), [1, 2, 3, 4, 5],
		'Correctly performs a set union when given one array as input.');

	deepEqual(array.union([3, 4], [50, 9]), [1, 2, 3, 4, 50, 9],
		'Correctly performs a set union when given multiple arrays as input.');

	deepEqual((function() {
		return array.union(arguments);
	})(2, 3, 4, 5), [1, 2, 3, 4, 5], 'Correctly performs a set union when given an array-like object as input.');
});

test('uniq', function() {
	deepEqual([1, 2, 3, 0].uniq(), [1, 2, 3, 0], 'Returns a clone when called on an array that already contains unique elements.');

	deepEqual([4, 2, 3, 2, 1, 4].uniq(), [4, 2, 3, 1], 'Returns a unique set when called on an unsorted array with duplicates.');

	deepEqual([1, 2, 2, 3, 4, 4].uniq(), [1, 2, 3, 4], 'Returns a unique set when called on a sorted array with duplicates.');

	deepEqual([1, 2, 2, 3, 4, 4].uniq(true), [1, 2, 3, 4],
		'Returns a unique set when called on a sorted array with duplicates and the `isSorted` parameter is `true`.');
});

test('without', function() {
	var array = [1, 2, 3, 3, 4, 3];

	var retArray = array.without(2);
	ok(array != retArray, 'Returns a new array.');
	deepEqual(retArray, [1, 3, 3, 4, 3], 'Can return a new array without a single specified item.');

	deepEqual(array.without(), array, 'Returns a clone when called with no parameters.');

	deepEqual(array.without(3), [1, 2, 4], 'Can return a new array minus all instances of the input value.');

	deepEqual(array.without(1, 4, 3), [2], 'Returns a new array minus all instances of each input value.');
});
