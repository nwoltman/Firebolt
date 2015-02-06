/**
 * Unit tests for the Firebolt function and namespace
 */

// References for Resharper
/// <reference path="../node_modules/qunitjs/qunit/qunit.js"/>
/// <reference path="../../src/firebolt.js"/>

QUnit.module('Firebolt');

QUnit.test('Firebolt', function(assert) {
	var selectors = {
		id: '#qunit',
		nonExistantId: '#fake',
		tagName: 'div',
		nonExistantTagName: 'fake',
		className: '.class1',
		nonExistantClassName: '.fake',
		multipleClassNames: '.class1.first',
		attribute: '[src]',
		randomQuerySelector: 'body > div, script'
	};

	function arrayLikesAreEqual(a, b) {
		if (a.length !== b.length) return false;

		for (var i = 0; i < a.length; i++) {
			if (a[i] !== b[i]) return false;
		}

		return true;
	}

	for (var selectorType in selectors) {
		var selector = selectors[selectorType];
		var result = Firebolt(selector);
		var expected = document.querySelectorAll(selector);

		assert.ok(result instanceof NodeCollection,
			'Returns a NodeCollection when selecting elements by ' + selectorType + '.');

		assert.ok(arrayLikesAreEqual(result, expected), 'Correctly selects elements by ' + selectorType + '.');
	}

	var elements = Firebolt('<div>content</div><p>hmm<span>col</span></p>');
	assert.ok(elements[0] instanceof HTMLDivElement && elements[0].parentNode === null,
		'Creates elements when the first character in the string is a "<".');
});

QUnit.test('_GET', function(assert) {
	/* global $_GET */
	assert.strictEqual(Firebolt._GET(), $_GET, 'Creates and returns the global $_GET object.');

	// Can't do any other tests if the history.replaceState function does not exist (just IE 9)
	if (!history.replaceState) return;

	var queryString = location.search;

	[
		// 1
		{string: '?', result: {}},

		// 2
		{string: '?a', result: {a: ''}},

		// 3
		{string: '?a&b', result: {a: '', b: ''}},

		// 4
		{string: '?hi=ho&oh=hi', result: {hi: 'ho', oh: 'hi'}},

		// 5
		{string: '?hi=ho&no&oh=hi', result: {hi: 'ho', no: '', oh: 'hi'}},

		// 6
		{string: '?hi=ho&no&oh=', result: {hi: 'ho', no: '', oh: ''}},

		// 7
		{string: '?&hi=ho&&&&no&&&oh=&&', result: {hi: 'ho', no: '', oh: ''}},

		// 8
		{string: '?url-encoded%3F=this%20%26%20that%2Fstuff', result: {'url-encoded?': 'this & that/stuff'}}

	].forEach(function(query, index) {
		history.replaceState('', '', query.string);
		assert.deepEqual(Firebolt._GET(), query.result, 'Correctly parses query string #' + (index + 1) + '.');
	});

	history.replaceState('', '', queryString); // Cleanup
});

