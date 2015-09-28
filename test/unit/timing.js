QUnit.module('timing');

QUnit.test('Function#debounce(wait, leading=false)', function(assert) {
  assert.expect(4);

  var args = ['a', 2, { arg: 3 }];
  var context = {};
  var done = assert.async();
  var callCount = 0;
  var debounced = (function() {
    callCount++;

    assert.deepEqual(Array.from(arguments), args, 'Invokes the function with the proper arguments.');

    assert.equal(this, context, 'Invokes the function with the proper context.');
  }).debounce(40);

  debounced.apply(context, args);
  debounced.apply(context, args);

  assert.equal(callCount, 0, 'Debounces the function invocation to a later time.');

  setTimeout(function() {
    assert.equal(callCount, 1, 'Invokes the function after `wait` milliseconds.');
    done();
  }, 50);
});

QUnit.test('Function#debounce(wait, leading=true)', function(assert) {
  assert.expect(8);

  var args = ['a', 2, { arg: 3 }];
  var context = {};
  var done = assert.async();
  var callCount = 0;
  var debounced = (function() {
    callCount++;

    assert.deepEqual(Array.from(arguments), args, 'Invokes the function with the proper arguments.');

    assert.equal(this, context, 'Invokes the function with the proper context.');
  }).debounce(40, true);

  debounced.apply(context, args);

  assert.equal(callCount, 1, 'Invokes the function immediately the first time the debounced function is called.');

  debounced.apply(context, args);
  debounced.apply(context, args);

  assert.equal(callCount, 1, 'Debounces subsequent calls made within `wait` milliseconds.');

  setTimeout(function() {
    assert.equal(callCount, 1, 'The function is not invoked on the trailing edge of the wait timeout.');

    debounced.apply(context, args);

    assert.equal(callCount, 2, 'Invokes the function when debounced is called after `wait` milliseconds.');

    done();
  }, 50);
});

QUnit.test('Function#delay', function(assert) {
  assert.expect(16);

  var args = ['a', 2, {arg: 3}];

  var done1 = assert.async();
  var ref1 = (function fn() {
    assert.deepEqual(Array.from(arguments), args,
      'Applies the specified arguments to the function when `thisArg` is not specified.');

    assert.equal(this, ref1, 'Sets `this` to the returned reference object if `thisArg` is not specified.');

    assert.equal(ref1.fn, fn, '`.fn` is set to the function `.delay()` was called on.');

    assert.equal(ref1.hasExecuted, false, '`.hasExecuted` is `false` while the function executes.');

    done1();
  }).delay(40, args);

  assert.equal(ref1.hasExecuted, false, '`.hasExecuted` is `false` before the function executes.');


  var done2 = assert.async();
  var thisArg = {};
  (function() {
    // Final test for ref1
    assert.equal(ref1.hasExecuted, true, '`.hasExecuted` is `true` after the function executes.');

    assert.deepEqual(Array.from(arguments), args,
      'Applies the specified arguments to the function when `thisArg` is specified.');

    assert.equal(this, thisArg, 'Sets `this` to the value specified by the `thisArg` parameter.');

    done2();
  }).delay(50, args, thisArg);


  var done3 = assert.async();
  (function() {
    assert.equal(this, thisArg, 'Sets `this` to the value specified by the `thisArg` parameter' +
                                ' when `args` is not specified and `thisArg` is not an array.');
    done3();
  }).delay(50, thisArg);


  var done4 = assert.async();
  var thisArgArray = [];
  (function() {
    assert.equal(this, thisArgArray, 'Sets `this` to the value specified by the `thisArg` parameter' +
                                     ' when `args` is `null` and `thisArg` is an array.');
    done4();
  }).delay(50, null, thisArgArray);


  var done5 = assert.async();
  var testVal5 = 0;
  var ref5 = (function() {
    testVal5++;
  }).delay(50);

  ref5.exec();
  assert.equal(testVal5, 1, 'Calling `.exec()` executes the function immediately.');
  assert.equal(ref5.hasExecuted, true,
    '`.hasExecuted` is `true` after the function is executed manually with `.exec()`.');

  setTimeout(function() {
    assert.equal(testVal5, 1,
      'Calling `.exec()` without the parameter `false` cancels the delayed callback.');
    done5();
  }, 50);


  var done6 = assert.async();
  var testVal6 = 0;
  (function() {
    testVal6++;
  }).delay(45).exec(false);

  setTimeout(function() {
    assert.equal(testVal6, 2,
      'Calling `.exec()` with the parameter `false` does not cancel the delayed callback.');
    done6();
  }, 50);


  var done7 = assert.async();
  var testVal7 = 0;
  var ref7 = (function() {
    testVal7++;
  }).delay(50);

  ref7.cancel();

  setTimeout(function() {
    assert.equal(testVal7, 0, 'Calling `.cancel()` cancels the delayed callback.');

    assert.equal(ref7.hasExecuted, false, '`.hasExecuted` remains `false` when a callback is cancelled.');

    done7();
  }, 50);
});

