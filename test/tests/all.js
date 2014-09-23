/**
 * Firebolt tests loader
 */

// Hide passed tests by default
QUnit.config.hidepassed = true;

// Load the test modules
[
	'Array',
	'AJAX',
	'Firebolt',
	'NodeList',
	'Number',
	'Object',
	'String'
].forEach(function(module) {
	$.getScript('tests/' + module + '.js');
});
