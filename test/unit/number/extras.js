QUnit.module('number/extras');

QUnit.test('Number#isInRange', function(assert) {
  assert.expect(14);

  assert.strictEqual((0).isInRange(5), true,
    'Works with only an `end` argument (is 0).');

  assert.strictEqual((-1).isInRange(5), false,
    'Works with only an `end` argument (less than 0).');

  assert.strictEqual((3).isInRange(5), true,
    'Works with only an `end` argument (less than `end`).');

  assert.strictEqual((5).isInRange(5), false,
    'Works with only an `end` argument (equal to `end`).');

  assert.strictEqual((6).isInRange(5), false,
    'Works with only an `end` argument (greater than `end`).');


  assert.strictEqual((1).isInRange(1, 5), true,
    'Works with `start` and `end` arguments (equal to `start`).');

  assert.strictEqual((3).isInRange(1, 5), true,
    'Works with `start` and `end` arguments (between `start` and `end`).');

  assert.strictEqual((0).isInRange(1, 5), false,
    'Works with `start` and `end` arguments (less than `start`).');

  assert.strictEqual((5).isInRange(1, 5), false,
    'Works with `start` and `end` arguments (equal to `end`).');


  assert.strictEqual((0.5).isInRange(5), true,
    'Works with floating point values (less than only `end`).');

  assert.strictEqual((1.2).isInRange(1, 5), true,
    'Works with floating point values (between `start` and `end`).');

  assert.strictEqual((5.2).isInRange(5), false,
    'Works with floating point values (greater than only `end`).');

  assert.strictEqual((0.5).isInRange(1, 5), false,
    'Works with floating point values (less than `start`).');


  var actual = [
    (0).isInRange('0', 1),
    (0).isInRange('1'),
    (0).isInRange(0, '1'),
    (0).isInRange(NaN, 1),
    (-1).isInRange(-1, NaN)
  ];
  var expected = actual.map(function() { return true; });

  assert.deepEqual(actual, expected, 'Coerces arguments to finite numbers.');
});

QUnit.test('Number#toPaddedString', function(assert) {
  assert.expect(7);

  assert.strictEqual((255).toPaddedString(4), '0255', 'Pads a positive number.');

  assert.strictEqual((255).toPaddedString(6), '000255', 'Pads a positive number more.');

  assert.strictEqual((-255).toPaddedString(5), '-0255', 'Pads a negative number.');

  assert.strictEqual((255).toPaddedString(4, 16), '00ff', 'Pads a positive number given a radix.');

  assert.strictEqual((25589).toPaddedString(4), '25589',
    'Does not pad a number longer than the specified padding length.');

  assert.strictEqual((3).toPaddedString(5, 2), '00011', 'Pads another positive number given a radix.');

  assert.strictEqual((-3).toPaddedString(5, 2), '-0011', 'Pads a negative number given a radix.');
});