QUnit.test('data', function(assert) {
	var object = {},
		dataStore = Firebolt.data(object);

	assert.ok(Firebolt.isPlainObject(dataStore) && Firebolt.isEmptyObject(dataStore),
		'When passed just an object, returns its data store object.');

	assert.ok(Firebolt.isEmptyObject(object),
		'Defines the data store at a non-enumerable property on the specifed object');

	assert.strictEqual(Firebolt.data(object, 'a', 1), object,
		'Returns the passed in object when setting properties.');

	assert.strictEqual(dataStore.a, 1, 'Can store data properties.');

	Firebolt.data(object, {b: 'b', c: null});
	assert.deepEqual(dataStore, {a: 1, b: 'b', c: null}, 'Can store multiple properties at once.');

	assert.strictEqual(Firebolt.data(object, 'a'), 1, 'Can retrieve previously set properties.');

	var element = Firebolt.elem('div', {'data-stuff': 23});
	dataStore = Firebolt.data(element, undefined, undefined, 1);

	assert.strictEqual(dataStore.stuff, 23,
		'Adds data from custom "data-*" attributes on elements to the data store and parses the data to the correct JavaScript type.');

	assert.strictEqual(Firebolt.data(element, 'stuff', undefined, 1), 23,
		'Can retrieve data in custom "data-*" attributes on an element as the correct JavaScript type.');

	Firebolt.data(element, 'stuff', ['a', 'b'], 1);
	assert.deepEqual(dataStore.stuff, ['a', 'b'],
		'Overwrites data retrieved from custom "data-*" attributes on an element when new data with the same key is set.');

	delete dataStore.stuff;
	assert.strictEqual(Firebolt.data(element, undefined, undefined, 1).stuff, undefined,
		'When retrieving the data store object, it will not have any data at a key that was recently removed.');

	assert.strictEqual(Firebolt.data(element, 'stuff', undefined, 1), 23,
		'Retrieves "data-*" attributes data when it is being retrieved specifically by name and there is currently no data with the same name.');

	assert.strictEqual(Firebolt.data(element, undefined, undefined, 1).stuff, 23,
		'Adds data retrieved from custom "data-*" attributes to the data store object.');

	element = Firebolt.elem('div', {'data-a': '100.000', 'data-b': '1E02', 'data-c': '19.'});
	dataStore = Firebolt.data(element, undefined, undefined, 1);
	assert.ok(dataStore.a === '100.000' && dataStore.b === '1E02' && dataStore.c === '19.',
		'Retrieves numeric values as strings if their numeric representation would look different from the string representation.');
});

QUnit.test('elem', function(assert) {
	var element = Firebolt.elem('div');
	assert.ok(element.nodeType === 1 && element.nodeName === 'DIV', 'Creates a new Element.');

	element = Firebolt.elem('p', {'class': 'one two', 'data-custom': 'test'});
	assert.ok(element.className === 'one two' && element.getAttribute('data-custom') === 'test',
		'Creates a new element with the specified properties');
});

