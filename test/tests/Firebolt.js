/**
 * Unit tests for the Firebolt function and namespace
 */

// References for Resharper
/// <reference path="../qunit/qunit.js"/>
/// <reference path="../../src/firebolt.js"/>

module('Firebolt');

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
	strictEqual(Firebolt.data(element, undefined, undefined, 1).stuff, undefined,
		'When retrieving the data store object, it will not have any data at a key that was recently removed.');

	strictEqual(Firebolt.data(element, 'stuff', undefined, 1), 23,
		'Retrieves "data-*" attributes data when it is being retrieved specifically by name and there is currently no data with the same name.');

	strictEqual(Firebolt.data(element, undefined, undefined, 1).stuff, 23,
		'Adds data retrieved from custom "data-*" attributes to the data store object.');

	element = Firebolt.elem('div', {'data-a': '100.000', 'data-b': '1E02', 'data-c': '19.'});
	dataStore = Firebolt.data(element, undefined, undefined, 1);
	ok(dataStore.a === '100.000' && dataStore.b === '1E02' && dataStore.c === '19.',
		'Retrieves numeric values as strings if their numeric representation would look different from the string representation.');
});

test('each', function() {
	expect(23);

	var callback,
		label,
		seen,
		i;

	seen = {};
	Firebolt.each([3, 4, 5], function(v, k) {
		seen[k] = v;
	});
	deepEqual(seen, {'0': 3, '1': 4, '2': 5}, 'Array iteration');

	seen = {};
	Firebolt.each({name: 'name', lang: 'lang'}, function(v, k) {
		seen[k] = v;
	});
	deepEqual(seen, {name: 'name', lang: 'lang'}, 'Object iteration');

	seen = [];
	Firebolt.each([1, 2, 3], function(v, k) {
		seen.push(v);
		if (k === 1) {
			return false;
		}
	});
	deepEqual(seen, [1, 2], 'Broken array iteration');

	seen = [];
	Firebolt.each({a: 1, b: 2, c: 3}, function(v) {
		seen.push(v);
		return false;
	});
	deepEqual(seen, [1], 'Broken object iteration');

	seen = {
		Zero: function() {},
		One: function(a) { a = a; },
		Two: function(a, b) { a = a; b = b; }
	};
	callback = function(v, k) {
		equal(k, 'foo', label + '-argument function treated like object');
	};
	for (i in seen) {
		label = i;
		seen[i].foo = 'bar';
		Firebolt.each(seen[i], callback);
	}

	seen = {
		'undefined': undefined,
		'null': null,
		'false': false,
		'true': true,
		'empty string': '',
		'nonempty string': 'string',
		'string "0"': '0',
		'negative': -1,
		'excess': 1
	};
	callback = function(v, k) {
		equal(k, 'length', 'Object with ' + label + ' length treated like object');
	};
	for (i in seen) {
		label = i;
		Firebolt.each({length: seen[i]}, callback);
	}

	seen = {
		'Sparse Array': new Array(4),
		'length: 1 plain object': {length: 1, '0': true},
		'length: 2 plain object': {length: 2, '0': true, '1': true},
		NodeList: document.getElementsByTagName('html')
	};
	callback = function(v, k) {
		if (seen[label]) {
			delete seen[label];
			equal(k, '0', label + ' treated like array');
			return false;
		}
	};
	for (i in seen) {
		label = i;
		Firebolt.each(seen[i], callback);
	}

	seen = false;
	Firebolt.each({ length: 0 }, function() {
		seen = true;
	});
	ok(!seen, 'length: 0 plain object treated like array');

	seen = false;
	Firebolt.each(document.getElementsByTagName('var'), function() {
		seen = true;
	});
	ok(!seen, 'Empty NodeList treated like array');

	i = 0;
	Firebolt.each(document.styleSheets, function() {
		i++;
	});
	equal(i, 1, 'Iteration over document.styleSheets');
});

