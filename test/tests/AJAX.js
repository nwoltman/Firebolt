/**
 * Unit tests for AJAX functionality
 */

// References for Resharper
/// <reference path="../qunit/qunit.js"/>
/// <reference path="../../src/firebolt.js"/>

module('AJAX');

test('Firebolt.ajaxSetup()', function() {
	var ajaxSettings = Firebolt.ajaxSetup(),
		testObject = {
			a: [1, 2, 3],
			b: false,
			c: 0,
			d: {inner: 24}
		};

	Firebolt.ajaxSetup({test: 1});
	strictEqual(ajaxSettings.test, 1, 'Extends the AJAX settings object.');

	Firebolt.ajaxSetup({test: testObject});
	deepEqual(ajaxSettings.test, testObject, 'Deep-extends the AJAX settings object.');
	notEqual(ajaxSettings.test, testObject);
});
