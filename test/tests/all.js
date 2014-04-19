/**
 * Firebolt tests loader
 */

(function() {
	var tests =
	[
		'tests/string.js'
	];

	tests.forEach(function(file) {
		document.body.appendChild($.create('script', {src: file}));
	});
})();