test('elem', function() {
	var element = Firebolt.elem('div');
	ok(element.nodeType === 1 && element.nodeName === 'DIV', 'Creates a new Element.');

	element = Firebolt.elem('p', {'class': 'one two', 'data-custom': 'test'});
	ok(element.className === 'one two' && element.getAttribute('data-custom') === 'test',
		'Creates a new element with the specified properties');
});

test('extend', function() {
	expect(31);

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
	deepEqual(settings, merged, 'Check if extended: settings must be extended');
	deepEqual(options, optionsCopy, 'Check if not modified: options must not be modified');

	Firebolt.extend(settings, null, options);
	deepEqual(settings, merged, 'Check if extended: settings must be extended');
	deepEqual(options, optionsCopy, 'Check if not modified: options must not be modified');

	Firebolt.extend(true, deep1, deep2);
	deepEqual(deep1.foo, deepmerged.foo, 'Check if foo: settings must be extended');
	deepEqual(deep2.foo, deep2Copy.foo, 'Check if not deep2: options must not be modified');
	equal(deep1.foo2, document, 'Make sure that a deep clone was not attempted on the document');

	ok(Firebolt.extend(true, {}, nestedarray).arr !== arr, 'Deep extend of object must clone child array');

	ok(Array.isArray(Firebolt.extend(true, {arr: {}}, nestedarray).arr), 'Cloned array have to be an Array');
	ok(Firebolt.isPlainObject(Firebolt.extend(true, {arr: arr}, {arr: {}}).arr), 'Cloned object have to be an plain object');

	empty = {};
	optionsWithLength = {'foo': {'length': -1}};
	Firebolt.extend(true, empty, optionsWithLength);
	deepEqual(empty.foo, optionsWithLength.foo, 'The length property must copy correctly');

	empty = {};
	optionsWithDate = {'foo': {'date': new Date()}};
	Firebolt.extend(true, empty, optionsWithDate);
	deepEqual(empty.foo, optionsWithDate.foo, 'Dates copy correctly');

	/** @constructor */
	MyKlass = function() {};
	customObject = new MyKlass();
	optionsWithCustomObject = {'foo': {'date': customObject}};
	empty = {};
	Firebolt.extend(true, empty, optionsWithCustomObject);
	ok(empty.foo && empty.foo.date === customObject, 'Custom objects copy correctly (no methods)');

	// Makes the class a little more realistic
	MyKlass.prototype = {'someMethod': function() {}};
	empty = {};
	Firebolt.extend(true, empty, optionsWithCustomObject);
	ok(empty.foo && empty.foo.date === customObject, 'Custom objects copy correctly');

	MyNumber = Number;

	ret = Firebolt.extend(true, {foo: 4}, {foo: new MyNumber(5)});
	ok(parseInt(ret.foo, 10) === 5, 'Wrapped numbers copy correctly');

	nullUndef = Firebolt.extend({}, options, {'xnumber2': null});
	ok(nullUndef.xnumber2 === null, 'Check to make sure null values are copied');

	nullUndef = Firebolt.extend({}, options, {'xnumber2': undefined});
	ok(nullUndef.xnumber2 === options.xnumber2, 'Check to make sure undefined values are not copied');

	nullUndef = Firebolt.extend({}, options, {'xnumber0': null});
	ok(nullUndef.xnumber0 === null, 'Check to make sure null values are inserted');

	target = {};
	recursive = {foo: target, bar: 5};
	Firebolt.extend(true, target, recursive);
	deepEqual(target, {bar: 5}, 'Check to make sure a recursive obj doesn not go never-ending loop by not copying it over');

	ret = Firebolt.extend(true, {foo: []}, {foo: [0]});
	equal(ret.foo.length, 1, 'Check to make sure a value with coercion `false` copies over when necessary');

	ret = Firebolt.extend(true, {foo: '1,2,3'}, {foo: [1, 2, 3]});
	ok(typeof ret.foo !== 'string', 'Check to make sure values equal with coercion (but not actually equal) overwrite correctly');

	ret = Firebolt.extend(true, {foo: 'bar'}, {foo: null});
	ok(typeof ret.foo !== 'undefined', 'Make sure a null value does not crash with deep extend');

	obj = {foo: null};
	Firebolt.extend(true, obj, {foo: 'notnull'});
	equal(obj.foo, 'notnull', 'Make sure a null value can be overwritten');

	function func() {}
	Firebolt.extend(func, {key: 'value'});
	equal(func.key, 'value', 'Verify a function can be extended');

	defaults = {xnumber1: 5, xnumber2: 7, xstring1: 'peter', xstring2: 'pan'};
	defaultsCopy = {xnumber1: 5, xnumber2: 7, xstring1: 'peter', xstring2: 'pan'};
	options1 = {xnumber2: 1, xstring2: 'x'};
	options1Copy = {xnumber2: 1, xstring2: 'x'};
	options2 = {xstring2: 'xx', xxx: 'newstringx'};
	options2Copy = {xstring2: 'xx', xxx: 'newstringx'};
	merged2 = {xnumber1: 5, xnumber2: 1, xstring1: 'peter', xstring2: 'xx', xxx: 'newstringx'};

	settings = Firebolt.extend({}, defaults, options1, options2);
	deepEqual(settings, merged2, 'Check if extended: settings must be extended');
	deepEqual(defaults, defaultsCopy, 'Check if not modified: options1 must not be modified');
	deepEqual(options1, options1Copy, 'Check if not modified: options1 must not be modified');
	deepEqual(options2, options2Copy, 'Check if not modified: options2 must not be modified');

	var initial = {
			array: [1, 2, 3, 4],
			object: {}
		},
		result = Firebolt.extend(true, {}, initial);
	deepEqual(result, initial, 'The [result] and [initial] have equal shape and values');
	ok(!Array.isArray(result.object), 'result.object was not paved with an empty array');

	// Extend important prototypes
	Firebolt.extend({res: result});
	ok(NodeList.prototype.res === result && HTMLCollection.prototype.res === result && NodeCollection.prototype.res === result,
		'Extends the prototype of NodeList, HTMLCollection, and NodeCollection when called with only one parameter.');

	// Clean up that last test
	delete NodeList.prototype.res;
	delete HTMLCollection.prototype.res;
	delete NodeCollection.prototype.res;
});

