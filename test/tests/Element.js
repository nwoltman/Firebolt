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

test('attr', function() {
	var el = document.createElement('div');

	equal(el.attr('data-test', 'a'), el, 'Returns the element when setting a single attribute.');
	strictEqual(el.getAttribute('data-test'), 'a', 'Sets a single attribute wth the specified name.');
	strictEqual(el.attr('data-test'), 'a', 'Returns a single attribute with the specified name.');

	strictEqual(el.attr('nope'), null, 'Returns null when getting a non-existant attribute.');

	equal(el.attr({'data-a': 'a', 'data-b': 'b', 'data-c': 'c'}), el,
		'Returns the element when setting multiple properties.');
	ok(el.getAttribute('data-a') === 'a' && el.getAttribute('data-b') === 'b' && el.getAttribute('data-c') === 'c',
		'Sets multiple attributes when passed in an object of key-value pairs.');

	el.attr('data-a', null);
	ok(!el.hasAttribute('data-a'), 'Removes an attribute if attempting to set it to null.');

	el.attr('data-b', undefined);
	ok(!el.hasAttribute('data-b'), 'Removes an attribute if attempting to set it to undefined.');

	el.attr({'data-c': null, 'data-test': undefined});
	ok(!el.hasAttribute('data-c'),
		'Removes an attribute if attempting to set it to null when setting multiple attributes.');
	ok(!el.hasAttribute('data-test'),
		'Removes an attribute if attempting to set it to undefined when setting multiple attributes.');
});

test('data', function() {
	var el = document.createElement('div'),
		key = 'key',
		value = 'value',
		data = Firebolt.data;

	// Spy on Firebolt.data()
	Firebolt.data = function(_obj, _key, _value, _isElement) {
		strictEqual(_obj, el);
		strictEqual(_key, key);
		strictEqual(_value, value);
		strictEqual(_isElement, 1);

		return 'retVal';
	};

	strictEqual(el.data(key, value), 'retVal', 'Returns what Firebolt.data() returns.');

	// Restore the function
	Firebolt.data = data;
});

test('find', function() {
	expect(4);

	var div = document.createElement('div'),
		span = document.createElement('span');

	div.appendChild(span);
	div.id = 'testId1'; // Set the id to make sure .find() doesn't alter it

	strictEqual(div.find('div span').length, 0,
		'Does not find elements that match the selector but do not match from the root element.');

	strictEqual(div.find('span')[0], span,
		'Finds elements that match the selector from the root element.');

	strictEqual(div.id, 'testId1', "Does not alter the element's id property.");

	div.id = 'testId2'; // Set the id to make sure .find() doesn't alter it if an error occurs
	try {
		div.find('&');
	}
	catch (e) {
		strictEqual(div.id, 'testId2', "Does not alter the element's id property when an error occurs.");
	} 
});

test('matches', function() {
	if (document.getElementById('qunit-fixture').appendChild(document.createElement('iframe')).contentWindow.Element.prototype.matches) {
		// Element.prototype.matches is natively supported
		ok(typeof Element.prototype.matches == 'function', 'Has the `matches()` function.');
	}
	else {
		strictEqual(
			Element.prototype.matches,
			Element.prototype.webkitMatchesSelector || Element.prototype.mozMatchesSelector || Element.prototype.msMatchesSelector || Element.prototype.oMatchesSelector,
			'Has the `matches()` function.'
		);
	}
});

test('prop', function() {
	var el = document.createElement('div');

	strictEqual(el.prop('testProp', 1), el, 'Returns the element when setting a single property.');
	strictEqual(el.testProp, 1, 'Sets a single property at the specified key.');
	strictEqual(el.prop('testProp'), 1, 'Returns a single property at the specified key.');

	strictEqual(el.prop({p1: 1, p2: 2}), el, 'Returns the element when setting multiple properties.');
	ok(el.p1 === 1 && el.p2 === 2, 'Sets multiple properties when passed in an object of key-value pairs.');
});

test('removeAttr', function() {
	var el = document.createElement('div');
	el.setAttribute('class', 'mydiv');

	strictEqual(el.removeAttr('class'), el, 'Returns the element.');
	strictEqual(el.getAttribute('class'), null, 'Successfully removes the attribute from the element.');
});

test('removeData', function() {
	var el = document.createElement('div'),
		key = 'key',
		removeData = Firebolt.removeData;

	// Spy on Firebolt.removeData()
	Firebolt.removeData = function(_obj, _key) {
		strictEqual(_obj, el);
		strictEqual(_key, key);
	};

	strictEqual(el.removeData(key), el, 'Returns the element.');

	// Restore the function
	Firebolt.removeData = removeData;
});

test('removeProp', function() {
	var el = document.createElement('div');
	el.testProp = 1;

	strictEqual(el.removeProp('testProp'), el, 'Returns the element.');
	strictEqual(el.testProp, undefined, 'Successfully removes the property from the element.');
});
