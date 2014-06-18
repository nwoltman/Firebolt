/**
 * Firebolt current core file.
 * @version 0.5.0
 * @author Nathan Woltman
 * @copyright 2014 Nathan Woltman
 * @license MIT https://github.com/FireboltJS/Firebolt/blob/master/LICENSE.txt
 */

(function(window, document, Array, Object, decodeURIComponent, encodeURIComponent) {
	'use strict';

//#region =========================== Private ================================

/** 
 * Calls the function with the passed in name on each element in a NodeCollection.
 * 
 * @private
 * @param {String} fn - The name of a function in HTMLElement's prototype.
 * @returns {NodeCollection|NodeList|HTMLCollection} A reference to the NodeCollection.
 */
function callOnEachElement(fn) {
	fn = HTMLElementPrototype[fn];

	return function() {
		var len = this.length,
			i = 0;
		for (; i < len; i++) {
			if (this[i].nodeType === 1) {
				fn.apply(this[i], arguments);
			}
		}
		return this;
	};
}

/*
 * @see Firebolt.create
 */
function createElement(tagName, attributes) {
	var el = document.createElement(tagName);
	return attributes ? el.attr(attributes) : el;
}

/**
 * Creates a new DocumentFragment and (optionally) appends the passed in content to it.
 * 
 * @private
 * @param {ArgumentsList} [content] - List of content to append to the new DocumentFragment.
 * @returns {DocumentFragment} The new fragment.
 */
function createFragment(content) {
	var fragment = document.createDocumentFragment(),
		i = 0,
		item;

	for (; i < content.length; i++) {
		if (isNode(item = content[i])) {
			fragment.appendChild(item);
		}
		else {
			if (typeofString(item)) {
				item = htmlToNodes(item);
			}
			var origLen = item.length,
				j = 1;
			if (origLen) {
				fragment.appendChild(item[0]);
				if (item.length < origLen) { //item is a live NodeList/HTMLCollection
					for (; j < origLen; j++) {
						fragment.appendChild(item[0]);
					}
				}
				else { //item is a static collection of nodes
					for (; j < origLen; j++) {
						fragment.appendChild(item[j]);
					}
				}
			}
		}
	}

	return fragment;
}

//#region Data Functions

/**
 * Having this function allows for code reuse when storing private vs. user-accessible data.
 * @private
 * @param {String} dataStore - The key to the stored data object.
 * @param {Object} obj - The object to store arbitrary data on.
 * @see HTMLElement#data
 */
function data(dataStore, obj, key, value) {
	var dataObject = obj[dataStore],
		dataAttributes,
		i;

	if (!dataObject) {
		//Define a non-enumerable object
		defineProperty(obj, dataStore, {
			value: dataObject = {}
		});

		//If the object is an Element, try loading "data-*" attributes
		if (obj && obj.nodeType === 1) {
			var attributes = obj.attributes,
				numAttributes = attributes.length,
				attrib,
				val;

			dataAttributes = {};

			for (i = 0; i < numAttributes; i++) {
				attrib = attributes[i];
				if (attrib.name.startsWith('data-')) {
					if (!rgxNoParse.test(val = attrib.value)) {
						//Try to parse the value
						try {
							val = JSON.parse(val);
						}
						catch (e) { }
					}
					//Set the value in the data object (remembering to remove the "data-" part from the name)
					dataAttributes[attrib.name.slice(5)] = val;
				}
			}

			//Save the data privately if there is any
			if (!isEmptyObject(dataAttributes)) {
				dataPrivate(obj, KEY_DATA_ATTRIBUTES, dataAttributes);
			}
		}
	}

	/* This may look confusing but it's really saving space (as in the amount of code in the file).
	 * What's happening is that `dataAttributes` is getting set to itself (if it was created above)
	 * or it is set to the private data and is then checked to see if it is an empty object. */
	if (dataObject[DATA_KEY_PRIVATE] && !isEmptyObject(dataAttributes = dataAttributes || dataObject[DATA_KEY_PRIVATE][KEY_DATA_ATTRIBUTES])) {
		//Add the data attributes to the data object if it does not already have the key
		for (i in dataAttributes) {
			if (isUndefined(dataObject[i])) {
				dataObject[i] = dataAttributes[i];
			}
		}
	}

	if (isUndefined(value)) {
		if (typeof key == 'object') {
			extend(dataObject, key); //Set multiple
		}
		else {
			return isUndefined(key) ? dataObject : dataObject[key]; //Get data object or value
		}
	}
	else {
		dataObject[key] = value; //Set value
	}
	
	return obj;
}

/* For saving data for internal use */
function dataPrivate(obj, key, value) {
	//The internal data is actually saved to the public data object
	return data(
		DATA_KEY_PRIVATE,
		obj[DATA_KEY_PUBLIC] || data(DATA_KEY_PUBLIC, obj),
		key,
		value
	);
}

/*
 * @see Firebolt.removeData
 */
function removeData(object, input) {
	var dataObject = object[DATA_KEY_PUBLIC],
		i = 0;

	if (isUndefined(input)) {
		if (dataObject[DATA_KEY_PRIVATE]) {
			//Try deleting the data attributes object in case it was saved to the object (element)
			delete dataObject[DATA_KEY_PRIVATE][KEY_DATA_ATTRIBUTES];
		}
		input = Object.keys(dataObject); //Select all items for removal
	}
	else if (typeofString(input)) {
		input = input.split(' ');
	}

	for (; i < input.length; i++) {
		delete dataObject[input[i]];
	}

	return object;
}

//#endregion Data Functions

/*
 * @see Firebolt.extend
 */
function extend(target) {
	var numArgs = arguments.length,
		i = 1,
		arg,
		key;

	if (numArgs > 1) {
		if (target === true) { //`target` was actually the `deep` variable; extend recursively
			return extendDeep.apply(0, ArrayPrototype.slice.call(arguments, 1));
		}
		if (!target) { //`target` was actually the `deep` variable, but was false
			target = arguments[i++];
		}

		//Extend the target object
		for (; i < numArgs; i++) {
			arg = arguments[i];
			for (key in arg) {
				target[key] = arg[key];
			}
		}
		return target;
	}

	//Extend the Firebolt objects
	extend(NodeCollectionPrototype, target);
	extend(NodeListPrototype, target);
	extend(HTMLCollectionPrototype, target);
}

/*
 * @see Firebolt.extend
 */
function extendDeep(target) {
	var numArgs = arguments.length,
		i = 1,
		arg,
		key,
		val,
		tval;

	//Extend the target object, extending recursively if the new value is a plain object
	for (; i < numArgs; i++) {
		arg = arguments[i];
		for (key in arg) {
			tval = target[key];
			val = arg[key];
			if (tval !== val) {
				if (isPlainObject(val)) {
					val = extendDeep(isPlainObject(tval) ? tval : {}, val);
				}
				target[key] = val;
			}
		}
	}

	return target;
}

/*
 * Returns the status text string for AJAX requests.
 */
function getAjaxErrorStatus(xhr) {
	return xhr.statusText.replace(xhr.status + ' ', '');
}

/** 
 * Returns a function that calls the function with the passed in name on each element in a NodeCollection unless
 * the callback returns true, in which case the result of calling the function on the first element is returned.
 * 
 * @private
 * @param {String} fn - The name of a function in HTMLElement's prototype.
 * @param {Function} callback(numArgs, firstArg) - Function to determine if the value of the first element should be returned.
 */
function getFirstSetEachElement(fn, callback) {
	fn = HTMLElementPrototype[fn];

	return function(firstArg) {
		var items = this,
			len = items.length,
			i = 0;

		if (!callback(arguments.length, firstArg)) {
			//Set each
			for (; i < len; i++) {
				if (items[i].nodeType === 1) {
					fn.apply(items[i], arguments);
				}
			}
			return items;
		}

		//Get first
		for (; i < len; i++) {
			if (items[i].nodeType === 1) {
				return fn.call(items[i], firstArg); //Only need first arg for getting
			}
		}
	};
}

/*
 * Returns a function that creates a set of elements in a certain direction around a given node (i.e. parents, children, siblings).
 * 
 * @param {String} funcName - The name of a function that retrieves elements for a single node.
 * @param {Function|?} sorter - A function used to sort the union of multiple sets of returned elements.
 * If sorter == 0, return an 'until' Node function.
 */
function getGetDirElementsFunc(direction, sorter) {
	//For NodeCollection.prototype
	if (sorter) {
		return function(arg1, arg2) {
			var len = this.length;

			//Simple and speedy for one node
			if (len === 1) {
				return this[0][direction](arg1, arg2);
			}

			//Build a list of NodeCollections
			var collections = [],
				i = 0;
			for (; i < len; i++) {
				collections.push(this[i][direction](arg1, arg2));
			}

			//Union the collections so that the resulting collection contains unique elements
			//and return the sorted result
			return ArrayPrototype.union.apply(NodeCollectionPrototype, collections).sort(sorter);
		};
	}

	//For Node.prototype
	return sorter == 0
		//nextUntil, prevUntil, parentsUntil
		? function(until, filter) {
			var nc = new NodeCollection(),
				node = this,
				stop = typeofString(until)
					? function() { //Match by selector
						return node.matches(until);
					}
					: until && until.length
						? function() { //Match by Node[]
							return until.contains(node);
						}
						: function() { //Match by Node (or if `until.length === 0`, this will always be false)
							return node == until;
						};
			while ((node = node[direction]) && !stop()) {
				if (!filter || node.matches(filter)) {
					nc.push(node);
				}
			}
			return nc;
		}
		//nextAll, prevAll, parents
		: function(selector) {
			var nc = new NodeCollection(),
				node = this;
			while (node = node[direction]) {
				if (!selector || node.matches(selector)) {
					nc.push(node);
				}
			}
			return nc;
		};
};

/*
 * Returns a function for Node#next(), Node#prev(), NodeCollection#next(), or NodeCollection#prev().
 * 
 * @param {Boolean} [forNode=false] - If truthy, returns the function for Node.prototype (else the NodeCollection version).
 */
function getNextOrPrevFunc(dirElementSibling, forNode) {
	return forNode
		? function(selector) {
			var sibling = this[dirElementSibling];
			return (!selector || sibling && sibling.matches(selector)) && sibling || null;
		}
		: function(selector) {
			var nc = new NodeCollection(),
				i = 0,
				sibling;
			for (; i < this.length; i++) {
				sibling = this[i][dirElementSibling];
				if (sibling && (!selector || sibling.matches(selector))) {
					nc.push(sibling);
				}
			}
			return nc;
		};
}

/* 
 * Returns the function body for Node#[putAfter, putBefore, or prependTo]
 * 
 * @param {Function} insertingCallback(newNode, refNode) - The callback that performs the insertion.
 */
function getNodeInsertingFunction(insertingCallback) {
	return function(target) {
		if (typeofString(target)) {
			target = Firebolt(target);
		}
		else if (isNode(target)) {
			insertingCallback(this, target);
			return this;
		}

		var i = target.length;
		if (i--) {
			for (; i > 0; i--) {
				insertingCallback(this.cloneNode(true), target[i]);
			}
			insertingCallback(this, target[0]);
		}

		return this;
	}
}

/* Returns the function body for NodeCollection#[putAfter, putBefore, appendTo, or prependTo] */
function getPutOrToFunction(funcName) {
	return function(target) {
		(typeofString(target) ? Firebolt(target) : target)[funcName](this);

		return this;
	}
}

/*
 * Takes an HTML string and returns a NodeList created by the HTML.
 */
function htmlToNodes(html) {
	//Speedy for normal elements -- just create a <body>, set its HTML, and retrieve the produced nodes
	var elem = document.createElement('body'),
		nodes;
	elem.innerHTML = html;
	nodes = elem.childNodes;

	//If no nodes were created, it might be because browsers won't create certain elements in a body tag
	//Such elements include <thead>, <tbody>, <tfoot>, <tr>, <td>, <head>, <body>, <html>
	if (!nodes.length && html) { //Check html to make sure it's not an empty string
		if (html.contains('<tr')) {
			elem = createElement('tbody');
		}
		else if (html.contains('<td')) {
			elem = createElement('tr');
		}
		else if (rgxTableLevel1.test(html)) {
			elem = createElement('table');
		}
		else {
			elem = createElement('html');

			if (html.startsWith('<html')) {
				return new NodeCollection(elem);
			}

			elem.innerHTML = html;

			if (html.contains('<head')) {
				return new NodeCollection(elem.firstChild);
			}
			if (html.contains('<body')) {
				return new NodeCollection(elem.lastChild);
			}
		}

		elem.innerHTML = html;
		nodes = elem.childNodes;
	}

	return nodes;
}

/*
 * Function for inserting a node after a reference node.
 */
function insertAfter(newNode, refNode) {
	refNode.parentNode.insertBefore(newNode, refNode.nextSibling);
}

/*
 * Function for inserting a node before a reference node.
 */
function insertBefore(newNode, refNode) {
	refNode.parentNode.insertBefore(newNode, refNode);
}

/*
 * @see Firebolt.isEmptyObject
 */
function isEmptyObject(object) {
	for (var item in object) {
		return false;
	}
	return true;
}

/*
 * Specifically for the Firebolt selector.
 * Determines if the input is actually an HTML string instead of a CSS selector.
 * 
 * Rationale:
 * 
 * The string can only be considered HTML if it contains the tag open character: '<'.
 * Normally, this character should never appear in a CSS selector, however it is possible
 * for an element to have an attribute with a value that contains the '<' character.
 * Here's an example:
 * 
 * <div data-notcool="<tag>"></div>
 * 
 * Hence, this element should be able to be selected with the following CSS selector:
 * 
 * [data-notcool="<tag>"]
 * 
 * So for the string to truly be HTML, not only must it contain the '<' character, but
 * the first instance of that character must also be found in the string before any
 * instance of the '[' character.
 * 
 * The reason the '[' character is not searched for if the index of the '<' character is
 * less that 4 is because the smallest possible CSS selector that contains '<' is this:
 * 
 * [d="<"]
 * 
 * This also means that if '<' is found in the string, we only need to start searching for
 * a '[' beginning at the index 4 less than the index the fist '<' was found at. 
 * 
 * @param {String} str
 * @returns 1 if the string is deemed to be an HTML string; else 0.
 */
function isHtml(str) {
	var idxTag = str.indexOf('<');
	if (idxTag >= 0 && (idxTag < 4 || str.lastIndexOf('[', idxTag - 4) < 0)) {
		return 1;
	}
	return 0;
}

/*
 * @see Firebolt.isPlainObject
 */
function isPlainObject(obj) {
	return obj && obj.toString() == '[object Object]';
}

function isUndefined(value) {
	return value === undefined;
}

/*
 * Prepends a node to a reference node. 
 */
function prepend(newNode, refNode) {
	refNode.insertBefore(newNode, refNode.firstChild);
}

function sortDocOrder(a, b) {
	var pos = a.compareDocumentPosition(b);
	if (pos & 4) { //Node a should come first
		pos = -1;
	}
	else if (pos & 1) { //Nodes are in different documents
		pos = 0;
	}
	//else node b should come first (pos is already positive)
	return pos;
}

function sortRevDocOrder(a, b) {
	var pos = a.compareDocumentPosition(b);
	if (pos & 2) { //Node b should come first
		pos = -1;
	}
	else if (pos & 1) { //Nodes are in different documents
		pos = 0;
	}
	//else node a should come first (pos is already positive)
	return pos;
}

function typeofString(value) {
	return typeof value == 'string';
}

var
	/*
	 * Determines if an item is a Node.
	 * Gecko's instanceof Node is faster (but might want to check if that's because it caches previous calls).
	 */
	isNode = window.mozInnerScreenX != null
		? function(obj) {
			return obj instanceof Node;
		}
		: function(obj) {
			return obj && obj.nodeType;
		},

	/*
	 * Local variables that are compressed when this file is minified.
	 */
	prototype = 'prototype',
	ArrayPrototype = Array[prototype],
	ElementPrototype = Element[prototype],
	HTMLElementPrototype = HTMLElement[prototype],
	NodePrototype = Node[prototype],
	NodeListPrototype = NodeList[prototype],
	HTMLCollectionPrototype = HTMLCollection[prototype],
	StringPrototype = String[prototype],
	defineProperty = Object.defineProperty,
	defineProperties = Object.defineProperties,

	//Property strings
	nextElementSibling = 'nextElementSibling',
	previousElementSibling = 'previousElementSibling',

	//Data variables
	DATA_KEY_PUBLIC = ('FB' + 1 / Math.random()).replace('.', ''),
	DATA_KEY_PRIVATE = ('FB' + 1 / Math.random()).replace('.', ''),
	KEY_DATA_ATTRIBUTES = '0',
	KEY_TOGGLE_CLASS = '1',
	rgxNoParse = /^\d+\D/, //Matches strings that look like numbers but have non-digit characters

	/* Pre-built RegExps */
	rgxTableLevel1 = /<t(?:h|b|f)/i, //Detects (non-deprected) first-level table elements: <thead>, <tbody>, <tfoot>
	rgxGetOrHead = /GET|HEAD/i, //Determines if a request is a GET or HEAD request
	rgxDomain = /\/?\/\/(?:\w+\.)?(.*?)(?:\/|$)/,
	rgxDifferentNL = /^(?:af|ap|be|ea|ins|prep|pu|tog)|remove(?:Class)?$/, //Determines if the function is different for NodeLists
	rgxNotId = /[ .,>:[+~\t-\f]/, //Matches other characters that cannot be in an id selector
	rgxNotClass = /[ #,>:[+~\t-\f]/, //Matches other characters that cannot be in a class selector
	rgxAllDots = /\./g,
	rgxNotTag = /[^A-Za-z]/,
	rgxNonWhitespace = /\S+/g,
	rgxSpaceChars = /[ \t-\f]+/, //From W3C http://www.w3.org/TR/html5/single-page.html#space-character

	/* AJAX */
	timestamp = Date.now(),
	oldCallbacks = [],
	ajaxSettings = {
		accept: {
			'*': '*/*',
			html: 'text/html',
			json: 'application/json, text/javascript',
			script: 'text/javascript, application/javascript, application/ecmascript, application/x-ecmascript',
			text: 'text/plain',
			xml: 'application/xml, text/xml'
		},
		async: true,
		contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
		headers: {'X-Requested-With': 'XMLHttpRequest'},
		isLocal: /^(?:file|.*-extension|widget):\/\//.test(location.href),
		jsonp: 'callback',
		jsonpCallback: function() {
			var callback = oldCallbacks.pop() || DATA_KEY_PUBLIC + "_" + (timestamp++);
			this[callback] = true;
			return callback;
		},
		type: 'GET',
		url: location.href,
		xhr: XMLHttpRequest
	},

	_$ = window.$, //Save the `$` variable in case something else is currently using it

	any, //Arbitrary variable that may be used for whatever

//#endregion Private


//#region ============================ Array =================================

/**
 * @class Array
 * @classdesc The JavaScript Array object.
 * @mixes Object
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array|Array - JavaScript | MDN}
 */

arrayExtensions = {
	/* Private reference to the constructor */
	__C__: Array,

	/**
	 * Returns a copy of the array with all "empty" items (as defined by {@linkcode Firebolt.isEmpty}) removed.
	 * 
	 * @function Array.prototype.clean
	 * @param {Boolean} [allowEmptyStrings=false] - Set this to `true` to keep zero-length strings in the array.
	 * @returns {Array} A clean copy of the array.
	 * @see Firebolt.isEmpty
	 */
	clean: function(allowEmptyStrings) {
		var cleaned = [],
			i = 0;
		for (; i < this.length; i++) {
			if (!Firebolt.isEmpty(this[i], allowEmptyStrings)) {
				cleaned.push(this[i]);
			}
		}
		return cleaned;
	},

	/**
	 * Removes all elements from the array.
	 * 
	 * @function Array.prototype.clear
	 */
	clear: function() {
		this.length = 0;
	},

	/**
	 * Returns a duplicate of the array, leaving the original array intact.
	 * 
	 * @function Array.prototype.clone
	 * @returns {Array} A copy of the array.
	 */
	clone: function() {
		var len = this.length,
			clone = new this.__C__(len),
			i = 0;
		for (; i < len; i++) {
			clone[i] = this[i];
		}
		return clone;
	},

	/**
	 * Determines if the input item is in the array.
	 * 
	 * @function Array.prototype.contains
	 * @returns {Boolean} `true` if the item is in the array; else `false`.
	 */
	contains: function(e) {
		return this.indexOf(e) >= 0;
	},

	/**
	 * Executes a function on each item in the array.  
	 * The difference between this function and `Array#forEach` is that you can cancel the iteration by returning
	 * `false` in the callback and the array is returned (allowing for function chaining).  
	 * The difference between this function and `Array#every` is that only returning `false` in the callback will
	 * cancel the iteration (instead of any falsy value) and the array is returned instead of a boolean.
	 * 
	 * @function Array.prototype.each
	 * @param {function(*, Number, Array)} callback(value,index,array) - The function that will be executed on each item.
	 * @returns {Array} this
	 */
	each: function(callback) {
		return Firebolt.each(this, callback);
	},

	/**
	 * Determines if the arrays are equal by doing a shallow comparison of their elements using strict equality.  
	 * NOTE: The order of elements in the arrays DOES matter. The elements must be found in the same order for the arrays to be considered equal.
	 * 
	 * @function Array.prototype.equals
	 * @param {Array|Enumerable} array - Array or other enumerable object that has a `length` property.
	 * @returns {Boolean} `true` if the arrays are equal; else `false`.
	 */
	equals: function(array) {
		if (this === array) { //Easy check
			return true;
		}
		if (this.length !== array.length) {
			return false;
		}
		for (var i = 0; i < array.length; i++) {
			if (this[i] !== array[i]) {
				return false;
			}
		}
		return true;
	},

	/**
	 * Retrieve an item in the array.
	 * 
	 * @example
	 * var array = [1, 2, 3];
	 * array.get(0);  // 1
	 * array.get(1);  // 2
	 * array.get(-1); // 3
	 * array.get(-2); // 2
	 * array.get(5);  // undefined
	 * 
	 * @function Array.prototype.get
	 * @param {Number} index - A zero-based integer indicating which item to retrieve.
	 * @returns {*} The item at the specified index.
	 */
	get: function(index) {
		return this[index < 0 ? index + this.length : index];
	},

	/**
	 * Returns an array containing every item that is in both this array and the input array.
	 * 
	 * @function Array.prototype.intersect
	 * @param {Array|Enumerable} array - Array or other enumerable object that has a `length` property.
	 * @returns {Array} An array that is the intersection of this array and the input array.
	 * @example
	 * [1, 2, 3].intersect([2, 3, 4]);  // returns [2, 3]
	 */
	intersect: function(array) {
		var intersection = new this.__C__(),
			i = 0;
		for (; i < array.length; i++) {
			if (this.contains(array[i]) && intersection.indexOf(array[i]) < 0) {
				intersection.push(array[i]);
			}
		}
		return intersection;
	},

	/**
	 * Removes all occurrences of the passed in items from the array if they exist in the array.
	 * 
	 * @function Array.prototype.remove
	 * @param {...*} items - Items to remove from the array.
	 * @returns {Array} A reference to the array (so it's chainable).
	 */
	remove: function() {
		for (var rindex, i = 0; i < arguments.length; i++) {
			while ((rindex = this.indexOf(arguments[i])) >= 0) {
				this.splice(rindex, 1);
				if (!this.length) {
					return this; //Exit early since there is nothing left to remove
				}
			}
		}

		return this;
	},

	/**
	 * Returns an array containing every distinct item that is in either this array or the input array.
	 * 
	 * @function Array.prototype.union
	 * @param {...Array} array - One or more arrays or array-like objects.
	 * @returns {Array} An array that is the union of this array and the input array.
	 * @example
	 * [1, 2, 3].union([2, 3, 4, 5]);  // returns [1, 2, 3, 4, 5]
	 */
	union: function() {
		var union = this.unique(),
			i = 0,
			array,
			j;
		for (; i < arguments.length; i++) {
			array = arguments[i];
			for (j = 0; j < array.length; j++) {
				if (union.indexOf(array[j]) < 0) {
					union.push(array[j]);
				}
			}
		};
		return union;
	},

	/**
	 * Returns a duplicate-free clone of the array.
	 * 
	 * @function Array.prototype.unique
	 * @returns {Array} An array of unique items.
	 * @example
	 * [1, 2, 3, 2, 1].unique();  // returns [1, 2, 3]
	 */
	unique: function() {
		var uniq = new this.__C__(),
			i = 0;
		for (; i < this.length; i++) {
			if (uniq.indexOf(this[i]) < 0) {
				uniq.push(this[i]);
			}
		}
		return uniq;
	},

	/**
	 * Returns a copy of the current array without any elements from the input parameters.
	 * 
	 * @function Array.prototype.without
	 * @param {...*} items - One or more items to leave out of the returned array.
	 * @returns {Array}
	 * @example
	 * [1, 2, 3, 4, 5, 6].without(3, 4, 6);  // returns [1, 2, 5]
	 */
	without: function() {
		var array = new this.__C__(),
			i = 0,
			j;
		skip:
			for (; i < this.length; i++) {
				for (j = 0; j < arguments.length; j++) {
					if (this[i] === arguments[j]) {
						continue skip;
					}
				}
				array.push(this[i]);
			}
		return array;
	}
};

//Define the properties on Array.prototype with Object.defineProperty
for (any in arrayExtensions) {
	defineProperty(ArrayPrototype, any, {
		value: arrayExtensions[any]
	});
}

//#endregion Array


//#region =========================== Element ================================

/**
 * @class Element
 * @classdesc The HTML DOM Element interface.
 * @mixes Node
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/element|Element - Web API Interfaces | MDN}
 */

/**
 * Returns a list of the elements within the element that match the specifed CSS selector.  
 * Alias of `Element.querySelectorAll()`.
 * 
 * @function Element.prototype.$
 * @param {String} selector
 * @returns {NodeList} A list of selected elements.
 */
/* see Element.prototype.$QSA */

/**
 * Returns the first element within the element that matches the specified CSS selector.  
 * Alias of `Element.querySelector()`.
 * 
 * @function Element.prototype.$1
 * @param {String} selector
 * @returns {?Element}
 */
/* see Element.prototype.$QS */

/**
 * Returns a list of the elements within the element with the specified class name.  
 * Alias of `Element.getElementsByClassName()`.
 * 
 * @function Element.prototype.$CLS
 * @param {String} className
 * @returns {HTMLCollection|NodeList} A collection of elements with the specified class name.
 */
ElementPrototype.$CLS = ElementPrototype.getElementsByClassName;

/**
 * Returns a list of the elements within the element with the specified tag name.  
 * Alias of `Element.getElementsByTagName()`.
 * 
 * @function Element.prototype.$TAG
 * @param {String} tagName
 * @returns {HTMLCollection|NodeList} A collection of elements with the specified tag name.
 */
ElementPrototype.$TAG = ElementPrototype.getElementsByTagName;

/**
 * Returns the first element within the element that matches the specified CSS selector.  
 * Alias of `Element.querySelector()`.
 * 
 * @function Element.prototype.$QS
 * @param {String} selector
 * @returns {?Element}
 */
ElementPrototype.$QS = ElementPrototype.$1 = ElementPrototype.querySelector;

/**
 * Returns a list of the elements within the element that match the specifed CSS selector.  
 * Alias of `Element.querySelectorAll()`.
 * 
 * @function Element.prototype.$QSA
 * @param {String} selector
 * @returns {NodeList} A list of selected elements.
 */
ElementPrototype.$QSA = ElementPrototype.$ = ElementPrototype.querySelectorAll;

/**
 * Gets the element's stored data object.
 * 
 * @function Element.prototype.data
 * @returns {Object} The element's stored data object.
 */
/**
 * Get the value at the named data store for the element as set by .data(key, value) or by an HTML5 data-* attribute.
 * 
 * @function Element.prototype.data
 * @param {String} key - The name of the stored data.
 * @returns {*} The value of the stored data.
 */
/**
 * Stores arbitrary data associated with the element.
 * 
 * @function Element.prototype.data
 * @param {String} key - A string naming the data to set.
 * @param {*} value - Any arbitrary data to store.
 */
/**
 * Stores arbitrary data associated with the element.
 * 
 * @function Element.prototype.data
 * @param {Object} obj - An object of key-value pairs to add to each elements stored data.
 */
ElementPrototype.data = function(key, value) {
	return data(DATA_KEY_PUBLIC, this, key, value);
};

/**
 * Determines if the element matches the specified CSS selector.
 * 
 * @function Element.prototype.matches
 * @param {String} selector - A CSS selector string.
 * @returns {Boolean} `true` if the element matches the selector; else `false`.
 */
ElementPrototype.matches = ElementPrototype.matches || ElementPrototype.webkitMatchesSelector || ElementPrototype.mozMatchesSelector || ElementPrototype.msMatchesSelector || ElementPrototype.oMatchesSelector;

/**
 * Removes a previously stored piece of Firebolt data.  
 * When called without any arguments, all data is removed.
 * 
 * @function Element.prototype.removeData
 * @param {String} [name] - The name of the data to remove.
 */
/**
 * Removes previously stored Firebolt data.  
 * When called without any arguments, all data is removed.
 * 
 * @function Element.prototype.removeData
 * @param {Array|String} [list] - An array or space-separated string naming the pieces of data to remove.
 */
ElementPrototype.removeData = function(input) {
	return removeData(this, input);
};

//#endregion Element


//#region =========================== Firebolt ===============================

/**
 * The Firebolt namespace object and selector function (can also be referenced by the synonyms `FB` and `$`).
 * @namespace Firebolt
 */

/**
 * The global Firebolt function (can also be referenced by the synonyms `FB` and `$`).  
 * Returns a list of the elements either found in the DOM that match the passed in CSS selector or created by passing an HTML string.
 * 
 * <strong>Note:</strong> Unlike jQuery, only a document may be passed as the `context` variable. This is because there is a simple,
 * native method for selecting elements with an element as the root for the selection. The method is `element.querySelectorAll()`. If
 * the element was created in the same document as Firebolt was loaded, it will have two aliases for `.querySelectorAll()` &mdash;
 * {@linkcode Element#$|.$()} and {@linkcode Element#$QSA|.$QSA()}. If you want to write really performant and concise code, use some
 * of {@link Element|Element's other native functions} as well.
 * 
 * @global
 * @variation 2
 * @function Firebolt
 * @param {String} string - A CSS selector string or an HTML string.
 * @param {Document} [context] - A DOM Document to serve as the context when selecting or creating elements.
 * @returns {NodeList|HTMLCollection} A list of selected elements or newly created elements.
 * @throws {SyntaxError} When an invalid CSS selector is passed as the string.
 * 
 * @example
 * $('button.btn-success'); // Returns all button elements with the class "btn-success"
 * $('str <p>content</p>'); // Creates a set of nodes and returns it as a NodeList (in this case ["str ", <p>content</p>])
 * $.create('div');         // Calls Firebolt's `create()` method to create a new div element 
 */
function Firebolt(str, context) {
	if (context) {
		//Set the scoped document variable to the context document and re-call this function
		document = context;
		var ret = Firebolt(str);

		//Restore the document and return the retrieved object
		document = window.document;
		return ret;
	}

	if (str[0] === '#') { //Check for a single ID
		if (!rgxNotId.test(str)) {
			var nc = new NodeCollection(),
				elem = document.getElementById(str.slice(1));
			if (elem) {
				nc.push(elem);
			}
			return nc;
		}
	}
	else if (str[0] === '.') { //Check for a single class name
		if (!rgxNotClass.test(str)) {
			return document.getElementsByClassName(str.slice(1).replace(rgxAllDots, ' '));
		}
	}
	else if (!rgxNotTag.test(str)) { //Check for a single tag name
		return document.getElementsByTagName(str);
	}
	else if (isHtml(str)) { //Check if the string is an HTML string
		return createFragment([str]).childNodes;
	}
	return document.querySelectorAll(str);
}

/**
 * Returns a PHP-style associative array (Object) of URL parameters and updates the global {@linkcode $_GET} object at the same time.
 * 
 * @returns {Object.<String, String>}
 * @see $_GET
 * @see {@link http://www.php.net/manual/en/reserved.variables.get.php|PHP: $_GET - Manual}
 * @memberOf Firebolt
 */
Firebolt._GET = function() {
	window.$_GET = {};
	var params = location.search.slice(1).split('&'),
		i = 0,
		key_val;
	for (; i < params.length; i++) {
		key_val = params[i].split('=');
		if (key_val[0]) {
			$_GET[decodeURIComponent(key_val[0])] = decodeURIComponent(key_val[1] || '');
		}
	}
	return $_GET;
};

/**
 * Perform an asynchronous HTTP (Ajax) request.  
 * See the next function description for more information.
 * 
 * @param {String} url - A string containing the URL to which the request will be sent.
 * @param {Object} [settings] - A set of key/value pairs that configure the Ajax request. All settings are optional.
 * @memberOf Firebolt
 */
/**
 * Perform an asynchronous HTTP (Ajax) request.
 * 
 * For documentation, see {@link http://api.jquery.com/jQuery.ajax/|jQuery.ajax()}.  
 * However, Firebolt AJAX requests differ from jQuery's in the following ways:
 * 
 * + Instead of passing a "jqXHR" to callbacks, the native XMLHttpRequest object is passed.
 * + The `context` setting defaults to the XMLHttpRequest object instead of the settings object.
 * + The `contents` and `converters` settings are not supported.
 * + The `ifModifed` settings is currently not supported.
 * + The `data` setting may be a string or a plain object or array to serialize and is appended to the URL as a string for
 * HEAD requests as well as GET requests.
 * + The `processData` setting has been left out because Firebolt will automatically process only plain objects and arrays
 * (so you don't need to set it to `false` to send a DOMDocument or another type of data&emsp;such as a FormData object).
 * + The `global` setting and the global AJAX functions defined by jQuery are not supported.
 * 
 * To get the full set of AJAX features that jQuery provides, use the Firebolt AJAX extension plugin (if there ever is one).
 * 
 * @param {Object} [settings] - A set of key/value pairs that configure the Ajax request. All settings are optional.
 * @returns {XMLHttpRequest} The XMLHttpRequest object this request is using (only for requests where the dataType is not "script" or "jsonp".
 * @memberOf Firebolt
 */
Firebolt.ajax = function(url, settings) {
	//Parameter processing
	if (typeofString(url)) {
		settings = settings || {};
		settings.url = url;
	}
	else {
		settings = url;
	}

	//Merge the passed in settings object with the default values
	settings = extendDeep({}, ajaxSettings, settings);

	url = settings.url;

	//Create the XMLHttpRequest and give it settings
	var xhr = extend(new settings.xhr(), settings.xhrFields),
		async = settings.async,
		beforeSend = settings.beforeSend,
		complete = settings.complete || [],
		completes = typeof complete == 'function' ? [complete] : complete,
		context = settings.context || xhr,
		dataType = settings.dataType,
		dataTypeJSONP = dataType == 'jsonp',
		error = settings.error,
		errors = typeof error == 'function' ? [error] : error,
		crossDomain = settings.crossDomain,
		success = settings.success,
		successes = typeof success == 'function' ? [success] : success,
		timeout = settings.timeout,
		type = settings.type,
		isGetOrHead = rgxGetOrHead.test(type),
		userData = settings.data,
		textStatus,
		i;

	function callCompletes(errorThrown) {
		//Execute the status code callback (if there is one that matches the status code)
		if (settings.statusCode) {
			var callback = settings.statusCode[xhr.status];
			if (callback) {
				if (textStatus == 'success') {
					callback.call(context, userData, textStatus, xhr);
				}
				else {
					callback.call(context, xhr, textStatus, errorThrown || getAjaxErrorStatus(xhr));
				}
			}
		}
		//Execute all the complete callbacks
		for (i = 0; i < completes.length; i++) {
			completes[i].call(context, xhr, textStatus, errorThrown || getAjaxErrorStatus(xhr));
		}
	}

	function callErrors(errorThrown) {
		if (error) {
			//Execute all the error callbacks
			for (i = 0; i < errors.length; i++) {
				errors[i].call(context, xhr, textStatus, errorThrown || getAjaxErrorStatus(xhr));
			}
		}
	}

	function callSuccesses() {
		//Handle last-minute JSONP
		if (dataTypeJSONP) {
			//Call errors and return if the JSONP function was not called
			if (!responseContainer) {
				textStatus = 'parsererror';
				return callErrors(jsonpCallback + " was not called");
			}

			//Set the data to the first item in the response
			userData = responseContainer[0];
		}

		textStatus = 'success';

		if (success) {
			//Call the user-supplied data filter function if there is one
			if (settings.dataFilter) {
				userData = settings.dataFilter(userData, dataType);
			}
			//Execute all the success callbacks
			for (i = 0; i < successes.length; i++) {
				successes[i].call(context, userData, textStatus, xhr);
			}
		}
	}

	//Cross domain checking
	if (!crossDomain && url.contains('//')) {
		var domainMatch = location.href.match(rgxDomain) || [];
		crossDomain = url.indexOf(domainMatch[1]) < 0;
	}

	if (userData) {
		//Process data if necessary
		if (Array.isArray(userData) || isPlainObject(userData)) {
			userData = Firebolt.param(userData, settings.traditional);
		}

		//If the request is a GET or HEAD, append the data string to the URL
		if (isGetOrHead) {
			url = url.URLAppend(userData);
			userData = undefined; //Clear the data so it is not sent later on
		}
	}

	if (dataTypeJSONP) {
		var jsonpCallback = settings.jsonpCallback,
			responseContainer,
			overwritten;
		if (!typeofString(jsonpCallback)) {
			jsonpCallback = settings.jsonpCallback();
		}

		//Append the callback name to the URL
		url = url.URLAppend(settings.jsonp + '=' + jsonpCallback);

		// Install callback
		overwritten = window[jsonpCallback];
		window[jsonpCallback] = function() {
			responseContainer = arguments;
		};

		//Push JSONP cleanup onto complete callback array
		completes.push(function() {
			// Restore preexisting value
			window[jsonpCallback] = overwritten;

			if (settings[jsonpCallback]) {
				//Save the callback name for future use
				oldCallbacks.push(jsonpCallback);
			}

			//Call if `overwritten` was a function and there was a response
			if (responseContainer && typeof overwritten == 'function') {
				overwritten(responseContainer[0]);
			}

			responseContainer = overwritten = undefined;
		});
	}

	if ((crossDomain || settings.isLocal) && (dataType == 'script' || dataTypeJSONP)) {
		//Prevent caching unless the user explicitly set cache to true
		if (settings.cache !== true) {
			url = url.URLAppend('_=' + (timestamp++));
		}

		var script = createElement('script').prop({
			charset: settings.scriptCharset || '',
			src: url,
			onload: function() {
				if (timeout) {
					clearTimeout(timeout);
				}
				callSuccesses();
				callCompletes();
			},
			onerror: function(ex) {
				if (timeout) {
					clearTimeout(timeout);
				}
				textStatus = 'error';
				callErrors(ex.type);
				callCompletes(ex.type);
			}
		}).prop(isOldIE ? 'defer' : 'async', async);

		//Always remove the script after the request is done
		completes.push(function() {
			script.remove();
		});

		if (beforeSend && beforeSend.call(context, xhr, settings) === false) {
			//If the beforeSend function returned false, do not send the request
			return false;
		}

		//Add timeout
		if (timeout) {
			timeout = setTimeout(function() {
				script.remove();
				textStatus = 'timeout';
				callErrors();
				callCompletes(textStatus);
			}, timeout);
		}

		//Append the script to the head of the document to load it
		document.head.appendChild(script);
	}
	else {
		//Data just for real XHRs
		var headers = settings.headers,
			lastState = 0,
			statusCode;

		if (settings.mimeType) {
			xhr.overrideMimeType(settings.mimeType);
		}

		//Prevent caching if necessary
		if (isGetOrHead && settings.cache === false) {
			url = url.URLAppend('_=' + (timestamp++));
		}

		//The main XHR function for when the request has loaded (and track states in between for abort or timeout)
		xhr.onreadystatechange = function() {
			if (xhr.readyState !== 4) {
				lastState = xhr.readyState;
				return;
			}

			//For browsers that don't natively support XHR timeouts
			if (timeout) {
				clearTimeout(timeout);
			}

			statusCode = xhr.status;

			if (statusCode >= 200 && statusCode < 300 || statusCode === 304 || settings.isLocal && xhr.responseText) { //Success
				if (statusCode === 204 || type === 'HEAD') { //If no content
					textStatus = 'nocontent';
				}
				else if (statusCode === 304) { //If not modified
					textStatus = 'notmodified';
				}
				else {
					textStatus = 'success';
				}

				try {
					//Only need to process data of there is content
					if (textStatus != 'nocontent') {
						//If the data type has not been set, try to figure it out
						if (!dataType) {
							var contentType = xhr.getResponseHeader('Content-Type');
							if (contentType) {
								if (contentType.contains('/xml')) {
									dataType = 'xml';
								}
								else if (contentType.contains('/json')) {
									dataType = 'json';
								}
								else if (contentType.contains('script')) {
									dataType = 'script';
								}
							}
						}

						//Set data based on the data type
						if (dataType == 'xml') {
							userData = xhr.responseXML;
						}
						else if (dataType == 'json') {
							userData = JSON.parse(xhr.responseText);
						}
						else {
							userData = xhr.responseText;

							if (dataType == 'script' || dataTypeJSONP) {
								Firebolt.globalEval(userData);
							}
						}
					}
					else {
						userData = '';
					}

					//Invoke the success callbacks
					callSuccesses();
				}
				catch (e) {
					textStatus = 'parsererror';
					callErrors();
				}
			}
			else { //Error
				if (textStatus != 'timeout') {
					textStatus = lastState < 3 ? 'abort' : 'error';
				}
				callErrors();
			}

			//Invoke the complete callbacks
			callCompletes();
		};

		//Open the request
		xhr.open(type, url, async, settings.username, settings.password);

		//Set the content type header if the user has changed it from the default or there is data to submit
		if (settings.contentType != ajaxSettings.contentType || userData) {
			headers['Content-Type'] = settings.contentType;
		}

		//If the data type has been set, set the accept header
		if (settings.dataType) {
			headers['Accept'] = settings.accept[settings.dataType] || settings.accept['*'];
		}

		//Set the request headers in the XHR
		for (i in headers) {
			xhr.setRequestHeader(i, headers[i]);
		}

		if (beforeSend && beforeSend.call(context, xhr, settings) === false) {
			//If the beforeSend function returned false, do not send the request
			return false;
		}

		//Set timeout if there is one
		if (timeout > 0) {
			timeout = setTimeout(function() {
				textStatus = 'timeout';
				xhr.abort();
			}, timeout);
		}

		//Send the XHR
		xhr.send(userData);
	}

	return xhr;
};

/* Expose the AJAX settings (just because jQuery does this, even though it's not documented). */
Firebolt.ajaxSettings = ajaxSettings;

/**
 * Sets default values for future Ajax requests. Use of this function is not recommended.
 * 
 * @param {Object} options - A set of key/value pairs that configure the default Ajax settings. All options are optional.
 * @memberOf Firebolt
 */
Firebolt.ajaxSetup = function(options) {
	return extendDeep(ajaxSettings, options);
}

/**
 * Creates a new element with the specified tag name and attributes (optional).  
 * Partially an alias of `document.createElement()`.
 * 
 * @function Firebolt.create
 * @param {String} tagName
 * @param {Object} [attributes] - The JSON-formatted attributes that the element should have once constructed.
 * @returns {Element}
 */
Firebolt.create = createElement;

/**
 * Gets the object's stored data object.
 * 
 * @param {Object} object - An object. This can be anything that has Object in its prototype chain.
 * @returns {Object} The object's stored data object.
 * @memberOf Firebolt
 */
/**
 * Get the value at the named data store for the object as set by {@linkcode Firebolt.data|Firebolt.data(key, value)}
 * or by an HTML5 data-* attribute if the object is an {@link Element}.
 * 
 * @param {Object} object - An object. This can be anything that has Object in its prototype chain.
 * @param {String} key - The name of the stored data.
 * @returns {*} The value of the stored data.
 * @memberOf Firebolt
 */
/**
 * Stores arbitrary data associated with the object.
 * 
 * @param {Object} object - An object. This can be anything that has Object in its prototype chain.
 * @param {String} key - A string naming the data to set.
 * @param {*} value - Any arbitrary data to store.
 * @returns {Object} The passed in object.
 * @memberOf Firebolt
 */
/**
 * Stores arbitrary data associated with the object.
 * 
 * @param {Object} object - An object. This can be anything that has Object in its prototype chain.
 * @param {Object} data - An object of key-value pairs to add to the object's stored data.
 * @returns {Object} The passed in object.
 * @memberOf Firebolt
 */
Firebolt.data = function(object, key, value) {
	return data(DATA_KEY_PUBLIC, object, key, value);
};

/**
 * Calls the passed in function after the specified amount of time in milliseconds.
 * 
 * @param {Function} callback - A function to be called after the specified amount of time.
 * @param {Number} ms - An integer between 0 and +∞ : [ 0, +∞).
 * @returns {Object} An object that can be used to cancel the callback before it is executed by calling `object.clear()`.
 * @memberOf Firebolt
 */
Firebolt.delay = function(callback, ms) {
	return new function() {
		var clearRef = setTimeout(callback, ms);
		this.clear = function() {
			clearTimeout(clearRef);
		};
	};
};

/**
 * A generic iterator function, which can be used to iterate over both objects and arrays.
 * Arrays and array-like objects with a length property (such as a NodeLists) are iterated
 * by numeric index, from 0 to length-1. Other objects are iterated via their named properties.
 * Iteration can be cancelled by returning `false` in the callback.
 * 
 * @function Firebolt.each
 * @param {Array} array - The array or array-like object to iterate over.
 * @param {function(*, Number, Array)} callback(value,index,array) - The function that will be executed on each item.
 * @returns {Array} The input array.
 */
/**
 * A generic iterator function, which can be used to iterate over both objects and arrays.
 * Arrays and array-like objects with a length property (such as a NodeLists) are iterated
 * by numeric index, from 0 to length-1. Other objects are iterated via their named properties.
 * Iteration can be cancelled by returning `false` in the callback.
 * 
 * @function Firebolt.each
 * @param {Object} object - The object to iterate over.
 * @param {function(*, String, Object)} callback(value,key,object) - The function that will be executed on each item.
 * @returns {Object} The input object.
 */
Firebolt.each = function(obj, callback) {
	var len = obj.length,
		i = 0;
	if (len) {
		while (i < len && callback(obj[i], i++, obj) !== false);
	}
	else {
		for (i in obj) {
			if (callback(obj[i], i, obj) === false) break;
		}
	}
	return obj;
};

/**
 * Extend the "Firebolt object" (a.k.a. NodeCollection, NodeList, and HTMLCollection).
 * 
 * @function Firebolt.extend
 * @param {Object} object - An object with properties to add to the prototype of the collections returned by Firebolt.
 */
/**
 * Merge the contents of one or more objects into the first object.
 * 
 * @function Firebolt.extend
 * @param {Object} target - The object that will receive the new properties.
 * @param {...Object} object - One or more objects whose properties will be added to the target object.
 * @returns {Object} The target object.
 */
/**
 * Recursively merge the contents of one or more objects into the target object.
 * 
 * @function Firebolt.extend
 * @param {Boolean} deep - If `true`, the merge becomes recursive (performs a deep copy on object values).
 * @param {Object} target - The object that will receive the new properties.
 * @param {...Object} object - One or more objects whose properties will be added to the target object.
 * @returns {Object} The target object.
 */
Firebolt.extend = extend;

/**
 * Creates a new DocumentFragment and (optionally) appends the passed in content to it.
 * 
 * @param {...(String|Node|Node[])} [content] - One or more HTML strings, nodes, or collections of nodes to append to the fragment.
 * @returns {DocumentFragment} The newly created document fragment.
 * @memberOf Firebolt
 */
Firebolt.frag = function() {
	return createFragment(arguments);
};

/**
 * Load data from the server using a HTTP GET request.
 * 
 * @param {String} url - A string containing the URL to which the request will be sent.
 * @param {String|Object} [data] - A string or object that is sent to the server with the request as a query string.
 * @param {Function|Function[]} [success(data, textStatus, xhr)] - A callback function that is executed if the request succeeds.
 * @param {String} [dataType] - The type of data expected from the server. Default: Intelligent Guess (xml, json, script, or html).
 * @memberOf Firebolt
 */
Firebolt.get = function(url, userData, success, dataType) {
	return Firebolt.ajax({
		url: url,
		data: userData,
		success: success,
		dataType: dataType
	});
};

/**
 * Load JSON-encoded data from the server using a HTTP GET request.
 * 
 * @param {String} url - A string containing the URL to which the request will be sent.
 * @param {String|Object} [data] - A string or object that is sent to the server with the request as a query string.
 * @param {Function|Function[]} [success(data, textStatus, xhr)] - A callback function that is executed if the request succeeds.
 * @memberOf Firebolt
 */
Firebolt.getJSON = function(url, userData, success) {
	return Firebolt.get(url, userData, success, 'json');
};

/**
 * Load a JavaScript file from the server using a HTTP GET request, then execute it.
 * 
 * @param {String} url - A string containing the URL to which the request will be sent.
 * @param {Function|Function[]} [success(data, textStatus, xhr)] - A callback function that is executed if the request succeeds.
 * @memberOf Firebolt
 */
Firebolt.getScript = function(url, success) {
	return Firebolt.get(url, '', success, 'script');
};

/**
 * Executes some JavaScript code globally.
 * 
 * @param {String} code - The JavaScript code to execute.
 * @memberOf Firebolt
 */
Firebolt.globalEval = function(code) {
	var indirect = eval;

	code = code.trim();

	if (code) {
		//If the code begins with a strict mode pragma, execute code by injecting a script tag into the document.
		if (code.lastIndexOf('use strict', 1) === 1) {
			createElement('script').prop('text', code).appendTo(document.head).remove();
		}
		else {
			//Otherwise, avoid the DOM node creation, insertion and removal by using an inderect global eval
			indirect(code);
		}
	}
};

/**
 * Determines if the object has any Firebolt data associated with it.
 * 
 * @param {Object} object - An object. This can be anything that has Object in its prototype chain.
 * @returns {Boolean} `true` if the object has stored Firebolt data; else `false`.
 * @memberOf Firebolt
 */
Firebolt.hasData = function(object) {
	return !isEmptyObject(object[DATA_KEY_PUBLIC]);
};

/**
 * HTML-decodes the passed in string and returns the result.
 * 
 * @param {String} string - The string to decode.
 * @returns {String} The HTML-decoded text.
 * @memberOf Firebolt
 */
Firebolt.htmlDecode = function(str) {
	return createElement('div').html(str).text();
};

/**
 * HTML-encodes the passed in string and returns the result.
 * 
 * @param {String} string - The string to encode.
 * @returns {String} The HTML-encoded text.
 * @memberOf Firebolt
 */
Firebolt.htmlEncode = function(str) {
	return createElement('div').text(str).html();
};

/**
 * Determines if the passed in value is considered empty. The value is considered empty if it is one of the following:
 * <ul>
 * <li>`null`</li>
 * <li>`undefined`</li>
 * <li>a zero-length array</li>
 * <li>an empty object (as defined by {@linkcode Firebolt.isEmptyObject})</li>
 * <li>a zero-length string (unless the `allowEmptyString` parameter is set to a truthy value)</li>
 * </ul>
 * 
 * @param {*} value - The value to be tested.
 * @param {Boolean} [allowEmptyString=false] - Set this to true to regard zero-length strings as not empty.
 * @returns {Boolean}
 * @memberOf Firebolt
 */
Firebolt.isEmpty = function(value, allowEmptyString) {
	return value == null || typeofString(value) && !allowEmptyString && !value || typeof value == 'object' && isEmptyObject(value);
};

/**
 * Determines if an object is empty (contains no enumerable properties).
 * 
 * @function Firebolt.isEmptyObject
 * @param {Object} object - The object to be tested.
 * @returns {Boolean}
 */
Firebolt.isEmptyObject = isEmptyObject;

/**
 * Determines if a variable is a plain object.
 * 
 * @function Firebolt.isPlainObject
 * @param {*} obj - The item to test.
 */
Firebolt.isPlainObject = isPlainObject;

/**
 * Determines if the user is on a touchscreen device.
 * 
 * @returns {Boolean} `true` if the user is on a touchscreen device; else `false`.
 * @memberOf Firebolt
 */
Firebolt.isTouchDevice = function() {
	return 'ontouchstart' in window || 'onmsgesturechange' in window;
};

/**
 * Relinquishes Firebolt's control of the global `$` variable (restoring its previous value in the process).
 * 
 * @returns Firebolt
 * @memberOf Firebolt
 */
Firebolt.noConflict = function() {
	if (window.$ === Firebolt) {
		window.$ = _$;
	}

	return Firebolt;
};

/**
 * Creates a serialized representation of an array or object, suitable for use in a URL query string or Ajax request.  
 * Unlike jQuery, arrays will be serialized like objects when `traditional` is not `true`, with the indices of
 * the array becoming the keys of the query string parameters.
 * 
 * @param {Array|Object} obj - An array or object to serialize.
 * @param {Boolean} traditional - A Boolean indicating whether to perform a traditional "shallow" serialization.
 * @returns {String} The serialized string representation of the array or object.
 */
Firebolt.param = function(obj, traditional) {
	return traditional ? serializeTraditional(obj) : serializeRecursive(obj);
}

/* Inspired by: http://stackoverflow.com/questions/1714786/querystring-encoding-of-a-javascript-object */
function serializeRecursive(obj, prefix) {
	var str = '',
		key,
		value,
		cur;
	for (key in obj) {
		value = obj[key];
		if (!isEmptyObject(value)) {
			cur = prefix ? prefix + '[' + key + ']' : key;
			str += (str ? '&' : '')
				+ (typeof value == 'object' ? serializeRecursive(value, cur)
											: encodeURIComponent(cur) + '=' + encodeURIComponent(value));
		}
	}
	return str;
}

function serializeTraditional(obj) {
	var qs = '',
		key,
		value,
		i;
	for (key in obj) {
		//Add the key
		qs += (qs ? '&' : '') + encodeURIComponent(key);

		//Add the value
		value = obj[key];
		if (Array.isArray(value)) {
			for (i = 0; i < value.length; i++) {
				//Add key again for multiple array values
				qs += (i ? '&' + encodeURIComponent(key) : '') + '=' + encodeURIComponent(value[i]);
			}
		}
		else {
			qs += '=' + encodeURIComponent(value);
		}
	}

	return qs;
}

/**
 * Load data from the server using a HTTP POST request.
 * 
 * @param {String} url - A string containing the URL to which the request will be sent.
 * @param {String|Object} [data] - A string or object that is sent to the server with the request.
 * @param {Function|Function[]} [success(data, textStatus, xhr)] - A callback function that is executed if the request succeeds.
 * @param {String} [dataType] - The type of data expected from the server. Default: Intelligent Guess (xml, json, script, or html).
 * @memberOf Firebolt
 */
Firebolt.post = function(url, userData, success, dataType) {
	return Firebolt.ajax({
		type: 'POST',
		url: url,
		data: userData,
		success: success,
		dataType: dataType
	});
};

/**
 * Specify a function to execute when the DOM is fully loaded.  
 * Executes the function immediately if the DOM has already finished loading.
 * 
 * @memberOf Firebolt
 * @param {Function} callback - A function to execute once the DOM has been loaded.
 */
Firebolt.ready = function(callback) {
	if (document.readyState == 'loading') {
		document.addEventListener('DOMContentLoaded', callback);
	}
	else {
		callback();
	}
};

/**
 * Removes a previously stored piece of Firebolt data from an object.  
 * When called without any arguments, all data is removed.
 * 
 * @function Firebolt.removeData
 * @param {Object} object - An object. This can be anything that has Object in its prototype chain.
 * @param {String} [name] - The name of the data to remove.
 * @returns {Object} The passed in object.
 */
/**
 * Removes previously stored Firebolt data from an object.  
 * When called without any arguments, all data is removed.
 * 
 * @function Firebolt.removeData
 * @param {Object} object - An object. This can be anything that has Object in its prototype chain.
 * @param {Array|String} [list] - An array or space-separated string naming the pieces of data to remove.
 * @returns {Object} The passed in object.
 */
Firebolt.removeData = removeData;

/**
 * Creates a TextNode from the provided string.
 * 
 * @memberOf Firebolt
 * @param {String} text - The string used to construct the TextNode.
 * @returns {TextNode}
 */
Firebolt.text = function(text) {
	return document.createTextNode(text);
}

//#endregion Firebolt


//#region =========================== Function ===============================

/**
 * The JavaScript Function interface.
 * @class Function
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function|Function - JavaScript | MDN}
 */

/**
 * Delays a function call for the specified number of milliseconds.
 * 
 * @function Function.prototype.delay
 * @param {Number} ms - The number of milliseconds to wait before calling the functions.
 * @returns {Object} An object that can be used to cancel the callback before it is executed by calling `object.clear()`.
 */
Function[prototype].delay = function(ms) {
	var that = this;
	return new function() {
		var clearRef = setTimeout(that, ms);
		this.clear = function() {
			clearTimeout(clearRef);
		};
	};
};

//#endregion Function


//#region =========================== Globals ================================

/*
 * Firebolt reference objects.
 */
window.$ = window.FB = window.Firebolt = Firebolt;

/**
 * PHP-style associative array (Object) of URL parameters. This object is created when the page loads and thus contains the URL's
 * query parameters at that time. However, it is possible to change the URL through JavaScript functions such as `history.pushState()`.
 * If the URL may have changed and you need to the most recent query parameters, use Firebolt's {@linkcode Firebolt._GET|$._GET()}
 * function, which also updates the $_GET object when it is called.
 * 
 * @global
 * @constant
 * @name $_GET
 * @type {Object.<String, String>}
 * @see {@link http://www.php.net/manual/en/reserved.variables.get.php|PHP: $_GET - Manual}
 */
Firebolt._GET(); // Just call the function to update the global $_GET object

/**
 * Returns the first element within the document that matches the specified CSS selector.
 * If no element matches the selector, `null` or `undefined` may be returned.  
 * Alias of `document.querySelector()`, but with optimizations if a single class name, id, or tag name is input as the selector.
 * 
 * @global
 * @param {String} selector
 * @returns {?Element}
 */
window.$1 = function(selector) {
	if (selector[0] === '.') { //Check for a single class name
		if (!rgxNotClass.test(selector)) {
			return document.getElementsByClassName(selector.slice(1).replace(rgxAllDots, ' '))[0];
		}
	}
	else if (selector[0] === '#') { //Check for a single id
		if (!rgxNotId.test(selector)) {
			return document.getElementById(selector.slice(1));
		}
	}
	else if (!rgxNotTag.test(selector)) { //Check for a single tag name
		return document.getElementsByTagName(selector)[0];
	}
	//else
	return document.querySelector(selector);
};

/**
 * Returns a list of the elements within the document with the specified class name.  
 * Alias of `document.getElementsByClassName()`.
 * 
 * @global
 * @param {String} className
 * @returns {HTMLCollection|NodeList} A list of elements with the specified class name.
 */
window.$CLS = function(className) {
	return document.getElementsByClassName(className);
};

/**
 * Returns the first element within the document with the specified id.  
 * Alias of `document.getElementById()`.
 * 
 * @global
 * @param {String} id
 * @returns {?Element} The element with the specified id.
 */
window.$ID = function(id) {
	return document.getElementById(id);
};

/**
 * Returns a list of the elements within the document with the specified name attribute.  
 * Alias of `document.getElementsByName()`.
 * 
 * @global
 * @param {String} name
 * @returns {HTMLCollection|NodeList} A collection of elements with the specified name attribute.
 */
window.$NAME = function(name) {
	return document.getElementsByName(name);
};

/**
 * Returns a list of the elements within the document with the specified tag name.  
 * Alias of `document.getElementsByTagName()`.
 * 
 * @global
 * @param {String} tagName
 * @returns {HTMLCollection|NodeList} A collection of elements with the specified tag name.
 */
window.$TAG = function(tagName) {
	return document.getElementsByTagName(tagName);
};

/**
 * Returns the first element within the document that matches the specified CSS selector.  
 * Alias of `document.querySelector()`.
 * 
 * @global
 * @param {String} selector
 * @returns {?Element}
 */
window.$QS = function(selector) {
	return document.querySelector(selector);
};

/**
 * Returns all elements within the document that match the specified CSS selector.  
 * Alias of `document.querySelectorAll()`.
 * 
 * @global
 * @param {String} selector
 * @returns {?Element}
 */
window.$QSA = function(selector) {
	return document.querySelectorAll(selector);
};

//#endregion Globals


//#region ========================= HTMLCollection ===========================

/**
 * @class HTMLCollection
 * @classdesc
 * The DOM HTMLCollection interface.  
 * Has all the same functions as {@link NodeList} (plus one other native function).
 * @see NodeList
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLCollection|HTMLCollection - Web API Interfaces | MDN}
 */

/* Nothing to do. HTMLCollection gets its functions defined in the NodeList section. */

//#endregion HTMLCollection


//#region ========================== HTMLElement =============================

/**
 * @class HTMLElement
 * @classdesc
 * The HTML DOM HTMLElement interface.  
 * It should be noted that all functions that do not have a specified return value, return the calling object,
 * allowing for function chaining.
 * @mixes Element
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement|HTMLElement - Web API Interfaces | MDN}
 */

/**
 * @summary Adds the specified class(es) to the element.
 * 
 * @description
 * <h5>Note:</h5> Unlike jQuery, the format of the space-separated classes required by Firebolt is strict. Each class must
 * be separated by only a single space character and there cannot be whitespace at the beginning or end of the string.
 * ```JavaScript
 * element.addClass('one  two').removeClass('three ');  // Bad syntax
 * element.addClass('one two').removeClass('three');    // Correct syntax
 * ```
 * 
 * @function HTMLElement.prototype.addClass
 * @param {String} className - One or more space-separated classes to be added to the element's class attribute.
 */
HTMLElementPrototype.addClass = function(value) {
	if (this.className) {
		var newClasses = value.split(' '),
			newClassName = this.className,
			i = 0;
		for (; i < newClasses.length; i++) {
			if (!this.hasClass(newClasses[i])) {
				newClassName += ' ' + newClasses[i];
			}
		}

		//Only assign if the new class name is different (longer) to avoid unnecessary rendering
		if (newClassName.length > this.className.length) {
			this.className = newClassName;
		}
	}
	else {
		//There currently is no class name so the passed in value can easily be set as the class name
		this.className = value;
	}

	return this;
};

/*
 * More performant version of Node#afterPut for HTMLElements.
 * @see Node#afterPut
 */
HTMLElementPrototype.afterPut = function() {
	var i = arguments.length - 1,
		arg;

	for (; i >= 0; i--) {
		if (typeofString(arg = arguments[i])) {
			this.insertAdjacentHTML('afterend', arg);
		}
		else {
			//When arg is a collection of nodes, create a fragment by passing the collection in an array
			//(that is the form of input createFragment expects since it normally takes a function's arg list)
			insertAfter(isNode(arg) ? arg : createFragment([arg]), this);
		}
	}

	return this;
}

/*
 * More performant version of Node#appendWith for HTMLElements.
 * @see Node#appendWith
 */
HTMLElementPrototype.appendWith = function() {
	var i = 0,
		arg;

	for (; i < arguments.length; i++) {
		if (typeofString(arg = arguments[i])) {
			this.insertAdjacentHTML('beforeend', arg);
		}
		else {
			//When arg is a collection of nodes, create a fragment by passing the collection in an array
			//(that is the form of input createFragment expects since it normally takes a function's arg list)
			this.appendChild(isNode(arg) ? arg : createFragment([arg]));
		}
	}

	return this;
}

/**
 * Gets the value of the element's specified attribute.
 * 
 * @function HTMLElement.prototype.attr
 * @param {String} attribute - The name of the attribute who's value you want to get.
 * @returns {String} The value of the attribute.
 */
/**
 * Sets the element's specified attribute.
 * 
 * @function HTMLElement.prototype.attr
 * @param {String} attribute - The name of the attribute who's value should be set.
 * @param {String} value - The value to set the specified attribute to.
 */
/**
 * Sets the specified attributes of the element.
 * 
 * @function HTMLElement.prototype.attr
 * @param {Object} attributes - An object of attribute-value pairs to set.
 */
HTMLElementPrototype.attr = function(attrib, value) {
	if (isUndefined(value)) {
		if (typeofString(attrib)) {
			return this.getAttribute(attrib); //Get
		}
		for (var attribute in attrib) {
			this.setAttribute(attribute, attrib[attribute]); //Set multiple
		}
	}
	else {
		this.setAttribute(attrib, value); //Set single
	}

	return this;
};

/*
 * More performant version of Node#beforePut for HTMLElements.
 * @see Node#beforePut
 */
HTMLElementPrototype.beforePut = function() {
	var i = 0,
		arg;

	for (; i < arguments.length; i++) {
		if (typeofString(arg = arguments[i])) {
			this.insertAdjacentHTML('beforebegin', arg);
		}
		else {
			//When arg is a collection of nodes, create a fragment by passing the collection in an array
			//(that is the form of input createFragment expects since it normally takes a function's arg list)
			insertBefore(isNode(arg) ? arg : createFragment([arg]), this);
		}
	}

	return this;
}

/**
 * Gets the element's computed style object.
 * 
 * @function HTMLElement.prototype.css
 * @returns {Object.<String, String>} The element's computed style object.
 */
/**
 * Gets the value of the element's specified style property.
 * 
 * @function HTMLElement.prototype.css
 * @param {String} propertyName - The name of the style property who's value you want to retrieve.
 * @returns {String} The value of the specifed style property.
 */
/**
 * Sets the element's specified style property.
 * 
 * @function HTMLElement.prototype.css
 * @param {String} propertyName - The name of the style property to set.
 * @param {String|Number} value - A value to set for the specified property.
 */
/**
 * Sets CSS style properties.
 * 
 * @function HTMLElement.prototype.css
 * @param {Object.<String, String|Number>} properties - An object of CSS property-values.
 */
/**
 * Explicitly sets the element's inline CSS style, removing or replacing any current inline style properties.
 * 
 * @function HTMLElement.prototype.css
 * @param {String} cssText - A CSS style string. To clear the style, pass in an empty string.
 */
HTMLElementPrototype.css = function(prop, value) {
	if (isUndefined(prop)) {
		return getComputedStyle(this);
	}

	if (typeofString(prop)) {
		if (isUndefined(value)) {
			if (prop && !prop.contains(':')) {
				//Get the specified property
				return getComputedStyle(this)[prop];
			}
			//Else set the element's css text
			this.style.cssText = prop;
		}
		else {
			//Set the specified property
			this.style[prop] = value;
		}
	}
	else {
		//Set all specifed properties
		extend(this.style, prop);
	}

	return this;
};

/**
 * Removes all of the element's child nodes.
 * 
 * @function HTMLElement.prototype.empty
 * @example
 * // HTML (before)
 * <div id="mydiv">
 *     <span>Inside Span</span>
 *     Some Text
 * </div>
 *
 * // JavaScript
 * $ID('mydiv').empty();
 *
 * // HTML (after)
 * <div id="mydiv"></div>
 */
HTMLElementPrototype.empty = function() {
	for (var i = 0, len = this.childNodes.length; i < len; i++) {
		this.removeChild(this.firstChild);
	}

	return this;
};

/**
 * Determines if the element's class list has the specified class name.
 * 
 * @function HTMLElement.prototype.hasClass
 * @param {String} className - A string containing a single class name.
 * @returns {Boolean} `true` if the class name is in the element's class list; else `false`.
 */
HTMLElementPrototype.hasClass = function(className) {
	return this.classList.contains(className);
};

/**
 * Hides the element by setting its display style to 'none'.
 * 
 * @function HTMLElement.prototype.hide
 */
HTMLElementPrototype.hide = function() {
	this.style.display = 'none';

	return this;
};

/**
 * Gets the element's inner HTML.
 * 
 * @function HTMLElement.prototype.html
 * @returns {String} The element's inner HTML.
 */
/**
 * Sets the element's inner HTML.
 * 
 * @function HTMLElement.prototype.html
 * @param {String} innerHTML - An HTML string.
 */
HTMLElementPrototype.html = function(innerHTML) {
	if (isUndefined(innerHTML)) {
		return this.innerHTML; //Get
	}
	this.innerHTML = innerHTML; //Set

	return this;
};

/**
 * Gets the element's current coordinates relative to the document.
 * 
 * @function HTMLElement.prototype.offset
 * @returns {{top: Number, left: Number}} An object containing the coordinates detailing the element's distance from the top and left of the screen.
 * @example
 * // HTML
 * <body style="margin: 0">
 *   <div id='a' style="position: absolute; margin: 10px; left: 10px"></div>
 * </body>
 * 
 * // JavaScript
 * var offset = $ID('a').offset();
 * alert( offset.top + ', ' + offset.left );  // "10, 20"
 */
HTMLElementPrototype.offset = function() {
	var el = this,
		offset = {
			top: 0,
			left: 0
		};
	do {
		offset.top += el.offsetTop + el.clientTop;
		offset.left += el.offsetLeft + el.clientLeft;
	} while (el = el.offsetParent)
	return offset;
};

/*
 * More performant version of Node#prependWith for HTMLElements.
 * @see Node#prependWith
 */
HTMLElementPrototype.prependWith = function() {
	var i = arguments.length - 1,
		arg;

	for (; i >= 0; i--) {
		if (typeofString(arg = arguments[i])) {
			this.insertAdjacentHTML('afterbegin', arg);
		}
		else {
			//When arg is a collection of nodes, create a fragment by passing the collection in an array
			//(that is the form of input createFragment expects since it normally takes a function's arg list)
			prepend(isNode(arg) ? arg : createFragment([arg]), this);
		}
	}

	return this;
}

/**
 * Gets the value of the element's specified property.
 * 
 * @function HTMLElement.prototype.prop
 * @param {String} property - The name of the property who's value you want to get.
 * @returns {?} The value of the property being retrieved.
 */
/**
 * Sets the specified property of the element.
 * 
 * @function HTMLElement.prototype.prop
 * @param {String} property - The name of the property to be set.
 * @param {*} value - The value to set the property to.
 */
/**
 * Sets the specified properties of the element.
 * 
 * @function HTMLElement.prototype.prop
 * @param {Object} properties - An object of property-value pairs to set.
 */
HTMLElementPrototype.prop = function(prop, value) {
	if (isUndefined(value)) {
		if (typeofString(prop)) {
			return this[prop]; //Get
		}
		extend(this, prop); //Set multiple
	}
	else {
		this[prop] = value; //Set single
	}

	return this;
};

/**
 * Removes the specified attribute from the element.
 * 
 * @function HTMLElement.prototype.removeAttr
 * @param {String} attribute - The name of the attribute to remove.
 */
HTMLElementPrototype.removeAttr = function(attribute) {
	this.removeAttribute(attribute);

	return this;
};

/**
 * @summary Removes the specified class(es) or all classes from the element.
 * 
 * @description
 * <h5>Note:</h5> Unlike jQuery, the format of the space-separated classes required by Firebolt is strict. Each class must
 * be separated by only a single space character and there cannot be whitespace at the beginning or end of the string.
 * ```JavaScript
 * element.addClass('one  two').removeClass('three ');  // Bad syntax
 * element.addClass('one two').removeClass('three');    // Correct syntax
 * ```
 * 
 * @function HTMLElement.prototype.removeClass
 * @param {String} [className] - One or more space-separated classes to be removed from the element's class attribute.
 */
HTMLElementPrototype.removeClass = function(value) {
	if (isUndefined(value)) {
		this.className = ''; //Remove all classes
	}
	else {
		this.classList.remove.apply(this.classList, value.split(' '));
	}
	
	return this;
};

/**
 * Removes the specified property from the element.
 * 
 * @function HTMLElement.prototype.removeProp
 * @param {String} propertyName - The name of the property to remove.
 */
HTMLElementPrototype.removeProp = function(propertyName) {
	delete this[propertyName];

	return this;
};

/**
 * Shows an element by determining its default display style and setting it to that.  
 * NOTE: The element's default display style may be 'none', in which case the element would not be shown.
 * The element will also not be shown if it's `visibility` is set to 'hidden' or its `opacity` is 0;
 * 
 * @function HTMLElement.prototype.show
 */
HTMLElementPrototype.show = function() {
	//Create a temporary element of the same type as this element to figure out what the default display value should be
	var temp = document.body.appendChild(createElement(this.tagName, {style: 'width:0;border:0;margin:0;padding:0'})),
		style = temp.css('display');

	//Remove the temporary element and set this element's style to the retrieved style
	temp.remove();
	this.style.display = style;

	return this;
};

/**
 * @summary Add or remove one or more classes from the element depending on the class's presence (or lack thereof).
 * 
 * @description
 * <h5>Note:</h5> Unlike jQuery, the format of the space-separated classes required by Firebolt is strict. Each class must
 * be separated by only a single space character and there cannot be whitespace at the beginning or end of the string.
 * ```JavaScript
 * element.toggleClass('one  two ');  // Bad syntax
 * element.toggleClass('one two');    // Correct syntax
 * ```
 * 
 * @function HTMLElement.prototype.toggleClass
 * @param {String} [className] - One or more space-separated classes to be toggled. If left empty, the element's current class is toggled.
 */
HTMLElementPrototype.toggleClass = function(value) {
	if (this.className) {
		if (value) {
			var togClasses = value.split(' '),
			curClasses = this.className.split(rgxSpaceChars),
			i = 0;

			//`value` will now be the new class name value
			value = '';

			//Remove existing classes from the array and rebuild the class string without those classes
			for (; i < curClasses.length; i++) {
				if (curClasses[i]) {
					var len = togClasses.length;
					if (togClasses.remove(curClasses[i]).length === len) {
						value += (value ? ' ' : '') + curClasses[i];
					}
				}
			}

			//If there are still classes in the array, they are to be added to the class name
			if (togClasses.length) {
				value += (value ? ' ' : '') + togClasses.join(' ');
			}
		}
		else {
			//Save the element's current class name
			dataPrivate(this, KEY_TOGGLE_CLASS, this.className);
			value = ''; //Set to an empty string so the class name will be cleared
		}
	}
	else if (!value) {
		//Retrieve the saved class name
		value = dataPrivate(this, KEY_TOGGLE_CLASS) || '';
	}

	//Set the new value
	this.className = value;

	return this;
};

/**
 * Retrieves the element's current value. If the element is a `<select>` element, `null` is returned if none of its options
 * are selected and an array of selected options is returned if the element's `multiple` attribute is present.
 * 
 * @function HTMLElement.prototype.val
 * @returns {String|Array|null} The element's value.
 */
/**
 * Sets the element's value.
 * 
 * @function HTMLElement.prototype.val
 * @param {String} value - The value to give to the element.
 */
/**
 * Checks the element if its current value is in the input array of values and deselects it otherwise (only `<input>` elements with
 * type `checkbox` or `radio`).  
 * If the element is a `<select>` element, all of its options with a value matching one in the input array of values will be selected
 * and all others deselected. If the select element does not allow multiple selection, only the first matching element is selected.
 * 
 * @function HTMLElement.prototype.val
 * @param {String[]} values - The array of values used to determine if the element (or its options) should be checked (or selected).
 */
HTMLElementPrototype.val = function(value) {
	//If `value` is not an array with values to check
	if (!Array.isArray(value)) {
		return this.prop('value', value);
	}

	//Check or uncheck this depending on if this element's value is in the array of values to check
	this.checked = value.contains(this.value);

	return this;
};

HTMLSelectElement[prototype].val = function(value) {
	var multiple = this.multiple,
		options = this.options,
		i = 0;

	if (isUndefined(value)) {
		//If multiple selection is allowed and there is at least one selected item, return an array of selected values
		if (multiple && this.selectedIndex >= 0) {
			value = [];
			for (; i < options.length; i++) {
				if (options[i].selected) {
					value.push(options[i].value);
				}
			}
			return value;
		}

		//Else return the currently selected value or null
		//(If multiple is true, this.value will be an empty string so null will be returned)
		return this.value || null;
	}
	
	if (typeofString(value)) {
		this.value = value;
	}
	else {
		//Select or deselect each option depending on if its value is in the array of values to check.
		//Break once an option is selected if this select element does not allow multiple selection.
		for (; i < options.length; i++) {
			if ((options[i].selected = value.contains(options[i].value)) && !multiple) break;
		}
	}

	return this;
};

//#endregion HTMLElement


//#region ============================= Node =================================

/**
 * @class Node
 * @classdesc
 * The {@link https://developer.mozilla.org/en-US/docs/Web/API/Node|DOM Node interface}.  
 * It should be noted that all functions that do not have a specified return value, return the calling object,
 * allowing for function chaining.
 * @mixes Object
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Node|Node - Web API Interfaces | MDN}
 */

/**
 * Inserts content after the node.
 * 
 * @function Node.prototype.afterPut
 * @param {...(String|Node|NodeCollection)} content - One or more HTML strings, nodes, or collections of nodes to insert.
 * @throws {TypeError|NoModificationAllowedError} The subject node must have a
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Node.parentNode|ParentNode}.
 */
NodePrototype.afterPut = function() {
	insertAfter(createFragment(arguments), this);

	return this;
};

/**
 * Appends this node to the end of the target element(s).
 * 
 * @function Node.prototype.appendTo
 * @param {String|ParentNode|NodeCollection} target - A specific node, collection of nodes, or a selector to find a set of nodes to which this node will be appended.
 * @throws {HierarchyRequestError} The target(s) must implement the {@link ParentNode} interface.
 */
NodePrototype.appendTo = function(target) {
	if (typeofString(target)) {
		target = Firebolt(target);
	}
	else if (isNode(target)) {
		return target.appendChild(this);
	}

	var i = 1,
		len = target.length;
	if (len) {
		target[0].appendChild(this);
		for (; i < len; i++) {
			target[0].appendChild(this.cloneNode(true));
		}
	}

	return this;
};

/**
 * Appends content to the end of the node.
 * 
 * @function Node.prototype.appendWith
 * @param {...(String|Node|NodeCollection)} content - One or more HTML strings, nodes, or collections of nodes to insert.
 * @throws {HierarchyRequestError} This node must implement the {@link ParentNode} interface.
 */
NodePrototype.appendWith = function() {
	this.appendChild(createFragment(arguments));

	return this;
};

/**
 * Inserts content before the node.
 * 
 * @function Node.prototype.beforePut
 * @param {...(String|Node|NodeCollection)} content - One or more HTML strings, nodes, or collections of nodes to insert.
 * @throws {TypeError|NoModificationAllowedError} The subject node must have a
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Node.parentNode|ParentNode}.
 */
NodePrototype.beforePut = function() {
	insertBefore(createFragment(arguments), this);

	return this;
};

/**
 * Gets the node's child elements, optionally filtered by a selector.
 * 
 * @function Node.prototype.childElements
 * @param {String} [selector] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection}
 */
NodePrototype.childElements = function(selector) {
	//If this node does not implement the ParentNode interface, this.children will be `undefined`,
	//so set children to an empty array so nothing will be added to the returned NodeCollection
	var children = this.children || [];

	if (!selector) {
		return children.toNC();
	}

	var nc = new NodeCollection(),
		i = 0;
	for (; i < children.length; i++) {
		if (children[i].matches(selector)) {
			nc.push(children[i]);
		}
	}
	return nc;
};

/**
 * Get the node's immediately following sibling element. If a selector is provided, it retrieves the next sibling only if it matches that selector.
 * 
 * @function Node.prototype.next
 * @param {String} [selector] - A CSS selector to match the next sibling against.
 * @returns {?Element}
 */
NodePrototype.next = getNextOrPrevFunc(nextElementSibling, 1);

/**
 * Gets all following siblings of the node, optionally filtered by a selector.
 * 
 * @function Node.prototype.nextAll
 * @param {String} [selector] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection} The set of following sibling elements in order beginning with the closest sibling.
 */
NodePrototype.nextAll = getGetDirElementsFunc(nextElementSibling);

/**
 * Gets the node's following siblings, up to but not including the element matched by the selector, DOM node,
 * or node in a collection.
 * 
 * @function Node.prototype.nextUntil
 * @param {String|Element|Node[]} [nodes] - A CSS selector, an element, or a collection of nodes used to indicate
 * that no more siblings should be considered.
 * @param {String} [filter] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection} - The set of following sibling elements in order beginning with the closest sibling.
 */
NodePrototype.nextUntil = getGetDirElementsFunc(nextElementSibling, 0);

/**
 * Gets the node's ancestors, optionally filtered by a selector.
 * 
 * @function Node.prototype.parents
 * @param {String} [selector] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection} - The set of the node's ancestors, ordered from the immediate parent on up.
 */
NodePrototype.parents = getGetDirElementsFunc('parentElement');

/**
 * Gets the node's ancestors, up to but not including the element matched by the selector, DOM node,
 * or node in a collection.
 * 
 * @function Node.prototype.parentsUntil
 * @param {String|Element|Node[]} [nodes] - A CSS selector, an element, or a collection of nodes used to indicate
 * that no more ancestors should be considered.
 * @param {String} [filter] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection} - The set of the node's ancestors, ordered from the immediate parent on up.
 */
NodePrototype.parentsUntil = getGetDirElementsFunc('parentElement', 0);

/**
 * Prepends content to the beginning of the node.
 * 
 * @function Node.prototype.prependWith
 * @param {...(String|Node|NodeCollection)} content - One or more HTML strings, nodes, or collections of nodes to insert.
 * @throws {HierarchyRequestError} This node must implement the {@link ParentNode} interface.
 */
NodePrototype.prependWith = function() {
	prepend(createFragment(arguments), this);

	return this;
};

/**
 * Prepends this node to the beginning of the target element(s).
 * 
 * @function Node.prototype.prependTo
 * @param {String|ParentNode|NodeCollection} target - A specific node, collection of nodes, or a selector to find a set of nodes to which this node will be prepended.
 * @throws {HierarchyRequestError} The target(s) must implement the {@link ParentNode} interface.
 */
NodePrototype.prependTo = getNodeInsertingFunction(prepend);

/**
 * Get the node's immediately preceeding sibling element. If a selector is provided, it retrieves the previous sibling only if it matches that selector.
 * 
 * @function Node.prototype.prev
 * @param {String} [selector] - A CSS selector to match the previous sibling against.
 * @returns {?Element}
 */
NodePrototype.prev = getNextOrPrevFunc(previousElementSibling, 1);

/**
 * Gets all preceeding siblings of the node, optionally filtered by a selector.
 * 
 * @function Node.prototype.prevAll
 * @param {String} [selector] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection} The set of preceeding sibling elements in order beginning with the closest sibling.
 */
NodePrototype.prevAll = getGetDirElementsFunc(previousElementSibling);

/**
 * Gets the node's preceeding siblings, up to but not including the element matched by the selector, DOM node,
 * or node in a collection.
 * 
 * @function Node.prototype.prevUntil
 * @param {String|Element|Node[]} [nodes] - A CSS selector, an element, or a collection of nodes used to indicate
 * that no more siblings should be considered.
 * @param {String} [filter] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection} - The set of preceeding sibling elements in order beginning with the closest sibling.
 */
NodePrototype.prevUntil = getGetDirElementsFunc(previousElementSibling, 0);

/**
 * Inserts this node directly after the specified target(s).
 * 
 * @function Node.prototype.putAfter
 * @param {String|Node|NodeCollection} target - A specific node, collection of nodes, or a selector to find a set of nodes after which this node will be inserted.
 * @throws {TypeError} The target node(s) must have a {@link https://developer.mozilla.org/en-US/docs/Web/API/Node.parentNode|ParentNode}.
 */
NodePrototype.putAfter = getNodeInsertingFunction(insertAfter);

/**
 * Inserts this node directly before the specified target(s).
 * 
 * @function Node.prototype.putBefore
 * @param {String|Node|NodeCollection} target - A specific node, collection of nodes, or a selector to find a set of nodes after which this node will be inserted.
 * @throws {TypeError} The target node(s) must have a {@link https://developer.mozilla.org/en-US/docs/Web/API/Node.parentNode|ParentNode}.
 */
NodePrototype.putBefore = getNodeInsertingFunction(insertBefore);

/**
 * Removes this node from the DOM.
 * 
 * @function Node.prototype.remove
 * @returns void (undefined)
 */
NodePrototype.remove = function() {
	if (this.parentNode) {
		this.parentNode.removeChild(this);
	}
};

/**
 * Gets the node's siblings, optionally filtered by a selector.
 * 
 * @function Node.prototype.siblings
 * @param {String} [selector] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection} - The set of the node's ancestors, ordered from the immediate parent on up.
 * @throws {TypeError} The subject node must have a
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Node.parentNode|ParentNode}.
 */
NodePrototype.siblings = function(selector) {
	return ArrayPrototype.remove.call(this.parentNode.childElements(selector), this);
};

/**
 * Gets this node's text content (specifically uses the native JavaScript property `Node.textContent`).
 * 
 * @function Node.prototype.text
 * @returns {String} The node's text content.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Node.textContent|Node.textContent - Web API Interfaces | MDN}
 */
/**
 * Sets this node's text content (specifically uses the native JavaScript property `Node.textContent`).
 * 
 * @function Node.prototype.text
 * @param {String|*} text - The text or content that will be converted to a string to be set as the node's text content.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Node.textContent|Node.textContent - Web API Interfaces | MDN}
 */
NodePrototype.text = function(text) {
	if (isUndefined(text)) {
		return this.textContent; //Get
	}

	this.textContent = text; //Set

	return this;
};

/**
 * @class ParentNode
 * @classdesc Interface implemented by {@link https://developer.mozilla.org/en-US/docs/Web/API/Element|Element},
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Document|Document}, and
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment|DocumentFragment} objects.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/ParentNode|ParentNode - Web API Interfaces | MDN}
 */

//#endregion Node


//#region ======================== NodeCollection ============================

//Save the clone function to toNC to be a way to make shallow copies of the NodeCollection/NodeList/HTMLCollection
arrayExtensions.toNC = arrayExtensions.clone;

/**
 * Create a deep copy of the collection of nodes.
 * 
 * __Protip:__ If you want a shallow copy of the collection, use `.toNC()` (even thought that's a NodeList function,
 * NodeCollections also have it in their prototype).
 * 
 * @function NodeCollection.prototype.clone
 * @param {Boolean} [withData=false] - A boolean indicating if the element's data should be copied as well.
 * @returns {NodeCollection}
 */
arrayExtensions.clone = function(withData) {
	return this.map(function(node) {
		var clone = node.cloneNode(true);
		if (withData && node[DATA_KEY_PUBLIC]) {
			extendDeep(clone.data(), node[DATA_KEY_PUBLIC]);
		}
		return clone;
	});
};

/**
 * Same constructor as {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array|Array}.
 * 
 * @class NodeCollection
 * @mixes Array
 * @classdesc
 * A mutable collection of DOM nodes. It subclasses the native {@link Array} class (but take note that the `.clone()`, `.clean()`,
 * `.remove()`, and `.filter()` functions have been overridden), and has all of the main DOM-manipulating functions.
 * 
 * __Note:__ Since it is nearly impossible to fully subclass the Array class in JavaScript, there is one minor
 * hiccup with the way NodeCollection subclasses Array. The `instanceof` operator will not report that NodeCollection is an
 * instance of anything other than a NodeCollection. It also will not report that `NodeCollection` is a function.
 * This is demonstrated in the following code:
 * ```javascript
 * var nc = new NodeCollection();
 * nc instanceof NodeCollection; // true
 * nc instanceof Array;          // false
 * nc instanceof Object;         // false
 * nc.constructor instanceof Function; // false
 * ```
 * All other operations, such as `Array.isArray()` and `typeof`, will work correctly.
 * 
 * It should be noted that all functions that do not have a specified return value, return the calling object,
 * allowing for function chaining.
 */
var
	//<iframe> Array subclassing
	NodeCollection = window.NodeCollection = document.head.appendChild(any = createElement('iframe')).contentWindow.Array,

	//Extend NodeCollection's prototype with the Array functions
	NodeCollectionPrototype = extend(NodeCollection[prototype], arrayExtensions),

	//Save a reference to the original filter function for use later on
	ncFilter = NodeCollectionPrototype.filter;

any.remove(); //Remove the iframe that was made to subclass Array

/* Set the private constructor (which will be inherited by NodeList and HTMLCollection) */
NodeCollectionPrototype.__C__ = NodeCollection;

/**
 * Adds the queried elements to a copy of the existing collection (if they are not already in the collection)
 * and returns the result.
 * 
 * Do not assume that this method appends the elements to the existing collection in the order they are passed to the method
 * (that's what `concat` is for). When all elements are members of the same document, the resulting collection will be sorted
 * in document order; that is, in order of each element's appearance in the document. If the collection consists of elements
 * from different documents or ones not in any document, the sort order is undefined (but elements in the collection that are
 * in the same document will still be in document order).
 * 
 * @function NodeCollection.prototype.add
 * @param {String} selector - A CSS selector to use to find elements to add to the collection.
 * @returns {NodeCollection} The result of unioning the queried elements with the current collection.
 */
/**
 * Adds the newly created elements to a copy of the existing collection and returns the result.
 * 
 * @function NodeCollection.prototype.add
 * @param {String} html - An HTML fragment to add to the collection.
 * @returns {NodeCollection} The result adding the elements created with the HTML to current collection.
 */
/**
 * Adds the element to a copy of the existing collection (if it is not already in the collection)
 * and returns the result.
 * 
 * @function NodeCollection.prototype.add
 * @param {Element|Node} element - A DOM Element or Node.
 * @returns {NodeCollection} The result of adding the element to the current collection.
 */
/**
 * Returns the union of the current collection and the input one.
 * 
 * Do not assume that this method appends the elements to the existing collection in the order they are passed to the method
 * (that's what `concat` is for). When all elements are members of the same document, the resulting collection will be sorted
 * in document order; that is, in order of each element's appearance in the document. If the collection consists of elements
 * from different documents or ones not in any document, the sort order is undefined (but elements in the collection that are
 * in the same document will still be in document order).
 * 
 * @function NodeCollection.prototype.add
 * @param {NodeCollection|NodeList|HTMLCollection|Node[]} elements
 * @returns {NodeCollection} The result of adding the input elements to the current collection.
 */
NodeCollectionPrototype.add = function(input) {
	var newCollection;
	if (input.nodeType) {
		if (this.contains(input)) { //This collection already contains the input node
			return this.toNC(); //Return a shallow clone of the current collection
		}
		newCollection = this.concat(input);
	}
	else {
		newCollection = this.union(typeofString(input) ? Firebolt(input) : input);
	}

	return newCollection.sort(sortDocOrder);
};

/**
 * Adds the input class name to all elements in the collection.
 * 
 * @function NodeCollection.prototype.addClass
 * @param {String} className - The class to be added to each element in the collection.
 */
NodeCollectionPrototype.addClass = callOnEachElement('addClass');

/**
 * Alias of {@link NodeCollection#afterPut} provided for similarity with jQuery.  
 * Note that Firebolt does not define a method called "after" for Nodes. This is because the DOM Living Standard has defined
 * a native function called `after` for the {@link http://dom.spec.whatwg.org/#interface-childnode|ChildNode Interface} that
 * does not function in the same way as `afterPut`.
 * 
 * @function NodeCollection.prototype.after
 * @see NodeCollection#afterPut
 */
/**
 * Inserts content after each node in the collection.
 * 
 * @function NodeCollection.prototype.afterPut
 * @param {...(String|Node|NodeCollection)} content - One or more HTML strings, nodes, or collections of nodes to insert.
 * @throws {TypeError|NoModificationAllowedError} The subject collection of nodes must only contain nodes that have a
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Node.parentNode|ParentNode}.
 */
NodeCollectionPrototype.afterPut = NodeCollectionPrototype.after = function() {
	var len = this.length,
		firstNode = this[0];
	if (len > 1) {
		var fragment = createFragment(arguments),
			i = 1;
		for (; i < len; i++) {
			insertAfter(fragment.cloneNode(true), this[i]);
		}
		insertAfter(fragment, firstNode);
	}
	else if (len) { //This collection only has one node
		firstNode.afterPut.apply(firstNode, arguments);
	}

	return this;
}

/**
 * Appends each node in this collection to the end of the specified target(s).
 * 
 * @function NodeCollection.prototype.appendTo
 * @param {String|ParentNode|NodeCollection} target - A specific node, collection of nodes, or a selector to find a set of nodes to which each node will be appended.
 * @throws {HierarchyRequestError} The target(s) must implement the {@link ParentNode} interface.
 */
NodeCollectionPrototype.appendTo = getPutOrToFunction('appendWith');

/**
 * Alias of {@link NodeCollection#appendWith} provided for similarity with jQuery.  
 * Note that Firebolt does not define a method called "append" for Nodes. This is because the DOM Living Standard has defined
 * a native function called `append` for the {@link http://dom.spec.whatwg.org/#interface-parentnode|ParentNode Interface} that
 * does not function in the same way as `appendWith`.
 * 
 * @function NodeCollection.prototype.append
 * @see NodeCollection#appendWith
 */
/**
 * Appends content to the end of each element in the collection.
 * 
 * @function NodeCollection.prototype.appendWith
 * @param {...(String|Node|NodeCollection)} content - One or more HTML strings, nodes, or collections of nodes to insert.
 * @throws {HierarchyRequestError} The nodes in the collection must implement the {@link ParentNoded} interface.
 */
NodeCollectionPrototype.appendWith = NodeCollectionPrototype.append = function() {
	var len = this.length,
		firstNode = this[0];
	if (len > 1) {
		var fragment = createFragment(arguments),
			i = 1;
		for (; i < len; i++) {
			this[i].appendChild(fragment.cloneNode(true));
		}
		firstNode.appendChild(fragment);
	}
	else if (len) { //Only one element to append to
		firstNode.appendWith.apply(firstNode, arguments);
	}

	return this;
}

/**
 * Gets the value of the specified attribute of the first element in the collection.
 * 
 * @function NodeCollection.prototype.attr
 * @param {String} attribute - The name of the attribute who's value you want to get.
 * @returns {String} The value of the attribute.
 */
/**
 * Sets the specified attribute for each element in the collection.
 * 
 * @function NodeCollection.prototype.attr
 * @param {String} attribute - The name of the attribute who's value should be set.
 * @param {String} value - The value to set the specified attribute to.
 */
/**
 * Sets attributes for each element in the collection.
 * 
 * @function NodeCollection.prototype.attr
 * @param {Object} attributes - An object of attribute-value pairs to set.
 */
NodeCollectionPrototype.attr = getFirstSetEachElement('attr', function(numArgs) {
	return numArgs < 2;
});

/**
 * Alias of {@link NodeCollection#beforePut} provided for similarity with jQuery.  
 * Note that Firebolt does not define a method called "before" for Nodes. This is because the DOM Living Standard has defined
 * a native function called `before` for the {@link http://dom.spec.whatwg.org/#interface-childnode|ChildNode Interface} that
 * does not function in the same way as `beforePut`.
 * 
 * @function NodeCollection.prototype.before
 * @see NodeCollection#beforePut
 */
/**
 * Inserts content before each node in the collection.
 * 
 * @function NodeCollection.prototype.beforePut
 * @param {...(String|Node|NodeCollection)} content - One or more HTML strings, nodes, or collections of nodes to insert.
 * @throws {TypeError|NoModificationAllowedError} The subject collection of nodes must only contain nodes that have a
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Node.parentNode|ParentNode}.
 */
NodeCollectionPrototype.beforePut = NodeCollectionPrototype.before = function() {
	var len = this.length,
		firstNode = this[0];
	if (len > 1) {
		var fragment = createFragment(arguments),
			i = 1;
		for (; i < len; i++) {
			insertBefore(fragment.cloneNode(true), this[i]);
		}
		insertBefore(fragment, firstNode);
	}
	else if (len) { //This collection only has one node
		firstNode.beforePut.apply(firstNode, arguments);
	}

	return this;
}

/**
 * Gets the child elements of each element in the collection, optionally filtered by a selector.
 * 
 * @function NodeCollection.prototype.children
 * @param {String} [selector] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection} The set of children, sorted in document order.
 */
NodeCollectionPrototype.children = getGetDirElementsFunc('childElements', sortDocOrder);

/**
 * Returns a clone of the collection with all non-elements removed.
 * 
 * @returns {NodeCollection} A reference to the new collection.
 */
NodeCollectionPrototype.clean = function() {
	return this.filter(function(node) {
		return node.nodeType === 1;
	});
}

/**
 * Clicks each element in the list.
 * 
 * @function NodeCollection.prototype.click
 */
NodeCollectionPrototype.click = callOnEachElement('click');

/**
 * Gets the computed style object of the first element in the list.
 * 
 * @function NodeCollection.prototype.css
 * @returns {Object.<String, String>} The element's computed style object.
 */
/**
 * Gets the value of the specified style property of the first element in the list.
 * 
 * @function NodeCollection.prototype.css
 * @param {String} propertyName - The name of the style property who's value you want to retrieve.
 * @returns {String} The value of the specifed style property.
 */
/**
 * Sets the specified style property for each element in the list.
 * 
 * @function NodeCollection.prototype.css
 * @param {String} propertyName - The name of the style property to set.
 * @param {String|Number} value - A value to set for the specified property.
 */
/**
 * Sets CSS style properties for each element in the list.
 * 
 * @function NodeCollection.prototype.css
 * @param {Object.<String, String|Number>} properties - An object of CSS property-values.
 */
/**
 * Explicitly sets each elements' inline CSS style, removing or replacing any current inline style properties.
 * 
 * @function NodeCollection.prototype.css
 * @param {String} cssText - A CSS style string. To clear the style, pass in an empty string.
 */
NodeCollectionPrototype.css = getFirstSetEachElement('css', function(numArgs, firstArg) {
	return !numArgs || numArgs < 2 && firstArg && typeofString(firstArg) && !firstArg.contains(':');
});

/**
 * Gets the first element's stored data object.
 * 
 * @function NodeCollection.prototype.data
 * @returns {Object} The element's stored data object.
 */
/**
 * Get the value at the named data store for the first element as set by .data(key, value) or by an HTML5 data-* attribute.
 * 
 * @function NodeCollection.prototype.data
 * @param {String} key - The name of the stored data.
 * @returns {*} The value of the stored data.
 */
/**
 * Stores arbitrary data associated with each element in the collection.
 * 
 * @function NodeCollection.prototype.data
 * @param {String} key - A string naming the data to set.
 * @param {*} value - Any arbitrary data to store.
 */
/**
 * Stores arbitrary data associated with each element in the collection
 * 
 * @function NodeCollection.prototype.data
 * @param {Object} obj - An object of key-value pairs to add to each elements stored data.
 */
NodeCollectionPrototype.data = getFirstSetEachElement('data', function(numArgs, firstArg) {
	return !numArgs || numArgs < 2 && typeofString(firstArg);
});

/**
 * Removes all child nodes from each element in the list.
 * 
 * @function NodeCollection.prototype.empty
 */
NodeCollectionPrototype.empty = callOnEachElement('empty');

/**
 * Creates a new NodeCollection containing only the elements that match the provided selector.
 * (If you want to filter against another set of elements, use the {@linkcode Array#intersect|intersect} function.)
 * 
 * @function NodeCollection.prototype.filter
 * @param {String} selector - CSS selector string to match the current collection of elements against.
 * @returns {NodeCollection}
 */
/**
 * Creates a new NodeCollection with all elements that pass the test implemented by the provided function.
 * (If you want to filter against another set of elements, use the {@linkcode Array#intersect|intersect} function.)
 * 
 * @function NodeCollection.prototype.filter
 * @param {Function} function(value, index, collection) - A function used as a test for each element in the collection.
 * @returns {NodeCollection}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter|Array.prototype.filter() - JavaScript | MDN}
 */
NodeCollectionPrototype.filter = function(selector) {
	return ncFilter.call(this, 
		typeofString(selector)
			? function(node) { return node.nodeType === 1 && node.matches(selector); } //Use CSS string filter
			: selector //Use given filter function
	);
};

/**
 * Hides each element in the collection.
 * 
 * @function NodeCollection.prototype.hide
 * @see HTMLElement#hide
 */
NodeCollectionPrototype.hide = callOnEachElement('hide');

/**
 * Gets the inner HTML of the first element in the list.
 * 
 * @function NodeCollection.prototype.html
 * @returns {String} The element's inner HTML.
 */
/**
 * Sets the inner HTML of each element in the list.
 * 
 * @function NodeCollection.prototype.html
 * @param {String} innerHTML - An HTML string.
 */
NodeCollectionPrototype.html = getFirstSetEachElement('html', function(numArgs) {
	return !numArgs;
});

/**
 * Returns the `index`th item in the collection. If `index` is greater than or equal to the number of nodes in the list, this returns `null`.
 * 
 * @function NodeCollection.prototype.item
 * @param {Number} index
 * @returns {?Node}
 * @see http://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-844377136
 */
NodeCollectionPrototype.item = function(index) {
	return this[index] || null;
};

/**
 * Alias of {@link NodeCollection#putAfter} provided for similarity with jQuery.
 * 
 * @function NodeCollection.prototype.insertAfter
 * @see NodeCollection#putAfter
 */

/**
 * Alias of {@link NodeCollection#putBefore} provided for similarity with jQuery.
 * 
 * @function NodeCollection.prototype.insertBefore
 * @see NodeCollection#putBefore
 */

/**
 * Get the each node's immediately following sibling element. If a selector is provided, it retrieves the next sibling only if it matches that selector.
 * 
 * @function NodeCollection.prototype.next
 * @param {String} [selector] - A CSS selector to match the next sibling against.
 * @returns {NodeCollection} The collection of sibling elements.
 */
NodeCollectionPrototype.next = getNextOrPrevFunc(nextElementSibling);

/**
 * Gets all following siblings of each node in the collection, optionally filtered by a selector.
 * 
 * @function NodeCollection.prototype.nextAll
 * @param {String} [selector] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection} The set of following sibling elements in order beginning with the closest sibling.
 */
NodeCollectionPrototype.nextAll = getGetDirElementsFunc('nextAll', sortDocOrder);

/**
 * Gets the following siblings of each node in the collection, up to but not including the elements matched by the selector,
 * DOM node, or node in a collection.
 * 
 * @function NodeCollection.prototype.nextUntil
 * @param {String|Element|Node[]} [nodes] - A CSS selector, an element, or a collection of nodes used to indicate
 * that no more siblings should be considered.
 * @param {String} [filter] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection} - The set of following sibling elements in order beginning with the closest sibling.
 */
NodeCollectionPrototype.nextUntil = getGetDirElementsFunc('nextUntil', sortDocOrder);

/**
 * Gets the parent of each node in the collection, optionally filtered by a selector.
 * 
 * @function NodeCollection.prototype.parent
 * @param {String} [selector] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection} - The set of parents. Unlike the `.parents()` function, this set may include Document and DocumentFragment nodes.
 */
NodeCollectionPrototype.parent = function(selector) {
	var nc = new NodeCollection(),
		i = 0,
		parent;
	for (; i < this.length; i++) {
		parent = this[i].parentNode;
		if ((!selector || (parent.matches && parent.matches(selector))) && nc.indexOf(parent) < 0) {
			nc.push(parent);
		}
	}
	return nc;
};

/**
 * Gets the ancestors of each node in the collection, optionally filtered by a selector.
 * 
 * @function NodeCollection.prototype.parents
 * @param {String} [selector] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection} - The set of ancestors, sorted in reverse document order.
 */
NodeCollectionPrototype.parents = getGetDirElementsFunc('parents', sortRevDocOrder);

/**
 * Gets the ancestors of each node in the collection, up to but not including the elements matched by the selector,
 * DOM node, or node in a collection.
 * 
 * @function NodeCollection.prototype.parentsUntil
 * @param {String|Element|Node[]} [nodes] - A CSS selector, an element, or a collection of nodes used to indicate
 * that no more ancestors should be considered.
 * @param {String} [filter] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection} - The set of ancestors, sorted in reverse document order.
 */
NodeCollectionPrototype.parentsUntil = getGetDirElementsFunc('parentsUntil', sortRevDocOrder);

/**
 * Alias of {@link NodeCollection#prependWith} provided for similarity with jQuery.  
 * Note that Firebolt does not define a method called "prepend" for Nodes. This is because the DOM Living Standard has defined
 * a native function called `prepend` for the {@link http://dom.spec.whatwg.org/#interface-parentnode|ParentNode Interface} that
 * does not function in the same way as `prependWith`.
 * 
 * @function NodeCollection.prototype.prepend
 * @see NodeCollection#prependWith
 */
/**
 * Prepends content to the beginning of each element in the collection.
 * 
 * @function NodeCollection.prototype.prependWith
 * @param {...(String|Node|NodeCollection)} content - One or more HTML strings, nodes, or collections of nodes to insert.
 * @throws {HierarchyRequestError} The nodes in the collection must implement the {@link ParentNoded} interface.
 */
NodeCollectionPrototype.prependWith = NodeCollectionPrototype.prepend = function() {
	var len = this.length,
		firstNode = this[0];
	if (len > 1) {
		var fragment = createFragment(arguments),
			i = 1;
		for (; i < len; i++) {
			prepend(fragment.cloneNode(true), this[i]);
		}
		prepend(fragment, firstNode);
	}
	else if (len) { //Only one element to append to
		firstNode.prependWith.apply(firstNode, arguments);
	}

	return this;
};

/**
 * Prepends each node in this collection to the beginning of the specified target(s).
 * 
 * @function NodeCollection.prototype.prependTo
 * @param {String|ParentNode|NodeCollection} target - A specific node, collection of nodes, or a selector to find a set of nodes to which each node will be prepended.
 * @throws {HierarchyRequestError} The target(s) must implement the {@link ParentNode} interface.
 */
NodeCollectionPrototype.prependTo = getPutOrToFunction('prependWith');

/**
 * Get the each node's immediately preceeding sibling element. If a selector is provided, it retrieves the previous sibling only if it matches that selector.
 * 
 * @function NodeCollection.prototype.prev
 * @param {String} [selector] - A CSS selector to match the previous sibling against.
 * @returns {NodeCollection} The collection of sibling elements.
 */
NodeCollectionPrototype.prev = getNextOrPrevFunc(previousElementSibling);

/**
 * Gets all preceeding siblings of each node in the collection, optionally filtered by a selector.
 * 
 * @function NodeCollection.prototype.prevAll
 * @param {String} [selector] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection} The set of preceeding sibling elements in order beginning with the closest sibling.
 */
NodeCollectionPrototype.prevAll = getGetDirElementsFunc('prevAll', sortRevDocOrder);

/**
 * Gets the preceeding siblings of each node in the collection, up to but not including the elements matched by the selector,
 * DOM node, or node in a collection.
 * 
 * @function NodeCollection.prototype.prevUntil
 * @param {String|Element|Node[]} [nodes] - A CSS selector, an element, or a collection of nodes used to indicate
 * that no more siblings should be considered.
 * @param {String} [filter] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection} - The set of preceeding sibling elements in order beginning with the closest sibling.
 */
NodeCollectionPrototype.prevUntil = getGetDirElementsFunc('prevUntil', sortRevDocOrder);

/**
 * Gets the value of the specified property of the first element in the list.
 * 
 * @function NodeCollection.prototype.prop
 * @param {String} property - The name of the property who's value you want to get.
 * @returns {?} The value of the property being retrieved.
 */
/**
 * Sets the specified property for each element in the list.
 * 
 * @function NodeCollection.prototype.prop
 * @param {String} property - The name of the property to be set.
 * @param {*} value - The value to set the property to.
 */
/**
 * Sets the specified properties of each element in the list.
 * 
 * @function NodeCollection.prototype.prop
 * @param {Object} properties - An object of property-value pairs to set.
 */
NodeCollectionPrototype.prop = getFirstSetEachElement('prop', function(numArgs, firstArg) {
	return numArgs < 2 && typeofString(firstArg);
});

/**
 * Inserts each node in this collection directly after the specified target(s).
 * 
 * @function NodeCollection.prototype.putAfter
 * @param {String|Node|NodeCollection} target - A specific node, collection of nodes, or a selector to find a set of nodes after which each node will be inserted.
 * @throws {TypeError} The target node(s) must have a {@link https://developer.mozilla.org/en-US/docs/Web/API/Node.parentNode|ParentNode}.
 */
NodeCollectionPrototype.putAfter = NodeCollectionPrototype.insertAfter = getPutOrToFunction('afterPut');

/**
 * Inserts each node in this collection directly before the specified target(s).
 * 
 * @function NodeCollection.prototype.insertBefore
 * @param {String|Node|NodeCollection} target - A specific node, collection of nodes, or a selector to find a set of nodes before which each node will be inserted.
 * @throws {TypeError} The target node(s) must have a {@link https://developer.mozilla.org/en-US/docs/Web/API/Node.parentNode|ParentNode}.
 */
NodeCollectionPrototype.putBefore = NodeCollectionPrototype.insertBefore = getPutOrToFunction('beforePut');

/**
 * Removes nodes in the collection from the DOM tree.
 * 
 * @function NodeCollection.prototype.remove
 * @param {String} [selector] - A selector that filters the set of elements to be removed.
 */
NodeCollectionPrototype.remove = function(selector) {
	var nodes = selector ? this.filter(selector) : this,
		i = 0;
	for (; i < nodes.length; i++) {
		nodes[i].remove();
	}

	return this;
};

/**
 * Removes the specified attribute from each element in the list.
 * 
 * @function NodeCollection.prototype.removeAttr
 * @param {String} attribute - The name of the attribute to be removed.
 */
NodeCollectionPrototype.removeAttr = callOnEachElement('removeAttr');

/**
 * Removes the input class name from all elements in the list.
 * 
 * @function NodeCollection.prototype.removeClass
 * @param {String} className - The class to be removed from each element in the collection.
 */
NodeCollectionPrototype.removeClass = callOnEachElement('removeClass');

/**
 * Removes a previously stored piece of Firebolt data from each element.  
 * When called without any arguments, all data is removed.
 * 
 * @function NodeCollection.prototype.removeData
 * @param {String} [name] - The name of the data to remove.
 */
/**
 * Removes previously stored Firebolt data from each element.  
 * When called without any arguments, all data is removed.
 * 
 * @function NodeCollection.prototype.removeData
 * @param {Array|String} [list] - An array or space-separated string naming the pieces of data to remove.
 */
NodeCollectionPrototype.removeData = callOnEachElement('removeData');

/**
 * Removes the specified property from each element in the list.
 * 
 * @function NodeCollection.prototype.removeProp
 * @param {String} property - The name of the property to remove.
 */
NodeCollectionPrototype.removeProp = callOnEachElement('removeProp');

/**
 * Shows each element in the collection. For specifics, see {@link HTMLElement#show}.
 * 
 * @function NodeCollection.prototype.show
 * @see HTMLElement#show
 */
NodeCollectionPrototype.show = callOnEachElement('show');

/**
 * Gets the sibling elements of each node in the collection, optionally filtered by a selector.
 * 
 * @function NodeCollection.prototype.siblings
 * @param {String} [selector] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection} The set of siblings, sorted in document order.
 * @throws {TypeError} The target node(s) must have a {@link https://developer.mozilla.org/en-US/docs/Web/API/Node.parentNode|ParentNode}.
 */
NodeCollectionPrototype.siblings = getGetDirElementsFunc('siblings', sortDocOrder);

/**
 * Gets the combined text contents of each node in the list.
 * 
 * @function NodeCollection.prototype.text
 * @returns {String} The node's text content.
 */
/**
 * Sets the text content of each node in the list.
 * 
 * @function NodeCollection.prototype.text
 * @param {String|*} text - The text or content that will be converted to a string to be set as each nodes' text content.
 */
NodeCollectionPrototype.text = function(text) {
	var len = this.length,
		i = 0;
	//Get
	if (isUndefined(text)) {
		for (text = ''; i < len; i++) {
			text += this[i].textContent;
		}
		return text;
	}
	//Set
	for (; i < len; i++) {
		this[i].textContent = text;
	}

	return this;
};

/**
 * Toggles the input class name for all elements in the list.
 * 
 * @function NodeCollection.prototype.toggleClass
 * @param {String} className - The class to be toggled for each element in the collection.
 */
NodeCollectionPrototype.toggleClass = callOnEachElement('toggleClass');

/**
 * Retrieves the current value of the first element in the collection. If the element is a `<select>` element, `null` is returned if
 * none of its options are selected and an array of selected options is returned if the element's `multiple` attribute is present.
 * 
 * @function NodeCollection.prototype.val
 * @returns {String|Array|null} The first element's value.
 */
/**
 * Sets the value of each element in the collection.
 * 
 * @function NodeCollection.prototype.val
 * @param {String} value - The value to give to each element.
 */
/**
 * Checks each element in the collection if its current value is in the input array of values and deselects it otherwise
 * (only `<input>` elements with type `checkbox` or `radio`).  
 * If an element is a `<select>` element, all of its options with a value matching one in the input array of values will be selected
 * and all others deselected. If the select element does not allow multiple selection, only the first matching element is selected.
 * 
 * @function NodeCollection.prototype.val
 * @param {String[]} values - The array of values used to determine if each element (or its options) should be checked (or selected).
 */
NodeCollectionPrototype.val = getFirstSetEachElement('val', function(numArgs) {
	return !numArgs;
});

//#endregion NodeCollection


//#region =========================== NodeList ===============================

/**
 * @classdesc
 * The HTML DOM NodeList interface. This is the main object returned by {@link Firebolt#Firebolt|Firebolt}.  
 *   
 * Represents a collection of DOM Nodes. NodeLists have almost the exact same API as {@link NodeCollection}.  
 * However, unlike NodeCollections, NodeLists are immutable and therefore do not have any of the following functions:
 * 
 * + clear
 * + pop
 * + push
 * + reverse
 * + shift
 * + splice
 * + unshift
 * 
 * If you want to manipulate a NodeList using these functions, you must retrieve it as a NodeCollection by
 * calling {@linkcode NodeList#toNC|.toNC()} on the NodeList.
 * 
 * Also note that the following functions return the NodeCollection equivalent of the NodeList instead of
 * the NodeList itself:
 * 
 * + afterPut / after
 * + appendWith / append
 * + appendTo
 * + beforePut / before
 * + each
 * + putAfter / insertAfter
 * + putBefore / insertBefore
 * + prependWith / prepend
 * + prependTo
 * + remove
 * + removeClass
 * + toggleClass
 * 
 * This is because the functions my alter live NodeLists, as seen in this example:
 * 
 * ```JavaScript
 * var $blueThings = $CLS('blue');
 * $blueThings.length = 10;  // for example
 * $blueThings.removeClass('blue'); // returns $blueThings as a NodeCollection
 * $blueThings.length === 0; // true - since now there are no elements with the 'blue' class
 * ```
 * 
 * Returning a NodeCollection allows for correct functionality when chaining calls originally made on a NodeList,
 * but be aware that a live NodeList saved as a variable may be altered by these functions.
 * 
 * Finally, since it is not possible to manually create a new NodeList in JavaScript (there are tricks but
 * they are slow and not worth it), the following functions return a NodeCollection instead of a NodeList:
 * 
 * + add
 * + clean
 * + clone
 * + concat
 * + filter
 * + intersect
 * + map
 * + slice
 * + sort
 * + union
 * + unique
 * + without
 * 
 * This, however, should not be worrisome since NodeCollections have all of the same functions as NodeLists
 * with the added benefits of being mutable and static (not live).  
 * <br />
 * 
 * @class NodeList
 * @see NodeCollection
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/NodeList|NodeList - Web API Interfaces | MDN}
 */

/* Give NodeLists and HTMLCollections many of the same prototype functions as NodeCollections */
Object.getOwnPropertyNames(NodeCollectionPrototype)
	.remove( //These properties should not be added to the NodeList prototype
		'clear',
		'length',
		'pop',
		'push',
		'reverse',
		'shift',
		'splice',
		'unshift'
	).forEach(function(methodName) {
		if (rgxDifferentNL.test(methodName)) { //Convert to a NodeCollection first
			HTMLCollectionPrototype[methodName] = NodeListPrototype[methodName] = function() {
				return NodeCollectionPrototype[methodName].apply(this.toNC(), arguments);
			}
		}
		else if (!NodeListPrototype[methodName]) {
			HTMLCollectionPrototype[methodName] = NodeListPrototype[methodName] = NodeCollectionPrototype[methodName];
		}
	});

/**
 * Returns the specific node whose ID or, as a fallback, name matches the string specified by `name`.
 * 
 * @function NodeCollection.prototype.namedItem
 * @param {String} name
 * @returns {?Element}
 * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLCollection
 */
/**
 * Returns the specific node whose ID or, as a fallback, name matches the string specified by `name`.
 * 
 * @function NodeList.prototype.namedItem
 * @param {String} name
 * @returns {?Element}
 * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLCollection
 */
NodeListPrototype.namedItem = NodeCollectionPrototype.namedItem = function(name) {
	var i = 0,
		node;
	for (; i < this.length; i++) {
		node = this[i];
		if (node.id == name || node.name == name) {
			return node;
		}
	}
	return null;
};

/**
 * Returns the NodeCollection equivalent of the NodeList.
 * 
 * @function NodeList.prototype.toNC
 * @returns {NodeCollection}
 */
//This function was added to the NodeList prototype in the loop above (because NodeCollection actually has this function too)

/* HTMLCollections are always clean (since they can only contain HTMLElements) */
HTMLCollectionPrototype.clean =

/* NodeLists/HTMLCollections always contain unique elements */
NodeListPrototype.unique = HTMLCollectionPrototype.unique =

/* All of the above functions are equivalent to calling NodeCollection#toNC() on the NodeList/HTMLCollection */
NodeCollectionPrototype.toNC;

//#endregion NodeList


//#region ============================ Number ================================

/**
 * @class Number
 * @classdesc The JavaScript Number object.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number|Number - JavaScript | MDN}
 */

/**
 * Returns a string representation of the number padded with leading 0s so that the string's length is at least equal to length.
 * Takes an optional radix argument which specifies the base to use for conversion.
 * 
 * @function Number.prototype.toPaddedString
 * @param {Number} length - The minimum length for the resulting string.
 * @param {Number} [radix=10] - Defines which base to use for representing the numeric value. Must be an integer between 2 and 36.
 * @example
 * (255).toPaddedString(4);     // "0255"
 * (255).toPaddedString(4, 16); // "00ff"
 * (25589).toPaddedString(4);   // "25589"
 * (3).toPaddedString(5, 2);    // "00011"
 * (-3).toPaddedString(5, 2);   // "-0011"
 */
Number[prototype].toPaddedString = function(length, radix) {
	var sNumber = this.toString(radix);
	if (length > sNumber.length) {
		sNumber = '0'.repeat(length - sNumber.length) + sNumber;
	}
	return this < 0 ? '-' + sNumber.replace('-', '') : sNumber;
}; 

//#endregion Number


//#region ============================ String ================================

/**
 * @class String
 * @classdesc The JavaScript String object.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String|String - JavaScript | MDN}
 */

if (!StringPrototype.contains) {
	/**
	 * Determines whether the passed in string is in the current string.
	 *
	 * @function String.prototype.contains
	 * @param {String} searchString - The string to be searched for.
	 * @param {Number} [position=0] - The position in this string at which to begin the search.
	 * @returns {Boolean} `true` if this string contains the search string; else `false`.
	 * @example
	 * var str = "Winter is coming.";
	 * alert( str.contains(" is ") );    // true
	 * alert( str.contains("summer") );  // false
	 */
	defineProperty(StringPrototype, 'contains', {
		value: function(searchString, position) {
			return this.indexOf(searchString, position) >= 0;
		}
	});
}

if (!StringPrototype.endsWith) {
	/**
	 * Determines whether a string ends with the characters of another string.
	 *
	 * @function String.prototype.endsWith
	 * @param {String} searchString - The characters to be searched for at the end of this string.
	 * @param {Number} [position=this.length] - Search within this string as if this string were only this long; clamped within the range established by this string's length.
	 * @returns {Boolean} `true` if this string ends with `searchString`; else `false`.
	 * @example
	 * var str = "Who am I, Gamling?";
	 * alert( str.endsWith("Gamling?") );  // true
	 * alert( str.endsWith("am I") );      // false
	 * alert( str.endsWith("am I", 8) );   // true
	 */
	defineProperty(StringPrototype, 'endsWith', {
		value: function(searchString, position) {
			position = (!isUndefined(position) && position < this.length ? position : this.length) - searchString.length;
			return position >= 0 && this.indexOf(searchString, position) === position;
		}
	});
}

if (!StringPrototype.repeat) {
	/**
	 * Copies the current string a given number of times and returns the new string.
	 *
	 * @function String.prototype.repeat
	 * @param {Number} count - An integer between 0 and +∞ : [0, +∞).
	 * @returns {String}
	 * @throws {RangeError} The repeat count must be positive and less than infinity.
	 * @example
	 * "abc".repeat(0)   // ""
	 * "abc".repeat(1)   // "abc"
	 * "abc".repeat(2)   // "abcabc"
	 * "abc".repeat(3.5) // "abcabcabc" (count will be converted to integer)
	 * "0".repeat(5)     // "00000"
	 */
	defineProperty(StringPrototype, 'repeat', {
		value: function(count) {
			count = parseInt(count || 0);
			if (isNaN(count) || count < 0) {
				throw new RangeError('The repeat count must be positive and less than infinity.');
			}
			for (var str = '', i = 0; i < count; i++) {
				str += this;
			}
			return str;
		}
	});
}

if (!StringPrototype.startsWith) {
	/**
	 * Determines whether a string starts with the characters of another string.
	 *
	 * @function String.prototype.startsWith
	 * @param {String} searchString - The characters to be searched for at the start of this string.
	 * @param {Number} [position=0] - The position in this string at which to begin searching for `searchString`.
	 * @returns {Boolean} `true` if this string starts with the search string; else `false`.
	 * @example
	 * var str = "Who am I, Gamling?";
	 * alert( str.endsWith("Who") );      // true
	 * alert( str.endsWith("am I") );     // false
	 * alert( str.endsWith("am I", 4) );  // true
	 */
	defineProperty(StringPrototype, 'startsWith', {
		value: function(searchString, position) {
			position = position || 0;
			return this.lastIndexOf(searchString, position) === position;
		}
	});
}

defineProperties(StringPrototype, {
	/**
	 * Returns the string split into an array of substrings (tokens) that were separated by white-space.
	 *
	 * @function String.prototype.tokenize
	 * @returns {String[]} An array of tokens.
	 * @example
	 * var str = "The boy who lived.";
	 * str.tokenize();  // returns ["The", "boy", "who", "lived."]
	 */
	tokenize: {
		value: function() {
			return this.match(rgxNonWhitespace) || [];
		}
	},

	/**
	 * Appends query string parameters to a URL.
	 *
	 * @function String.prototype.URLAppend
	 * @param {String} params - Query string parameters.
	 * @returns {String} A reference to the string.
	 * @example
	 * var url = "http://google.com";
	 * url = url.URLAppend('lang=en');  // "http://google.com?lang=en"
	 * url = url.URLAppend('foo=bar');  // "http://google.com?lang=en&foo=bar"
	 */
	URLAppend: {
		value: function(params) {
			return this.concat(this.contains('?') ? '&' : '?', params);
		}
	}
});

//#endregion String


//#region ============ Browser Compatibility and Speed Boosters ==============

var isOldIE = createElement('div').html('<!--[if IE]><i></i><![endif]-->').$TAG('i').length,
	isIOS = navigator.platform.startsWith('iP'), // iPhone, iPad, iPod
	usesWebkit = 'WebkitAppearance' in document.documentElement.style,
	noMultiParamClassListFuncs = (function() {
		var elem = createElement('div');
		if (elem.classList) {
			elem.classList.add('one', 'two');
		}
		return elem.className.length !== 7;
	})(),
	textNode = Firebolt.text(' ');

if (isOldIE) { //IE9 compatibility

	HTMLElementPrototype.hasClass = function(className) {
		return new RegExp('(?:^|\\s)' + className + '(?:\\s|$)').test(this.className);
	};

	//Must persist the iframe otherwise IE won't remember what the NodeCollection function is
	Firebolt.__$$ = any;
}

/* Browser (definitely IE) compatibility and speed boost for removeClass() */
if (noMultiParamClassListFuncs || (usesWebkit && !isIOS)) {
	HTMLElementPrototype.removeClass = function(value) {
		if (isUndefined(value)) {
			this.className = ''; //Remove all classes
		}
		else {
			var remClasses = value.split(' '),
				curClasses = this.className.split(rgxSpaceChars),
				newClassName = '',
				i = 0;
			for (; i < curClasses.length; i++) {
				if (curClasses[i] && remClasses.indexOf(curClasses[i]) < 0) {
					newClassName += (newClassName ? ' ' : '') + curClasses[i];
				}
			}
			//Only assign if the new class name is different (shorter) to avoid unnecessary rendering
			if (newClassName.length < this.className.length) {
				this.className = newClassName;
			}
		}

		return this;
	};
}

//Fix the parentElement property for Nodes in browsers than only support it on Element
if (isUndefined(textNode.parentElement)) {
	defineProperty(NodePrototype, 'parentElement', {
		get: function() {
			var parent = this.parentNode;
			return parent && parent.nodeType === 1 ? parent : null;
		}
	});
}

//Fix the nextElementSibling property for Nodes in browsers than only support it on Element
if (isUndefined(textNode[nextElementSibling])) {
	defineProperty(NodePrototype, nextElementSibling, {
		get: function() {
			var sibling = this;
			while (sibling = sibling.nextSibling) {
				if (sibling.nodeType === 1) break;
			}
			return sibling;
		}
	});
}

//Fix the previousElementSibling property for Nodes in browsers than only support it on Element
if (isUndefined(textNode[previousElementSibling])) {
	defineProperty(NodePrototype, previousElementSibling, {
		get: function() {
			var sibling = this;
			while (sibling = sibling.previousSibling) {
				if (sibling.nodeType === 1) break;
			}
			return sibling;
		}
	});
}

//Fix the children property for Document and DocumentFragment in browsers than only support it on Element
if (!document.children) {
	[Document[prototype], DocumentFragment[prototype]].forEach(function(proto) {
		defineProperty(proto, 'children', {
			get: function() {
				//This method is faster in IE and slower in WebKit-based browsers, but it takes less code
				//and calling children on Documents and DocumentFragments is rare so it's not a big deal.
				//Also not using NodeCollection#clean() because that function is sort of on probation.
				return ncFilter.call(this.childNodes, function(node) {
					return node.nodeType === 1;
				});
			}
		});
	});
}

//#endregion Browser Compatibility and Speed Boosters

})(self, document, Array, Object, decodeURIComponent, encodeURIComponent); //self === window
