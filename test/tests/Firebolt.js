/**
 * Unit tests for the Firebolt function and namespace
 */

// References for Resharper
/// <reference path="../qunit/qunit.js"/>
/// <reference path="../../src/firebolt.js"/>

module('Firebolt');

test('ajaxSetup', function() {
	var ajaxSettings = Firebolt.ajaxSetup(),
		testObject = {
			a: [1, 2, 3],
			b: false,
			c: 0,
			d: {
				inner: 24
			}
		};

	Firebolt.ajaxSetup({test: 1});
	strictEqual(ajaxSettings.test, 1, 'Extends the AJAX settings object.');

	Firebolt.ajaxSetup({test: testObject});
	deepEqual(ajaxSettings.test, testObject, 'Deep-extends the AJAX settings object.');
	notEqual(ajaxSettings.test, testObject);
});

test('data', function() {
	var object = {},
		dataStore = Firebolt.data(object);

	ok(Firebolt.isPlainObject(dataStore) && Firebolt.isEmptyObject(dataStore),
		'When passed just an object, returns its data store object.');

	ok(Firebolt.isEmptyObject(object), 'Defines the data store at a non-enumerable property on the specifed object');

	strictEqual(Firebolt.data(object, 'a', 1), object, 'Returns the passed in object when setting properties.');

	strictEqual(dataStore.a, 1, 'Can store data properties.');

	Firebolt.data(object, {b: 'b', c: null});
	deepEqual(dataStore, {a: 1, b: 'b', c: null}, 'Can store multiple properties at once.');

	strictEqual(Firebolt.data(object, 'a'), 1, 'Can retrieve previously set properties.');

	var element = Firebolt.elem('div', {'data-stuff': 23});
	dataStore = Firebolt.data(element, undefined, undefined, 1);

	strictEqual(dataStore.stuff, 23,
		'Adds data from custom "data-*" attributes on elements to the data store and parses the data to the correct JavaScript type.');

	strictEqual(Firebolt.data(element, 'stuff', undefined, 1), 23,
		'Can retrieve data in custom "data-*" attributes on an element as the correct JavaScript type.');

	Firebolt.data(element, 'stuff', ['a', 'b'], 1);
	deepEqual(dataStore.stuff, ['a', 'b'],
		'Overwrites data retrieved from custom "data-*" attributes on an element when new data with the same key is set.');

	delete dataStore.stuff;
	strictEqual(Firebolt.data(element, 'stuff', undefined, 1), 23,
		'Restores data retrieved from custom "data-*" attributes on an element when other data with the same key is removed.');
});

test('elem', function() {
	var element = Firebolt.elem('div');
	ok(element.nodeType === 1 && element.nodeName === 'DIV', 'Creates a new Element.');

	element = Firebolt.elem('p', {'class': 'one two', 'data-custom': 'test'});
	ok(element.className === 'one two' && element.getAttribute('data-custom') === 'test',
		'Creates a new element with the specified properties');
});

test('globalEval', function() {
	Firebolt.globalEval('var globalEvalTest1 = true;');
	strictEqual(window.globalEvalTest1, true, 'Executes the passed in code in the global context.');

	Firebolt.globalEval('"use strict"; function globalEvalTest2() { return 10; }');
	strictEqual(window.globalEvalTest2(), 10, 'Executes code with a strict mode pragma in the global context.');
});

test('hasData', function() {
	var object = {};

	strictEqual(Firebolt.hasData(object), false,
		'Correctly reports that an object without Firebolt data does not have data.');

	Firebolt.data(object, 'a', 0);
	strictEqual(Firebolt.hasData(object), true,
		'Correctly reports that an object with Firebolt data has data.');

	Firebolt.removeData(object, 'a');
	strictEqual(Firebolt.hasData(object), false,
		'Correctly reports that an object that used to have Firebolt data does not have data.');

	object = Firebolt.elem('div', {'data-stuff': 23});
	strictEqual(Firebolt.hasData(object), false,
		'Correctly reports that an element that has not had the $.data() function called on it yet does not have data.');

	Firebolt.data(object, undefined, undefined, 1);
	strictEqual(Firebolt.hasData(object), true,
		'Correctly reports that an element with data pulled from a "data-*" attribute has data.');
});

