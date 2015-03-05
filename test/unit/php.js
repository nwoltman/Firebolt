/**
 * Unit tests for the php module
 */

// References for Resharper
/// <reference path="../node_modules/qunitjs/qunit/qunit.js"/>
/// <reference path="../../src/firebolt.js"/>

QUnit.module('php');

QUnit.test('Firebolt._GET()', function(assert) {
  // Can't run these tests if the history.replaceState function does not exist (just IE 9)
  if (!('replaceState' in window.history)) return;

  var queryString = location.search; // Preserve for cleanup

  [
    { // 1
      string: '?',
      result: {}
    },
    { // 2
      string: '?a',
      result: {a: ''}
    },
    { // 3
      string: '?a&b',
      result: {a: '', b: ''}
    },
    { // 4
      string: '?hi=ho&oh=hi',
      result: {hi: 'ho', oh: 'hi'}
    },
    { // 5
      string: '?hi=ho&no&oh=hi',
      result: {hi: 'ho', no: '', oh: 'hi'}
    },
    { // 6
      string: '?hi=ho&no&oh=',
      result: {hi: 'ho', no: '', oh: ''}
    },
    { // 7
      string: '?&hi=ho&&&&no&&&oh=&&',
      result: {hi: 'ho', no: '', oh: ''}
    },
    { // 8
      string: '?url-encoded%3F=this%20%26%20that%2Fstuff',
      result: {'url-encoded?': 'this & that/stuff'}
    },
    { // 9
      string: '?b==2',
      result: {b: '=2'}
    }
  ].forEach(function(query, index) {
    history.replaceState('', '', query.string);
    assert.deepEqual(Firebolt._GET(), query.result, 'Correctly parses query string #' + (index + 1) + '.');
  });

  assert.strictEqual(Firebolt._GET(), Firebolt._GET(),
    'Returns the cached map when the value has not changed.');

  history.replaceState('', '', queryString); // Cleanup
});

QUnit.test('Firebolt._COOKIE()', function(assert) {
  [
    { // 1
      string: 'hi=ho',
      result: {hi: 'ho'}
    },
    { // 2
      string: 'oh=hi',
      result: {hi: 'ho', oh: 'hi'}
    },
    { // 3
      string: 'url-encoded%3F=this%20%26%20that%2Fstuff',
      result: {hi: 'ho', oh: 'hi', 'url-encoded?': 'this & that/stuff'}
    },
    { // 4
      string: 'url-encoded%3F=',
      result: {hi: 'ho', oh: 'hi', 'url-encoded?': ''}
    },
    { // 5
      string: 'b==2',
      result: {hi: 'ho', oh: 'hi', 'url-encoded?': '', b: '=2'}
    }
  ].forEach(function(cookie, index) {
    document.cookie = cookie.string + '; max-age=1';
    assert.deepEqual(Firebolt._COOKIE(), cookie.result, 'Correctly parses cookie #' + (index + 1) + '.');
  });

  assert.strictEqual(Firebolt._COOKIE(), Firebolt._COOKIE(),
    'Returns the cached map when the value has not changed.');
});

QUnit.test('Firebolt.setcookie()', function(assert) {
  assert.expect(6);

  Firebolt.setcookie('a b', 'b a');
  assert.ok(
    document.cookie.indexOf('a%20b=b%20a') >= 0,
    'Sets a normal cookie.'
  );

  Firebolt.setcookie('a b', '1', Infinity);
  assert.ok(
    document.cookie.indexOf('a%20b=1') >= 0,
    'Passing Infinity as the expirey time works.'
  );

  Firebolt.setcookie('a b', '2', '3015-03-05T09:14:53');
  assert.ok(
    document.cookie.indexOf('a%20b=2') >= 0,
    'Passing a date string as the expirey time works.'
  );

  Firebolt.setcookie('a b', '3', new Date(9999, 2));
  assert.ok(
    document.cookie.indexOf('a%20b=3') >= 0,
    'Passing a Date object as the expirey time works.'
  );

  Firebolt.setcookie('a b', '4', 1);
  assert.ok(
    document.cookie.indexOf('a%20b=4') >= 0,
    'Passing a number as the expirey time works.'
  );

  Firebolt.setcookie('a b', '5', -1);
  assert.ok(
    document.cookie.indexOf('a%20b=5') === -1,
    'Passing a negative expirey time removes a cookie.'
  );
});
