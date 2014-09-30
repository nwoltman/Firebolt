/**
 * Unit tests for Element.prototype
 */

// References for Resharper
/// <reference path="../qunit/qunit.js"/>
/// <reference path="../../src/firebolt.js"/>

module('Element.prototype');

test('CLS', function() {
	strictEqual(Element.prototype.CLS, Element.prototype.getElementsByClassName,
		'Has the `getElementsByClassName()` alias function.');
});

test('TAG', function() {
	strictEqual(Element.prototype.TAG, Element.prototype.getElementsByTagName,
		'Has the `getElementsByTagName()` alias function.');
});

test('QS', function() {
	strictEqual(Element.prototype.QS, Element.prototype.querySelector,
		'Has the `querySelector()` alias function.');
});

test('QSA', function() {
	strictEqual(Element.prototype.QSA, Element.prototype.querySelectorAll,
		'Has the `querySelectorAll()` alias function.');
});

test('matches', function() {
	strictEqual(Element.prototype.matches, Element.prototype.matches || Element.prototype.webkitMatchesSelector || Element.prototype.mozMatchesSelector || Element.prototype.msMatchesSelector || Element.prototype.oMatchesSelector,
		'Has the `matches()` alias function.');
});

test('removeAttr', function() {
	var el = document.createElement('div');
	el.setAttribute('class', 'mydiv');

	strictEqual(el.getAttribute('class'), 'mydiv', 'Test that the testing element has the specified class attribute.');

	strictEqual(el.removeAttr('class'), el, 'Returns the element.');
	strictEqual(el.getAttribute('class'), null, 'Successfully removes the attribute from the element.');
});