test('isPlainObject', function func() {
	// False
	ok(!Firebolt.isPlainObject(1));
	ok(!Firebolt.isPlainObject('string'));
	ok(!Firebolt.isPlainObject(undefined));
	ok(!Firebolt.isPlainObject(null));
	ok(!Firebolt.isPlainObject([]));
	ok(!Firebolt.isPlainObject([{}]));
	ok(!Firebolt.isPlainObject(true));
	ok(!Firebolt.isPlainObject(/RegExp/));
	ok(!Firebolt.isPlainObject(func));
	ok(!Firebolt.isPlainObject(window));
	ok(!Firebolt.isPlainObject(document));
	ok(!Firebolt.isPlainObject(document.body));
	ok(!Firebolt.isPlainObject(document.createTextNode('text')));
	ok(!Firebolt.isPlainObject(document.getElementsByTagName('div')));
	ok(!Firebolt.isPlainObject(document.querySelectorAll('div')));

	// True
	ok(Firebolt.isPlainObject({}));
});

test('parseHTML', function() {
	var iframe = document.createElement('iframe'),
		element;

	element = Firebolt.parseHTML('<div/>')[0];
	ok(element && element.tagName.toLowerCase() === 'div', 'Can make a simple, single element.');

	ok(element && element.ownerDocument === document, 'By default, creates elements in the context of the current document.');

	document.head.appendChild(iframe);
	element = Firebolt.parseHTML('<div/>', iframe.contentDocument)[0];
	ok(element && element.ownerDocument === iframe.contentDocument, 'Can create elements in the context of another document.');
	iframe.remove();

	'option optgroup thead tbody tfoot colgroup caption tr col td th script link legend'.split(' ').forEach(function(tagName) {
		element = Firebolt.parseHTML('<' + tagName + ' class="test" />')[0];
		ok(element && element.tagName.toLowerCase() === tagName && element.className === 'test',
			'Can make special element: <' + tagName + '>.');
	});

	ok(Firebolt.parseHTML('<p>para</p><br/>').length === 2, 'Can make multiple elements.');

	document.body.appendChild(Firebolt.parseHTML('<script>window.whoa=9</script>')[0]);
	ok(window.whoa != 9, 'Created scripts are not evaluated.');
});

test('removeData', function() {
	var object = {},
		testData = {a: 1, b: 2, c: 3},
		dataStore = Firebolt.data(object, testData);

	Firebolt.removeData(object, 'a');
	ok(!('a' in dataStore), 'Removes a single piece of data.');

	Firebolt.data(object, testData);
	Firebolt.removeData(object, 'a b');
	ok(!('a' in dataStore) && !('b' in dataStore), 'Removes multiple pieces of data when given a space-separated string.');

	Firebolt.data(object, testData);
	Firebolt.removeData(object, ['b', 'c']);
	ok(!('b' in dataStore) && !('c' in dataStore), 'Removes multiple pieces of data when given an array of strings.');

	Firebolt.data(object, testData);
	Firebolt.removeData(object);
	ok(Firebolt.isEmptyObject(dataStore), 'Removes all data when called with no specified values.');

	object = Firebolt.elem('div', {'data-test': true});
	dataStore = Firebolt.data(object, undefined, undefined, 1);
	Firebolt.removeData(object, 'test');
	ok(!('test' in dataStore), 'Removes a single piece of data that was pulled from a "data-*" attribute.');
});

test('text', function() {
	var text = Firebolt.text('hello');
	ok(text.nodeType === 3 && text.nodeValue === 'hello', 'Creates a new TextNode with the specified string value.');

	text = Firebolt.text();
	ok(text.nodeType === 3 && text.nodeValue === '', 'Creates a new, empty TextNode when called with no parameters.');
});
