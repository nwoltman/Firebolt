/**
 * Firebolt tests loader
 */

(function() {
	var modules = [
		'Array',
		'Firebolt',
		'NodeList',
		'String'
	];
	modules.forEach(function(module) {
		$.getScript('tests/' + module + '.js');
	});
})();