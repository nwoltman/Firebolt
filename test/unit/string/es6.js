QUnit.module('string/es6');

QUnit.test('String#endsWith', function(assert) {
  var str = 'Who am I, Gamling?';

  // True
  assert.strictEqual(str.endsWith('Gamling?'), true);             // 1
  assert.strictEqual(str.endsWith('Gamling?', 99), true);         // 2
  assert.strictEqual(str.endsWith('Gamling?', str.length), true); // 3
  assert.strictEqual(str.endsWith('am I', 8), true);              // 4
  assert.strictEqual(str.endsWith('a', 5), true);                 // 5

  // False
  assert.strictEqual(str.endsWith('Gamling?', -1), false); // 6
  assert.strictEqual(str.endsWith('am I'), false);         // 7
  assert.strictEqual(str.endsWith('am I', 9), false);      // 8
  assert.strictEqual(str.endsWith('am I', 7), false);      // 9
  assert.strictEqual(str.endsWith('a', 6), false);         // 10
  assert.strictEqual(str.endsWith('a', 4), false);         // 11
  assert.strictEqual(str.endsWith(str + 'a'), false);      // 12
  assert.strictEqual(str.endsWith('?', 0), false);         // 13
});

QUnit.test('String#includes', function(assert) {
  var str = 'Winter is coming.';

  // True
  assert.strictEqual(str.includes(' is '), true,
    'Reports that a substring is in the string.');

  assert.strictEqual(str.includes('Wint'), true,
    'Reports that the beginning of the string is in the string.');

  assert.strictEqual(str.includes(' coming.'), true,
    'Reports that the end of the string is in the string.');

  assert.strictEqual(str.includes(str), true,
    'Reports that the string includes itself.');

  assert.strictEqual(str.includes.call(123, '3'), true,
    'Works (true version) when called on a non-string.');

  // False
  assert.strictEqual(str.includes('Summer is'), false,
    'Reports that a non-substring is not in the string.');

  assert.strictEqual(str.includes(' is ', 7), false,
    'Reports that a substring is not in the string if the `position` parameter is a large enough value.');

  assert.strictEqual(str.includes.call(123, '4'), false,
    'Works (false version) when called on a non-string.');
});

QUnit.test('String#repeat', function(assert) {
  var str = 'abc';

  // Test return value
  assert.strictEqual(str.repeat(), '', 'Returns an empty string when no input is given.');

  assert.strictEqual(str.repeat('a'), '', 'Returns an empty string when non-number is given.');

  assert.strictEqual(str.repeat(0), '', 'Returns an empty string when given 0 as input.');

  assert.strictEqual(str.repeat(1), str, 'Returns the original string when given 1 as input.');

  assert.strictEqual(str.repeat(3), 'abcabcabc', 'Correctly repeats the string the specified number of times.');

  assert.strictEqual(str.repeat(2.5), 'abcabc', 'Rounds down the input number before repeating the string.');

  // Test for throwing errors
  assert.throws(function() {
    str.repeat(-1);
  }, RangeError, 'Throws a RangeError when given a negative number as input.');

  assert.throws(function() {
    str.repeat(1/0);
  }, RangeError, 'Throws a RangeError when given infinity as input.');
});

QUnit.test('String#startsWith', function(assert) {
  var str = 'Who am I, Gamling?';

  // True
  assert.strictEqual(str.startsWith('Who'), true);      // 1
  assert.strictEqual(str.startsWith('am I', 4), true);  // 2

  // False
  assert.strictEqual(str.startsWith('Who are'), false); // 3
  assert.strictEqual(str.startsWith('am I'), false);    // 4
});