test('frag', function() {
	var fragment = Firebolt.frag(),
		nodes,
		node;

	ok(fragment.nodeType === 11 && fragment.firstChild === null,
		'Creates an empty DocumentFragment when called with no parameters.');

	fragment = Firebolt.frag('<div>content</div>');
	node = fragment.firstChild;
	ok(fragment.nodeType === 11 && node.nodeName === 'DIV' && node.textContent === 'content',
		'Creates a DocumentFragment with the specified HTML content.');

	node = Firebolt.elem('p', {'class': 'class'});
	fragment = Firebolt.frag(node);
	ok(fragment.nodeType === 11 && fragment.firstChild === node,
		'Creates a DocumentFragment and appends an input node to it.');

	nodes = Firebolt('<div>one</div> <p>two</p>');
	fragment = Firebolt.frag(nodes);
	ok(fragment.nodeType === 11 && fragment.childNodes.equals(nodes),
		'Creates a DocumentFragment and appends the input nodes to it.');

	fragment = Firebolt.frag(nodes, node);
	nodes.push(node);
	ok(fragment.nodeType === 11 && fragment.childNodes.equals(nodes),
		'Creates a DocumentFragment and from multiple input parameters.');
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

test('isEmpty', function func() {
	// False
	ok(!Firebolt.isEmpty(0));
	ok(!Firebolt.isEmpty(1));
	ok(!Firebolt.isEmpty('string'));
	ok(!Firebolt.isEmpty([0]));
	ok(!Firebolt.isEmpty({a: ''}));
	ok(!Firebolt.isEmpty(true));
	ok(!Firebolt.isEmpty(false));
	ok(!Firebolt.isEmpty(func));
	ok(!Firebolt.isEmpty(/RegExp/));
	ok(!Firebolt.isEmpty(window));
	ok(!Firebolt.isEmpty(document));
	ok(!Firebolt.isEmpty(document.body));
	ok(!Firebolt.isEmpty(document.getElementsByTagName('div')));
	ok(!Firebolt.isEmpty(document.querySelectorAll('div')));

	// True
	ok(Firebolt.isEmpty(null));
	ok(Firebolt.isEmpty(undefined));
	ok(Firebolt.isEmpty([]));
	ok(Firebolt.isEmpty({}));
	ok(Firebolt.isEmpty(''));
	ok(Firebolt.isEmpty(document.getElementsByTagName('video')));
	ok(Firebolt.isEmpty(document.querySelectorAll('video')));

	var CustomObject = function() { };
	ok(Firebolt.isEmpty(new CustomObject()));
});

test('isEmptyObject', function() {
	// True
	equal(Firebolt.isEmptyObject({}), true, 'An object with no properties is an empty object.');
	equal(Firebolt.isEmptyObject([]), true, 'An empty array is an empty object.');

	// False
	equal(Firebolt.isEmptyObject({a: 1}), false, 'An object with a property is not an empty object.');
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

	var CustomObject = function() { };
	ok(!Firebolt.isPlainObject(new CustomObject()));

	// True
	ok(Firebolt.isPlainObject({}));
});

test("param", function() {
	expect(25);

	var params = {foo: 'bar', 'baz': 42, quux: 'All your base are belong to us'};
	equal(Firebolt.param(params), 'foo=bar&baz=42&quux=All%20your%20base%20are%20belong%20to%20us', 'simple');

	params = {string: 'foo', 'null': null, 'undefined': undefined};
	equal(Firebolt.param(params), 'string=foo&null=&undefined=', 'handle nulls and undefineds properly');

	params = {someName: [1, 2, 3], regularThing: 'blah'};
	equal(Firebolt.param(params), 'someName%5B0%5D=1&someName%5B1%5D=2&someName%5B2%5D=3&regularThing=blah', 'with array');

	params = {foo: ['a', 'b', 'c']};
	equal(Firebolt.param(params), 'foo%5B0%5D=a&foo%5B1%5D=b&foo%5B2%5D=c', 'with array of strings');

	params = {foo: ['baz', 42, 'All your base are belong to us']};
	equal(Firebolt.param(params), 'foo%5B0%5D=baz&foo%5B1%5D=42&foo%5B2%5D=All%20your%20base%20are%20belong%20to%20us', 'more array');

	params = {foo: {bar: 'baz', beep: 42, quux: 'All your base are belong to us'}};
	equal(Firebolt.param(params), 'foo%5Bbar%5D=baz&foo%5Bbeep%5D=42&foo%5Bquux%5D=All%20your%20base%20are%20belong%20to%20us', 'handles objects inside objects');

	params = {a: [1, 2], b: {c: 3, d: [4, 5], e: {x: [6], y: 7, z: [8, 9]}, f: true, g: false, h: undefined}, i: [10, 11], j: true, k: false, l: [undefined, 0], m: 'cowboy%20hat?'};
	equal(decodeURIComponent(Firebolt.param(params)), 'a[0]=1&a[1]=2&b[c]=3&b[d][0]=4&b[d][1]=5&b[e][x][0]=6&b[e][y]=7&b[e][z][0]=8&b[e][z][1]=9&b[f]=true&b[g]=false&b[h]=&i[0]=10&i[1]=11&j=true&k=false&l[0]=&l[1]=0&m=cowboy%20hat?', 'huge structure');

	params = {a: [0, [1, 2], [3, [4, 5], [6]], {b: [7, [8, 9], [{c: 10, d: 11}], [[12]], [[[13]]], {e: {f: {g: [14, [15]]}}}, 16]}, 17]};
	equal(decodeURIComponent(Firebolt.param(params)), 'a[0]=0&a[1][0]=1&a[1][1]=2&a[2][0]=3&a[2][1][0]=4&a[2][1][1]=5&a[2][2][0]=6&a[3][b][0]=7&a[3][b][1][0]=8&a[3][b][1][1]=9&a[3][b][2][0][c]=10&a[3][b][2][0][d]=11&a[3][b][3][0][0]=12&a[3][b][4][0][0][0]=13&a[3][b][5][e][f][g][0]=14&a[3][b][5][e][f][g][1][0]=15&a[3][b][6]=16&a[4]=17', 'nested arrays');

	params = {a: [1, 2], b: {c: 3, d: [4, 5], e: {x: [6], y: 7, z: [8, 9]}, f: true, g: false, h: undefined}, i: [10, 11], j: true, k: false, l: [undefined, 0], m: 'cowboy hat?'};
	equal(Firebolt.param(params, true), 'a=1&a=2&b=%5Bobject%20Object%5D&i=10&i=11&j=true&k=false&l=&l=0&m=cowboy%20hat%3F', 'huge structure, forced traditional');

	params = {a: [1, 2, 3], 'b[]': [4, 5, 6], 'c[d]': [7, 8, 9], e: {f: [10], g: [11, 12], h: 13}};
	equal(decodeURIComponent(Firebolt.param(params)), 'a[0]=1&a[1]=2&a[2]=3&b[][0]=4&b[][1]=5&b[][2]=6&c[d][0]=7&c[d][1]=8&c[d][2]=9&e[f][0]=10&e[g][0]=11&e[g][1]=12&e[h]=13', 'Make sure params are not double-encoded.');

	equal(Firebolt.param({version: '1.4.2'}), 'version=1.4.2', 'Check that object with a version property gets serialized correctly.');

	params = {foo: 'bar', baz: 42, quux: 'All your base are belong to us'};
	equal(Firebolt.param(params, true), 'foo=bar&baz=42&quux=All%20your%20base%20are%20belong%20to%20us', 'simple');

	params = {someName: [1, 2, 3], regularThing: 'blah'};
	equal(Firebolt.param(params, true), 'someName=1&someName=2&someName=3&regularThing=blah', 'with array');

	params = {foo: ['a', 'b', 'c']};
	equal(Firebolt.param(params, true), 'foo=a&foo=b&foo=c', 'with array of strings');

	params = {'foo[]': ['baz', 42, 'All your base are belong to us']};
	equal(Firebolt.param(params, true), 'foo%5B%5D=baz&foo%5B%5D=42&foo%5B%5D=All%20your%20base%20are%20belong%20to%20us', 'more array');

	params = {'foo[bar]': 'baz', 'foo[beep]': 42, 'foo[quux]': 'All your base are belong to us'};
	equal(Firebolt.param(params, true), 'foo%5Bbar%5D=baz&foo%5Bbeep%5D=42&foo%5Bquux%5D=All%20your%20base%20are%20belong%20to%20us', 'even more arrays');

	params = {a: [1, 2], b: {c: 3, d: [4, 5], e: {x: [6], y: 7, z: [8, 9]}, f: true, g: false, h: undefined}, i: [10, 11], j: true, k: false, l: [undefined, 0], m: 'cowboy hat?'};
	equal(Firebolt.param(params, true), 'a=1&a=2&b=%5Bobject%20Object%5D&i=10&i=11&j=true&k=false&l=&l=0&m=cowboy%20hat%3F', 'huge structure');

	params = {a: [0, [1, 2], [3, [4, 5], [6]], {b: [7, [8, 9], [{c: 10, d: 11}], [[12]], [[[13]]], {e: {f: {g: [14, [15]]}}}, 16]}, 17]};
	equal(Firebolt.param(params, true), 'a=0&a=1%2C2&a=3%2C4%2C5%2C6&a=%5Bobject%20Object%5D&a=17', 'Nested arrays (not possible when traditional is true)');

	params = {a: [1, 2], b: {c: 3, d: [4, 5], e: {x: [6], y: 7, z: [8, 9]}, f: true, g: false, h: undefined}, i: [10, 11], j: true, k: false, l: [undefined, 0], m: 'cowboy hat?'};
	equal(decodeURIComponent(Firebolt.param(params, false)), 'a[0]=1&a[1]=2&b[c]=3&b[d][0]=4&b[d][1]=5&b[e][x][0]=6&b[e][y]=7&b[e][z][0]=8&b[e][z][1]=9&b[f]=true&b[g]=false&b[h]=&i[0]=10&i[1]=11&j=true&k=false&l[0]=&l[1]=0&m=cowboy hat?', 'huge structure, forced not traditional');

	params = {param: null};
	equal(Firebolt.param(params, false), 'param=', 'Make sure that null params are not traversed');

	params = {test: {length: 3, foo: 'bar'}};
	equal(Firebolt.param(params, false), 'test%5Blength%5D=3&test%5Bfoo%5D=bar', 'Sub-object with a length property');

	/** @constructor */
	function Record() {
		this.prop = 'val';
	}

	var MyString = String,
		MyNumber = Number;

	params = {'test': new MyString('foo')};
	equal(Firebolt.param(params, false), 'test=foo', 'Do not mistake new String() for a plain object');

	params = {test: new MyNumber(5)};
	equal(Firebolt.param(params, false), 'test=5', 'Do not mistake new Number() for a plain object');

	params = {test: new Date()};
	ok(Firebolt.param(params, false), '(Non empty string returned) Do not mistake new Date() for a plain object');

	// should allow non-native constructed objects
	params = {test: new Record()};
	equal(Firebolt.param(params, false), Firebolt.param({test: {prop: 'val'}}), 'Allow non-native constructed objects');
});

test('parseHTML', function() {
	var fixture = document.getElementById('qunit-fixture'),
		iframe = document.createElement('iframe'),
		element, elements;

	element = Firebolt.parseHTML('<div/>')[0];
	ok(element && element.tagName.toLowerCase() === 'div', 'Can make a simple, single element.');

	ok(element && element.ownerDocument === document,
		'By default, creates elements in the context of the current document.');

	fixture.appendChild(iframe);
	element = Firebolt.parseHTML('<div/>', iframe.contentDocument)[0];
	ok(element && element.ownerDocument === iframe.contentDocument,
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
		ok(element && element.tagName.toLowerCase() === tagName && element.className === 'test',
			'Can make special element: <' + tagName + '>.');
	});

	ok(Firebolt.parseHTML('<p>para</p><br/>').length === 2, 'Can make multiple elements.');

	elements = Firebolt.parseHTML('<p>para</p><br/>', iframe.contentDocument);
	ok(elements.length === 2
		&& elements[0].ownerDocument === iframe.contentDocument
		&& elements[1].ownerDocument === iframe.contentDocument,
		'Can make multiple elements in the context of another document.');

	element = Firebolt.parseHTML('<script>window.parseHTMLTestVal=9</script>')[0];
	fixture.appendChild(element);
	ok(window.parseHTMLTestVal != 9, 'Created scripts are not evaluated.');
});

test('ready', function() {
	expect(2);

	// The document must be done loading for the test to be valid
	if (document.readyState == 'interactive' || document.readyState == 'complete') {
		strictEqual(window.readyTestVal, 1, 'The test value is changed to 1 when the page is ready.');

		Firebolt.ready(function() {
			window.readyTestVal = 2;
		});
		strictEqual(window.readyTestVal, 2, 'The ready function is called immediately if the ready event has already fired.');
	}
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
