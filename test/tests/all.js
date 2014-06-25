/**
 * Firebolt tests loader
 */

(function() {
	var modules = [
		'Array',
		'NodeList',
		'String'
	];
	modules.forEach(function(module) {
		$.getScript('tests/' + module + '.js');
	});
})();