QUnit.test('extend', function(assert) {
	assert.expect(30);

	var empty, optionsWithLength, optionsWithDate, MyKlass,
		customObject, optionsWithCustomObject, MyNumber, ret,
		nullUndef, target, recursive, obj,
		defaults, defaultsCopy, options1, options1Copy, options2, options2Copy, merged2,
		settings = {xnumber1: 5, xnumber2: 7, xstring1: 'peter', xstring2: 'pan'},
		options = {xnumber2: 1, xstring2: 'x', xxx: 'newstring'},
		optionsCopy = {xnumber2: 1, xstring2: 'x', xxx: 'newstring'},
		merged = {xnumber1: 5, xnumber2: 1, xstring1: 'peter', xstring2: 'x', xxx: 'newstring'},
		deep1 = {foo: {bar: true}},
		deep2 = {foo: {baz: true}, foo2: document},
		deep2Copy = {foo: {baz: true}, foo2: document},
		deepmerged = {foo: {bar: true, baz: true}, foo2: document},
		arr = [1, 2, 3],
		nestedarray = {arr: arr};

	Firebolt.extend(settings, options);
	assert.deepEqual(settings, merged, 'Check if extended: settings must be extended');
	assert.deepEqual(options, optionsCopy, 'Check if not modified: options must not be modified');

	Firebolt.extend(settings, null, options);
	assert.deepEqual(settings, merged, 'Check if extended: settings must be extended');
	assert.deepEqual(options, optionsCopy, 'Check if not modified: options must not be modified');

	Firebolt.extend(true, deep1, deep2);
	assert.deepEqual(deep1.foo, deepmerged.foo, 'Check if foo: settings must be extended');
	assert.deepEqual(deep2.foo, deep2Copy.foo, 'Check if not deep2: options must not be modified');
	assert.equal(deep1.foo2, document, 'Make sure that a deep clone was not attempted on the document');

	assert.ok(Firebolt.extend(true, {}, nestedarray).arr !== arr, 'Deep extend of object must clone child array');

	assert.ok(Array.isArray(Firebolt.extend(true, {arr: {}}, nestedarray).arr), 'Cloned array have to be an Array');
	assert.ok(Firebolt.isPlainObject(Firebolt.extend(true, {arr: arr}, {arr: {}}).arr),
		'Cloned object have to be an plain object');

	empty = {};
	optionsWithLength = {'foo': {'length': -1}};
	Firebolt.extend(true, empty, optionsWithLength);
	assert.deepEqual(empty.foo, optionsWithLength.foo, 'The length property must copy correctly');

	empty = {};
	optionsWithDate = {'foo': {'date': new Date()}};
	Firebolt.extend(true, empty, optionsWithDate);
	assert.deepEqual(empty.foo, optionsWithDate.foo, 'Dates copy correctly');

	/** @constructor */
	MyKlass = function() {};
	customObject = new MyKlass();
	optionsWithCustomObject = {'foo': {'date': customObject}};
	empty = {};
	Firebolt.extend(true, empty, optionsWithCustomObject);
	assert.ok(empty.foo && empty.foo.date === customObject, 'Custom objects copy correctly (no methods)');

	// Makes the class a little more realistic
	MyKlass.prototype = {'someMethod': function() {}};
	empty = {};
	Firebolt.extend(true, empty, optionsWithCustomObject);
	assert.ok(empty.foo && empty.foo.date === customObject, 'Custom objects copy correctly');

	MyNumber = Number;

	ret = Firebolt.extend(true, {foo: 4}, {foo: new MyNumber(5)});
	assert.ok(parseInt(ret.foo, 10) === 5, 'Wrapped numbers copy correctly');

	nullUndef = Firebolt.extend({}, options, {'xnumber2': null});
	assert.ok(nullUndef.xnumber2 === null, 'Check to make sure null values are copied');

	nullUndef = Firebolt.extend({}, options, {'xnumber2': undefined});
	assert.ok(nullUndef.xnumber2 === options.xnumber2, 'Check to make sure undefined values are not copied');

	nullUndef = Firebolt.extend({}, options, {'xnumber0': null});
	assert.ok(nullUndef.xnumber0 === null, 'Check to make sure null values are inserted');

	target = {};
	recursive = {foo: target, bar: 5};
	Firebolt.extend(true, target, recursive);
	assert.deepEqual(target, {bar: 5},
		'Check to make sure a recursive obj doesn not go never-ending loop by not copying it over');

	ret = Firebolt.extend(true, {foo: []}, {foo: [0]});
	assert.equal(ret.foo.length, 1,
		'Check to make sure a value with coercion `false` copies over when necessary');

	ret = Firebolt.extend(true, {foo: '1,2,3'}, {foo: [1, 2, 3]});
	assert.ok(typeof ret.foo !== 'string',
		'Check to make sure values equal with coercion (but not actually equal) overwrite correctly');

	ret = Firebolt.extend(true, {foo: 'bar'}, {foo: null});
	assert.ok(typeof ret.foo !== 'undefined', 'Make sure a null value does not crash with deep extend');

	obj = {foo: null};
	Firebolt.extend(true, obj, {foo: 'notnull'});
	assert.equal(obj.foo, 'notnull', 'Make sure a null value can be overwritten');

	function func() {}
	Firebolt.extend(func, {key: 'value'});
	assert.equal(func.key, 'value', 'Verify a function can be extended');

	defaults = {xnumber1: 5, xnumber2: 7, xstring1: 'peter', xstring2: 'pan'};
	defaultsCopy = {xnumber1: 5, xnumber2: 7, xstring1: 'peter', xstring2: 'pan'};
	options1 = {xnumber2: 1, xstring2: 'x'};
	options1Copy = {xnumber2: 1, xstring2: 'x'};
	options2 = {xstring2: 'xx', xxx: 'newstringx'};
	options2Copy = {xstring2: 'xx', xxx: 'newstringx'};
	merged2 = {xnumber1: 5, xnumber2: 1, xstring1: 'peter', xstring2: 'xx', xxx: 'newstringx'};

	settings = Firebolt.extend({}, defaults, options1, options2);
	assert.deepEqual(settings, merged2, 'Check if extended: settings must be extended');
	assert.deepEqual(defaults, defaultsCopy, 'Check if not modified: options1 must not be modified');
	assert.deepEqual(options1, options1Copy, 'Check if not modified: options1 must not be modified');
	assert.deepEqual(options2, options2Copy, 'Check if not modified: options2 must not be modified');

	var initial = {
		array: [1, 2, 3, 4],
		object: {}
	};
	var result = Firebolt.extend(true, {}, initial);
	assert.deepEqual(result, initial, 'The [result] and [initial] have equal shape and values');
	assert.ok(!Array.isArray(result.object), 'result.object was not paved with an empty array');
});