QUnit.test('Function#every', function(assert) {
  assert.expect(19);

  var args = ['a', 2, {arg: 3}];

  var done1 = assert.async();
  var ref1 = (function fn() {
    assert.deepEqual(Array.from(arguments), args,
      'Applies the specified arguments to the function when `thisArg` is not specified.');

    assert.equal(this, ref1, 'Sets `this` to the returned reference object if `thisArg` is not specified.');

    assert.equal(ref1.fn, fn, '`.fn` is set to the function `.delay()` was called on.');

    assert.equal(ref1.hasExecuted, false, '`.hasExecuted` is `false` while the function executes.');

    this.cancel();
    done1();
  }).every(40, args);

  assert.equal(ref1.hasExecuted, false, '`.hasExecuted` is `false` before the function executes.');


  var done2 = assert.async();
  var thisArg = {};
  var ref2 = (function() {
    // Final test for ref1
    assert.equal(ref1.hasExecuted, true, '`.hasExecuted` is `true` after the function executes.');

    assert.deepEqual(Array.from(arguments), args,
      'Applies the specified arguments to the function when `thisArg` is specified.');

    assert.equal(this, thisArg, 'Sets `this` to the value specified by the `thisArg` parameter.');

    ref2.cancel();
    done2();
  }).every(50, args, thisArg);


  var done3 = assert.async();
  var ref3 = (function() {
    assert.equal(this, thisArg, 'Sets `this` to the value specified by the `thisArg` parameter' +
                                ' when `args` is not specified and `thisArg` is not an array.');
    ref3.cancel();
    done3();
  }).every(50, thisArg);


  var done4 = assert.async();
  var thisArgArray = [];
  var ref4 = (function() {
    assert.equal(this, thisArgArray, 'Sets `this` to the value specified by the `thisArg` parameter' +
                                     ' when `args` is `null` and `thisArg` is an array.');
    ref4.cancel();
    done4();
  }).every(50, null, thisArgArray);


  var done5 = assert.async();
  var testVal5 = 0;
  var ref5 = (function() {
    testVal5++;
  }).every(50);

  ref5.exec();
  assert.equal(testVal5, 1, 'Calling `.exec()` executes the function immediately.');
  assert.equal(ref5.hasExecuted, true,
    '`.hasExecuted` is `true` after the function is executed manually with `.exec()`.');

  setTimeout(function() {
    assert.equal(testVal5, 1,
      'Calling `.exec()` without the parameter `false` cancels the delayed callback.');
    done5();
  }, 50);


  var done6 = assert.async();
  var testVal6 = 0;
  var ref6 = (function() {
    testVal6++;
  }).every(50);

  ref6.exec(false);
  assert.equal(testVal6, 1, 'Calling `.exec(false)` executes the function immediately.');

  setTimeout(function() {
    assert.equal(testVal6, 2,
      'Calling `.exec(false)` does not cancel the delayed callback.');

    // Set to `false` to test if it will get set to `true` on the next interval
    ref6.hasExecuted = false;
  }, 50);

  setTimeout(function() {
    assert.ok(testVal6 > 2, 'Causes the function to be executed repeatedly at regularish intervals.');

    assert.strictEqual(ref6.hasExecuted, true,
      'Resets `.hasExecuted` to `true` each time the function executes.');

    ref6.cancel();
    done6();
  }, 150);


  var done7 = assert.async();
  var testVal7 = 0;
  var ref7 = (function() {
    testVal7++;
  }).every(50);

  ref7.cancel();

  setTimeout(function() {
    assert.equal(testVal7, 0, 'Calling `.cancel()` cancels the delayed callback.');

    assert.equal(ref7.hasExecuted, false, '`.hasExecuted` remains `false` when a callback is cancelled.');

    done7();
  }, 50);
});

QUnit.test('Function#throttle(wait, noTrailing=false)', function(assert) {
  assert.expect(13);

  var args = ['a', 2, { arg: 3 }];
  var context = {};
  var done = assert.async();
  var callCount = 0;
  var throttled = (function() {
    callCount++;

    assert.deepEqual(Array.from(arguments), args, 'Invokes the function with the proper arguments.');

    assert.equal(this, context, 'Invokes the function with the proper context.');
  }).throttle(50);

  throttled.apply(context, args);

  assert.equal(callCount, 1, 'Invokes the function immediately the first time the throttled function is called.');

  throttled.apply(context, args);
  throttled.apply(context, args);

  assert.equal(callCount, 1, 'Throttles subsequent calls made within `wait` milliseconds.');

  setTimeout(function() {
    assert.equal(callCount, 2, 'The function is invoked on the trailing edge of the wait timeout.');

    throttled.apply(context, args);

    assert.equal(callCount, 2, 'Throttles calls after the wait timeout if invoked during the wait period.');

    setTimeout(function() {
      throttled.apply(context, args);

      assert.equal(callCount, 4, 'Calls immediately after a wait period when `throttled` was not called.');

      done();
    }, 150);
  }, 55);
});

QUnit.test('Function#throttle(wait, noTrailing=true)', function(assert) {
  assert.expect(8);

  var args = ['a', 2, { arg: 3 }];
  var context = {};
  var done = assert.async();
  var callCount = 0;
  var throttled = (function() {
    callCount++;

    assert.deepEqual(Array.from(arguments), args, 'Invokes the function with the proper arguments.');

    assert.equal(this, context, 'Invokes the function with the proper context.');
  }).throttle(50, true);

  throttled.apply(context, args);

  assert.equal(callCount, 1, 'Invokes the function immediately the first time the throttled function is called.');

  throttled.apply(context, args);
  throttled.apply(context, args);

  assert.equal(callCount, 1, 'Throttles subsequent calls made within `wait` milliseconds.');

  setTimeout(function() {
    assert.equal(callCount, 1, 'The function is not invoked on the trailing edge of the wait timeout.');

    throttled.apply(context, args);

    assert.equal(callCount, 2, 'Invokes the function when throttled is called after `wait` milliseconds.');

    done();
  }, 55);
});
