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
if (document.readyState == 'loading') { // The document should not be done loading yet
	if (window.readyTestVal !== 0) {
		QUnit.test('Firebolt.ready()', function(assert) {
			assert.ok(false, 'A function passed to Firebolt.ready() was called before the document became ready!');
		});
	}
} else if (typeof console != 'undefined') {
	console.warn('The Firebolt.ready() test will be incomplete because' // jshint ignore:line
	             + 'the document is done loading before it should be.');
}

// Load the test modules
[
	'Array',
	'AJAX',
	'Element',
	'Firebolt',
	'NodeCollection',
	'NodeList',
	'Number',
	'Object',
	'String'
].forEach(function(module) {
	Firebolt.getScript('unit/' + module + '.js');
});