QUnit.test('frag', function(assert) {
	var fragment = Firebolt.frag(),
		nodes,
		node;

	assert.ok(fragment.nodeType === 11 && fragment.firstChild === null,
		'Creates an empty DocumentFragment when called with no parameters.');

	fragment = Firebolt.frag('<div>content</div>');
	node = fragment.firstChild;
	assert.ok(fragment.nodeType === 11 && node.nodeName === 'DIV' && node.textContent === 'content',
		'Creates a DocumentFragment with the specified HTML content.');

	node = document.createElement('p');
	node.className = 'class';
	fragment = Firebolt.frag(node);
	assert.ok(fragment.nodeType === 11 && fragment.firstChild === node,
		'Creates a DocumentFragment and appends an input node to it.');

	nodes = Firebolt('<div>one</div> <p>two</p>');
	fragment = Firebolt.frag(nodes);
	assert.ok(fragment.nodeType === 11 && fragment.childNodes.equals(nodes),
		'Creates a DocumentFragment and appends the input nodes to it.');

	fragment = Firebolt.frag(nodes, node);
	nodes.push(node);
	assert.ok(fragment.nodeType === 11 && fragment.childNodes.equals(nodes),
		'Creates a DocumentFragment and from multiple input parameters.');

	node = document.createElement('div');
	node.className = 'fragtest';
	node.appendChild(node.cloneNode());
	document.body.appendChild(node);
	nodes = document.body.getElementsByClassName('fragtest');
	fragment = Firebolt.frag(nodes);
	assert.equal(fragment.firstChild, node, 'Creates a fragment from a live HTMLCollection that reduces'
	             + ' its size by more than 1 when an element in it is appended to the fragment.');
});

QUnit.test('globalEval', function(assert) {
	Firebolt.globalEval('var globalEvalTest1 = true;');
	assert.strictEqual(window.globalEvalTest1, true, 'Executes the passed in code in the global context.');

	Firebolt.globalEval('"use strict"; function globalEvalTest2() { return 10; }');
	assert.strictEqual(window.globalEvalTest2(), 10,
		'Executes code with a strict mode pragma in the global context.');
});

QUnit.test('hasData', function(assert) {
	var object = {};

	assert.strictEqual(Firebolt.hasData(object), false,
		'Correctly reports that an object without Firebolt data does not have data.');

	Firebolt.data(object, 'a', 0);
	assert.strictEqual(Firebolt.hasData(object), true,
		'Correctly reports that an object with Firebolt data has data.');

	Firebolt.removeData(object, 'a');
	assert.strictEqual(Firebolt.hasData(object), false,
		'Correctly reports that an object that used to have Firebolt data does not have data.');

	object = Firebolt.elem('div', {'data-stuff': 23});
	assert.strictEqual(Firebolt.hasData(object), false,
		'Correctly reports that an element that has not had the $.data() function called on it yet does not have data.');

	Firebolt.data(object, undefined, undefined, 1);
	assert.strictEqual(Firebolt.hasData(object), true,
		'Correctly reports that an element with data pulled from a "data-*" attribute has data.');
});

