/**
 * Firebolt tests loader
 */

// Hide passed tests by default
QUnit.config.hidepassed = true;

// Setup for the Firebolt.ready() test
window.readyTestVal = 0;
Firebolt.ready(function() {
	window.readyTestVal = 1;
});
if (document.readyState == 'loading') { // The document should not be done loading yet
	if (window.readyTestVal !== 0) {
		test('Firebolt.ready()', function() {
			ok(false, 'A function passed to Firebolt.ready() was called before the document became ready!');
		});
	}
}
else {
	console.warn('The Firebolt.ready() test will be incomplete because the document is done loading before it should be.');
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
	Firebolt.getScript('tests/' + module + '.js');
});
