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
	strictEqual(Firebolt.data(element, undefined, undefined, 1).stuff, undefined,
		'When retrieving the data store object, it will not have any data at a key that was recently removed.');

	strictEqual(Firebolt.data(element, 'stuff', undefined, 1), 23,
		'Retrieves "data-*" attributes data when it is being retrieved specifically by name and there is currently no data with the same name.');

	strictEqual(Firebolt.data(element, undefined, undefined, 1).stuff, 23,
		'Adds data retrieved from custom "data-*" attributes to the data store object.');
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
		'Sparse Array': Array(4),
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

	var empty, optionsWithLength, optionsWithDate, myKlass,
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
	myKlass = function() {};
	customObject = new myKlass();
	optionsWithCustomObject = {'foo': {'date': customObject}};
	empty = {};
	Firebolt.extend(true, empty, optionsWithCustomObject);
	ok(empty.foo && empty.foo.date === customObject, 'Custom objects copy correctly (no methods)');

	// Makes the class a little more realistic
	myKlass.prototype = {'someMethod': function() {}};
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
	var fragment = $.frag(),
		nodes,
		node;

	ok(fragment.nodeType === 11 && fragment.firstChild === null,
		'Creates an empty DocumentFragment when called with no parameters.');

	fragment = $.frag('<div>content</div>');
	node = fragment.firstChild;
	ok(fragment.nodeType === 11 && node.nodeName === 'DIV' && node.textContent === 'content',
		'Creates a DocumentFragment with the specified HTML content.');

	node = $.elem('p', {'class': 'class'});
	fragment = $.frag(node);
	ok(fragment.nodeType === 11 && fragment.firstChild === node,
		'Creates a DocumentFragment and appends an input node to it.');

	nodes = $('<div>one</div> <p>two</p>');
	fragment = $.frag(nodes);
	ok(fragment.nodeType === 11 && fragment.childNodes.equals(nodes),
		'Creates a DocumentFragment and appends the input nodes to it.');

	fragment = $.frag(nodes, node);
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

	var CustomObject = function() { };
	ok(Firebolt.isEmpty(new CustomObject()));
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