QUnit.test('isEmpty', function func(assert) {
	// False
	assert.ok(!Firebolt.isEmpty(0));
	assert.ok(!Firebolt.isEmpty(1));
	assert.ok(!Firebolt.isEmpty('string'));
	assert.ok(!Firebolt.isEmpty([0]));
	assert.ok(!Firebolt.isEmpty({a: ''}));
	assert.ok(!Firebolt.isEmpty(true));
	assert.ok(!Firebolt.isEmpty(false));
	assert.ok(!Firebolt.isEmpty(func));
	assert.ok(!Firebolt.isEmpty(/RegExp/));
	assert.ok(!Firebolt.isEmpty(window));
	assert.ok(!Firebolt.isEmpty(document));
	assert.ok(!Firebolt.isEmpty(document.body));
	assert.ok(!Firebolt.isEmpty(document.getElementsByTagName('div')));
	assert.ok(!Firebolt.isEmpty(document.querySelectorAll('div')));

	// True
	assert.ok(Firebolt.isEmpty(null));
	assert.ok(Firebolt.isEmpty(undefined));
	assert.ok(Firebolt.isEmpty([]));
	assert.ok(Firebolt.isEmpty({}));
	assert.ok(Firebolt.isEmpty(''));
	assert.ok(Firebolt.isEmpty(document.getElementsByTagName('video')));
	assert.ok(Firebolt.isEmpty(document.querySelectorAll('video')));

	var CustomObject = function() { };
	assert.ok(Firebolt.isEmpty(new CustomObject()));
});

QUnit.test('isEmptyObject', function(assert) {
	// True
	assert.equal(Firebolt.isEmptyObject({}), true, 'An object with no properties is an empty object.');
	assert.equal(Firebolt.isEmptyObject([]), true, 'An empty array is an empty object.');

	// False
	assert.equal(Firebolt.isEmptyObject({a: 1}), false, 'An object with a property is not an empty object.');
});

QUnit.test('isPlainObject', function func(assert) {
	// False
	assert.ok(!Firebolt.isPlainObject(1));
	assert.ok(!Firebolt.isPlainObject('string'));
	assert.ok(!Firebolt.isPlainObject(undefined));
	assert.ok(!Firebolt.isPlainObject(null));
	assert.ok(!Firebolt.isPlainObject([]));
	assert.ok(!Firebolt.isPlainObject([{}]));
	assert.ok(!Firebolt.isPlainObject(true));
	assert.ok(!Firebolt.isPlainObject(/RegExp/));
	assert.ok(!Firebolt.isPlainObject(func));
	assert.ok(!Firebolt.isPlainObject(window));
	assert.ok(!Firebolt.isPlainObject(document));
	assert.ok(!Firebolt.isPlainObject(document.body));
	assert.ok(!Firebolt.isPlainObject(document.createTextNode('text')));
	assert.ok(!Firebolt.isPlainObject(document.getElementsByTagName('div')));
	assert.ok(!Firebolt.isPlainObject(document.querySelectorAll('div')));

	var CustomObject = function() { };
	assert.ok(!Firebolt.isPlainObject(new CustomObject()));

	// True
	assert.ok(Firebolt.isPlainObject({}));
});

