/**
 * Firebolt tests loader
 */

(function() {
	var tests =
	[
		'tests/Array.js',
		'tests/String.js',
		'tests/NodeList.js'
	];

	tests.forEach(function(file) {
		$.getScript(file);
	});
})();