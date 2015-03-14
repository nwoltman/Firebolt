QUnit.module('number/es6');

QUnit.test('Number.EPSILON', function(assert) {
  assert.strictEqual(Number.EPSILON, 2.220446049250313e-16);
});

QUnit.test('Number.MAX_SAFE_INTEGER', function(assert) {
  assert.strictEqual(Number.MAX_SAFE_INTEGER, Math.pow(2, 53) - 1);
});

QUnit.test('Number.MIN_SAFE_INTEGER', function(assert) {
  assert.strictEqual(Number.MIN_SAFE_INTEGER, -(Math.pow(2, 53) - 1));
});

QUnit.test('Number.isFinite', function(assert) {
  [
    {value: Infinity, expected: false},

    {value: -Infinity, expected: false},

    {value: NaN, expected: false},

    {value: '0', expected: false},

    {value: 0, expected: true},

    {value: 2e64, expected: true},

    {value: Number.MAX_SAFE_INTEGER, expected: true}

  ].forEach(function(test) {
    var strValue = typeof test.value == 'string' ? '"' + test.value + '"' : test.value;
    assert.strictEqual(Number.isFinite(test.value), test.expected,
      strValue + ' is ' + (test.expected ? '' : 'not ') + 'finite.');
  });
});

QUnit.test('Number.isInteger', function(assert) {
  [
    {value: 0.1, expected: false},

    {value: Math.PI, expected: false},

    {value: NaN, expected: false},

    {value: Infinity, expected: false},

    {value: '10', expected: false},

    {value: 1, expected: true},

    {value: 0, expected: true},

    {value: -100000, expected: true},

    {value: Number.MAX_SAFE_INTEGER, expected: true}

  ].forEach(function(test) {
    var strValue = typeof test.value == 'string' ? '"' + test.value + '"' : test.value;
    assert.strictEqual(Number.isInteger(test.value), test.expected,
      strValue + ' is ' + (test.expected ? '' : 'not ') + 'an integer.');
  });
});

QUnit.test('Number.isNaN', function(assert) {
  [
    {value: 'NaN', expected: false},

    {value: undefined, expected: false},

    {value: {}, expected: false},

    {value: 'blah', expected: false},

    {value: true, expected: false},

    {value: null, expected: false},

    {value: 37, expected: false},

    {value: '37', expected: false},

    {value: '37.37', expected: false},

    {value: '', expected: false},

    {value: ' ', expected: false},

    {value: NaN, expected: true},

    {value: Number.NaN, expected: true},

    {value: 0 / 0, expected: true}

  ].forEach(function(test) {
    var strValue = typeof test.value == 'string' ? '"' + test.value + '"' : test.value;
    assert.strictEqual(Number.isNaN(test.value), test.expected,
      strValue + ' is ' + (test.expected ? '' : 'not ') + 'NaN.');
  });
});

QUnit.test('Number.isSafeInteger', function(assert) {
  [
    {value: Math.pow(2, 53), expected: false},

    {value: Infinity, expected: false},

    {value: NaN, expected: false},

    {value: 3.1, expected: false},

    {value: '3', expected: false},

    {value: 3, expected: true},

    {value: Math.pow(2, 53) - 1, expected: true},

    {value: 3.0, expected: true},

    {value: Number.MIN_SAFE_INTEGER, expected: true}

  ].forEach(function(test) {
    var strValue = typeof test.value == 'string' ? '"' + test.value + '"' : test.value;
    assert.strictEqual(Number.isSafeInteger(test.value), test.expected,
      strValue + ' is ' + (test.expected ? '' : 'not ') + 'a safe integer.');
  });
});

QUnit.test('Number.parseFloat', function(assert) {
  assert.strictEqual(Number.parseFloat, window.parseFloat);
});

QUnit.test('Number.parseInt', function(assert) {
  assert.strictEqual(Number.parseInt, window.parseInt);
});
