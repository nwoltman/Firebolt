/**
 * Firebolt tests loader
 */

// Sauce Labs setup
(function() {
  var log = [];

  QUnit.done(function(testResults) {
    var tests = [];
    for (var i = 0; i < log.length; i++) {
      var details = log[i];
      tests.push({
        name: details.name,
        result: details.result,
        expected: details.expected,
        actual: details.actual,
        source: details.source
      });
    }
    testResults.tests = tests;
    window.global_test_results = testResults;
  });

  QUnit.testStart(function(testDetails) {
    QUnit.log(function(details) {
      if (!details.result) {
        details.name = testDetails.name;
        log.push(details);
      }
    });
  });
})();

// Setup for the Firebolt.ready() test
window.readyTestVal = 0;
Firebolt.ready(function() {
  window.readyTestVal = 1;
});
Firebolt.ready(function() {
  window.readyTestVal2 = window.readyTestVal === 1;
});
if (window.readyTestVal !== 0 || ('readyTestVal2' in window)) {
  QUnit.test('Firebolt.ready()', function(assert) {
    assert.ok(false, 'A function passed to Firebolt.ready() was called before the document became ready!');
  });
}

// Load the test modules
[
  'ajax/shared',
  'core/Array',
  'core/Element',
  'core/Firebolt',
  'core/Globals',
  'core/HTMLElement',
  'core/NodeCollection',
  'core/NodeList_HTMLCollection',
  'core/Object',
  'data',
  'Number',
  'php',
  'string/es6',
  'string/extras',
  'timing'
].forEach(function(module) {
  var script = document.createElement('script');
  script.src = 'unit/' + module + '.js';
  document.body.appendChild(script);
});
