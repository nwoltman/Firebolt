/**
 * Firebolt tests loader
 */

// Hide passed tests by default
QUnit.config.hidepassed = true;

// Setup for the Firebolt.ready() test
if (document.readyState == 'loading') { // The document should not be done loading yet
	window.readyTestVal = 0;
	Firebolt.ready(function() {
		window.readyTestVal = 1;
	});

	if (window.readyTestVal !== 0) {
		test('Firebolt.ready()', function() {
			ok(0, 'A function passed to Firebolt.ready() was called before the document became ready!');
		});
	}
}

// Load the test modules
[
	'Array',
	'AJAX',
	'Element',
	'Firebolt',
	'NodeList',
	'Number',
	'Object',
	'String'
].forEach(function(module) {
	$.getScript('tests/' + module + '.js');
});
