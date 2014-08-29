/**
 * Firebolt tests loader
 */

// Load the test modules
[
	'Array',
	'Firebolt',
	'NodeList',
	'String'
].forEach(function(module) {
	$.getScript('tests/' + module + '.js');
});