QUnit.test("param", function(assert) {
	assert.expect(25);

	var params = {foo: 'bar', 'baz': 42, quux: 'All your base are belong to us'};
	assert.equal(Firebolt.param(params), 'foo=bar&baz=42&quux=All%20your%20base%20are%20belong%20to%20us', 'simple');

	params = {string: 'foo', 'null': null, 'undefined': undefined};
	assert.equal(Firebolt.param(params), 'string=foo&null=&undefined=', 'handle nulls and undefineds properly');

	params = {someName: [1, 2, 3], regularThing: 'blah'};
	assert.equal(Firebolt.param(params), 'someName%5B0%5D=1&someName%5B1%5D=2&someName%5B2%5D=3&regularThing=blah',
		'with array');

	params = {foo: ['a', 'b', 'c']};
	assert.equal(Firebolt.param(params), 'foo%5B0%5D=a&foo%5B1%5D=b&foo%5B2%5D=c', 'with array of strings');

	params = {foo: ['baz', 42, 'All your base are belong to us']};
	assert.equal(Firebolt.param(params), 'foo%5B0%5D=baz&foo%5B1%5D=42&foo%5B2%5D=All%20your%20base%20are%20belong%20to%20us',
		'more array');

	params = {foo: {bar: 'baz', beep: 42, quux: 'All your base are belong to us'}};
	assert.equal(Firebolt.param(params), 'foo%5Bbar%5D=baz&foo%5Bbeep%5D=42&foo%5Bquux%5D=All%20your%20base%20are%20belong%20to%20us',
		'handles objects inside objects');

	params = {a: [1, 2], b: {c: 3, d: [4, 5], e: {x: [6], y: 7, z: [8, 9]}, f: true, g: false, h: undefined}, i: [10, 11], j: true, k: false, l: [undefined, 0], m: 'cowboy%20hat?'};
	assert.equal(decodeURIComponent(Firebolt.param(params)), 'a[0]=1&a[1]=2&b[c]=3&b[d][0]=4&b[d][1]=5&b[e][x][0]=6&b[e][y]=7&b[e][z][0]=8&b[e][z][1]=9&b[f]=true&b[g]=false&b[h]=&i[0]=10&i[1]=11&j=true&k=false&l[0]=&l[1]=0&m=cowboy%20hat?',
		'huge structure');

	params = {a: [0, [1, 2], [3, [4, 5], [6]], {b: [7, [8, 9], [{c: 10, d: 11}], [[12]], [[[13]]], {e: {f: {g: [14, [15]]}}}, 16]}, 17]};
	assert.equal(decodeURIComponent(Firebolt.param(params)), 'a[0]=0&a[1][0]=1&a[1][1]=2&a[2][0]=3&a[2][1][0]=4&a[2][1][1]=5&a[2][2][0]=6&a[3][b][0]=7&a[3][b][1][0]=8&a[3][b][1][1]=9&a[3][b][2][0][c]=10&a[3][b][2][0][d]=11&a[3][b][3][0][0]=12&a[3][b][4][0][0][0]=13&a[3][b][5][e][f][g][0]=14&a[3][b][5][e][f][g][1][0]=15&a[3][b][6]=16&a[4]=17',
		'nested arrays');

	params = {a: [1, 2], b: {c: 3, d: [4, 5], e: {x: [6], y: 7, z: [8, 9]}, f: true, g: false, h: undefined}, i: [10, 11], j: true, k: false, l: [undefined, 0], m: 'cowboy hat?'};
	assert.equal(Firebolt.param(params, true), 'a=1&a=2&b=%5Bobject%20Object%5D&i=10&i=11&j=true&k=false&l=&l=0&m=cowboy%20hat%3F',
		'huge structure, forced traditional');

	params = {a: [1, 2, 3], 'b[]': [4, 5, 6], 'c[d]': [7, 8, 9], e: {f: [10], g: [11, 12], h: 13}};
	assert.equal(decodeURIComponent(Firebolt.param(params)), 'a[0]=1&a[1]=2&a[2]=3&b[][0]=4&b[][1]=5&b[][2]=6&c[d][0]=7&c[d][1]=8&c[d][2]=9&e[f][0]=10&e[g][0]=11&e[g][1]=12&e[h]=13',
		'Make sure params are not double-encoded.');

	assert.equal(Firebolt.param({version: '1.4.2'}), 'version=1.4.2',
		'Check that object with a version property gets serialized correctly.');

	params = {foo: 'bar', baz: 42, quux: 'All your base are belong to us'};
	assert.equal(Firebolt.param(params, true), 'foo=bar&baz=42&quux=All%20your%20base%20are%20belong%20to%20us',
		'simple');

	params = {someName: [1, 2, 3], regularThing: 'blah'};
	assert.equal(Firebolt.param(params, true), 'someName=1&someName=2&someName=3&regularThing=blah', 'with array');

	params = {foo: ['a', 'b', 'c']};
	assert.equal(Firebolt.param(params, true), 'foo=a&foo=b&foo=c', 'with array of strings');

	params = {'foo[]': ['baz', 42, 'All your base are belong to us']};
	assert.equal(Firebolt.param(params, true), 'foo%5B%5D=baz&foo%5B%5D=42&foo%5B%5D=All%20your%20base%20are%20belong%20to%20us',
		'more array');

	params = {'foo[bar]': 'baz', 'foo[beep]': 42, 'foo[quux]': 'All your base are belong to us'};
	assert.equal(Firebolt.param(params, true), 'foo%5Bbar%5D=baz&foo%5Bbeep%5D=42&foo%5Bquux%5D=All%20your%20base%20are%20belong%20to%20us',
		'even more arrays');

	params = {a: [1, 2], b: {c: 3, d: [4, 5], e: {x: [6], y: 7, z: [8, 9]}, f: true, g: false, h: undefined}, i: [10, 11], j: true, k: false, l: [undefined, 0], m: 'cowboy hat?'};
	assert.equal(Firebolt.param(params, true), 'a=1&a=2&b=%5Bobject%20Object%5D&i=10&i=11&j=true&k=false&l=&l=0&m=cowboy%20hat%3F',
		'huge structure');

	params = {a: [0, [1, 2], [3, [4, 5], [6]], {b: [7, [8, 9], [{c: 10, d: 11}], [[12]], [[[13]]], {e: {f: {g: [14, [15]]}}}, 16]}, 17]};
	assert.equal(Firebolt.param(params, true), 'a=0&a=1%2C2&a=3%2C4%2C5%2C6&a=%5Bobject%20Object%5D&a=17',
		'Nested arrays (not possible when traditional is true)');

	params = {a: [1, 2], b: {c: 3, d: [4, 5], e: {x: [6], y: 7, z: [8, 9]}, f: true, g: false, h: undefined}, i: [10, 11], j: true, k: false, l: [undefined, 0], m: 'cowboy hat?'};
	assert.equal(decodeURIComponent(Firebolt.param(params, false)), 'a[0]=1&a[1]=2&b[c]=3&b[d][0]=4&b[d][1]=5&b[e][x][0]=6&b[e][y]=7&b[e][z][0]=8&b[e][z][1]=9&b[f]=true&b[g]=false&b[h]=&i[0]=10&i[1]=11&j=true&k=false&l[0]=&l[1]=0&m=cowboy hat?',
		'huge structure, forced not traditional');

	params = {param: null};
	assert.equal(Firebolt.param(params, false), 'param=', 'Make sure that null params are not traversed');

	params = {test: {length: 3, foo: 'bar'}};
	assert.equal(Firebolt.param(params, false), 'test%5Blength%5D=3&test%5Bfoo%5D=bar',
		'Sub-object with a length property');

	/** @constructor */
	function Record() {
		this.prop = 'val';
	}

	var MyString = String,
		MyNumber = Number;

	params = {'test': new MyString('foo')};
	assert.equal(Firebolt.param(params, false), 'test=foo', 'Do not mistake new String() for a plain object');

	params = {test: new MyNumber(5)};
	assert.equal(Firebolt.param(params, false), 'test=5', 'Do not mistake new Number() for a plain object');

	params = {test: new Date()};
	assert.ok(Firebolt.param(params, false),
		'(Non empty string returned) Do not mistake new Date() for a plain object');

	// should allow non-native constructed objects
	params = {test: new Record()};
	assert.equal(Firebolt.param(params, false), Firebolt.param({test: {prop: 'val'}}),
		'Allow non-native constructed objects');
});

QUnit.test('parseHTML', function(assert) {
	var fixture = document.getElementById('qunit-fixture'),
		iframe = document.createElement('iframe'),
		element, elements;

	element = Firebolt.parseHTML('<div/>')[0];
	assert.ok(element && element.tagName.toLowerCase() === 'div', 'Can make a simple, single element.');

	assert.ok(element && element.ownerDocument === document,
		'By default, creates elements in the context of the current document.');

	fixture.appendChild(iframe);
	element = Firebolt.parseHTML('<div/>', iframe.contentDocument)[0];
	assert.ok(element && element.ownerDocument === iframe.contentDocument,
		'Can create a simple element in the context of another document.');

	[
		'option',
		'optgroup',
		'thead',
		'tbody',
		'tfoot',
		'colgroup',
		'caption',
		'tr',
		'col',
		'td',
		'th',
		'script',
		'link',
		'legend'
	].forEach(function(tagName) {
		element = Firebolt.parseHTML('<' + tagName + ' class="test" />')[0];
		assert.ok(element && element.tagName.toLowerCase() === tagName && element.className === 'test',
			'Can make special element: <' + tagName + '>.');
	});

	assert.ok(Firebolt.parseHTML('<p>para</p><br/>').length === 2, 'Can make multiple elements.');

	elements = Firebolt.parseHTML('<p>para</p><br/>', iframe.contentDocument);
	assert.ok(elements.length === 2
	          && elements[0].ownerDocument === iframe.contentDocument
	          && elements[1].ownerDocument === iframe.contentDocument,
		'Can make multiple elements in the context of another document.');

	element = Firebolt.parseHTML('<script>window.parseHTMLTestVal=9</script>')[0];
	fixture.appendChild(element);
	assert.ok(window.parseHTMLTestVal != 9, 'Created scripts are not evaluated.');

	assert.ok(Firebolt.parseHTML('<div>content</div><p><br></p>', null, true) instanceof HTMLDivElement,
		'Returns a single node when the `single` parameter is truthy.');

	element = Firebolt.parseHTML('<p>para</p>random text', iframe.contentDocument, 1);
	assert.ok(element instanceof iframe.contentWindow.HTMLParagraphElement
	          && element.ownerDocument === iframe.contentDocument,
		'Can make and return a single node in the context of another document.');
});

QUnit.test('ready', function(assert) {
	assert.expect(3);

	assert.strictEqual(window.readyTestVal, 1, 'Calls a callback when the page is ready.');

	assert.strictEqual(window.readyTestVal2, true, 'Calls multiple callbacks in order when the page is ready.');

	Firebolt.ready(function() {
		window.readyTestVal = 2;
	});
	assert.strictEqual(window.readyTestVal, 2,
		'The ready function is called immediately if the ready event has already fired.');
});

QUnit.test('removeData', function(assert) {
	var object = {},
		testData = {a: 1, b: 2, c: 3},
		dataStore = Firebolt.data(object, testData);

	Firebolt.removeData(object, 'a');
	assert.ok(!('a' in dataStore), 'Removes a single piece of data.');

	Firebolt.data(object, testData);
	Firebolt.removeData(object, 'a b');
	assert.ok(!('a' in dataStore) && !('b' in dataStore),
		'Removes multiple pieces of data when given a space-separated string.');

	Firebolt.data(object, testData);
	Firebolt.removeData(object, ['b', 'c']);
	assert.ok(!('b' in dataStore) && !('c' in dataStore),
		'Removes multiple pieces of data when given an array of strings.');

	Firebolt.data(object, testData);
	Firebolt.removeData(object);
	assert.ok(Firebolt.isEmptyObject(dataStore), 'Removes all data when called with no specified values.');

	object = Firebolt.elem('div', {'data-test': true});
	dataStore = Firebolt.data(object, undefined, undefined, 1);
	Firebolt.removeData(object, 'test');
	assert.ok(!('test' in dataStore), 'Removes a single piece of data that was pulled from a "data-*" attribute.');
});

QUnit.test('text', function(assert) {
	var text = Firebolt.text('hello');
	assert.ok(text.nodeType === 3 && text.nodeValue === 'hello',
		'Creates a new TextNode with the specified string value.');

	text = Firebolt.text();
	assert.ok(text.nodeType === 3 && text.nodeValue === '',
		'Creates a new, empty TextNode when called with no parameters.');
});
