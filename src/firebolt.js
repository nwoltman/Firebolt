/*!
 * Firebolt core file
 * @version 0.10.0
 * @author Nathan Woltman
 * @copyright 2014 Nathan Woltman
 * @license MIT https://github.com/woollybogger/Firebolt/blob/master/LICENSE.txt
 */

(function(window, document, Array, Object, decodeURIComponent, encodeURIComponent, getComputedStyle, parseFloat, setTimeout, clearTimeout, _undefined) {

'use strict';

//#region =========================== Private ================================

/*
 * Function for appending a node to a reference node.
 */
function append(newNode, refNode) {
	refNode.appendChild(newNode);
}

/*
 * Calls the passed in function on each item in the enumerable.
 * 
 * @param {Function} fn - The function to call on each item.
 * @returns {Enumerable} `this`
 * @this An enumerable object such as Array or NodeList.
 */
function callOnEach(fn) {
	return function() {
		for (var i = 0, len = this.length; i < len; i++) {
			fn.apply(this[i], arguments);
		}
		return this;
	};
}

/*
 * Returns a camelized version of a string
 */
function camelize(str) {
	return str.replace(rgxCamelizables, camelizer);
}

/*
 * Pre-defined so that an anonymous function does not need to be created each time camelize() is called.
 */
function camelizer(match, p1) {
	return p1 ? p1.toUpperCase() : '';
}

/*
 * Given two Nodes who are clones of each other, this function copies data and events from node A to node B.
 * This function will run recursively on the children of the nodes unless `doNotCopyChildNodes` is `true`.
 * 
 * @param {Node} nodeA - The node being copied.
 * @param {Node} nodeB - The node that will receive nodeA's data and events.
 * @param {!Boolean} doNotCopyChildNodes - Inidicates if data and events for child notes should not be copied.
 */
function copyDataAndEvents(nodeA, nodeB, doNotCopyChildNodes) {
	var data = nodeA[Firebolt.expando],
		events = nodeA._$E_;

	// Data
	if (data) {
		// Use Firebolt.data in case the node was created in a different window
		extendDeep(Firebolt.data(nodeB), data);
	}

	/* From this point on, the `data` variable is reused as the counter (or property name) in loops */

	// Events
	if (events) {
		// Copy event data and set the handler for each type of event
		nodeB._$E_ = extendDeep({}, events);
		for (data in events) {
			nodeB.addEventListener(data, nodeEventHandler);
		}
	}

	// Copy data and events for child nodes
	if (!doNotCopyChildNodes && (nodeA = nodeA.childNodes)) {
		nodeB = nodeB.childNodes;

		// The nodeA and nodeB variables are now the childNodes NodeLists of the original nodes
		for (data = 0; data < nodeA.length; data++) {
			copyDataAndEvents(nodeA[data], nodeB[data]);
		}
	}
}

/*
 * Takes a string indicating an event type and returns an Event object that bubbles and is cancelable.
 * 
 * @param {String} eventType - The name of the type of event (such as "click").
 */
function createEventObject(eventType, event) { // Declaring `event` in the parameters to save a var declaration
	if (Event.length) { // Use the modern Event constructor
		event = new Event(eventType, {
			bubbles: true,
			cancelable: true
		});
	}
	else { // Use the deprecated document.createEvent() + event.initEvent() method
		event = document.createEvent('Event');
		event.initEvent(eventType, true, true);
	}

	return event;
}

/*
 * Creates a new DocumentFragment and appends the (optionally) passed in content to it.
 * 
 * @param {ArgumentsList} [content] - List of content to append to the new DocumentFragment.
 * @returns {DocumentFragment} The new fragment.
 */
function createFragment(content) {
	var fragment = document.createDocumentFragment(),
		i = 0,
		item,
		len,
		isLive,
		j;

	for (; i < content.length; i++) {
		if (isNode(item = content[i])) {
			fragment.appendChild(item);
		}
		else {
			if (typeofString(item)) {
				item = parseHTML(item);
			}

			if (len = item.length) {
				fragment.appendChild(item[0]);
				isLive = item.length < len; // Determine if the item is a live NodeList/HTMLCollection
				for (j = 1; j < len; j++) {
					fragment.appendChild(item[isLive ? 0 : j]);
				}
			}
		}
	}

	return fragment;
}

/*
 * Used for animations to compute a new CSS value when doing += or -= for some value type.
 * For this to work, the current value (in pixels) must be converted to the value type that is being changed.
 * 
 * @param {Number} curVal - The current CSS value in pixels.
 * @param {Number} changeVal - The amount the current value should change. The value type is indicated by the `type` parameter.
 * @param {String} type - "px", "em", "pt", "%", or "" (empty string, for things like opacity)
 * @param {Element} element - The element who's CSS property is to be changed.
 * @param {String} property - The name of the CSS property being changed.
 */
function cssMath(curVal, changeVal, type, element, property) {
	if (type == 'em') {
		curVal /= parseFloat(getComputedStyle(element).fontSize);
	}
	else if (type == 'pt') {
		curVal *= 0.75; //Close enough (who uses pt anyway?)
	}
	else if (type == '%') {
		curVal *= 100 / parseFloat(getComputedStyle(element.parentNode)[property]);
	}

	curVal += changeVal; //Add the change value (which may be negative)

	//Convert invalid negative values to 0
	if (curVal < 0 && /^height|width|padding|opacity/.test(property)) {
		curVal = 0;
	}

	return curVal + type; //i.e. 1.5 + "em" -> "1.5em"
}

/*
 * Returns a dasherized version of a camel case string
 */
function dasherize(str) {
	return str.replace(rgxDasherizables, '-$&').toLowerCase();
}

/*
 * Uses Object.defineProperty to define the values in the prototypeExtension object on the passed in prototype object
 */
function definePrototypeExtensionsOn(proto, extensions) {
	for (var prop in extensions) {
		defineProperty(proto, prop, {
			value: extensions[prop],
			configurable: true,
			writable: true
		});
	}
}

/*
 * Returns the status text string for AJAX requests.
 */
function getAjaxErrorStatus(xhr) {
	return xhr.readyState ? xhr.statusText.replace(xhr.status + ' ', '') : '';
}

/*
 * Returns a function that is the input function bound to the document.
 * Used for creating the $$, $CLS, $TAG, $QS, $QSA functions.
 * @param {function} fn - The function to be called on the document.
 */
function getElementSelectionFunction(fn) {
	return isIOS ? function(selector) {
		return fn.call(document, selector);
	} : fn.bind(document);
}

/*
 * Returns a function that calls the passed in function on each element in a NodeCollection unless the callback
 * returns true, in which case the result of calling the function on the first element is returned.
 * 
 * @param {Function} fn - The function to use as the getter or setter.
 * @param {Function} isSetter(numArgs, firstArg) - Function to determine if the value of the first element should be returned.
 */
function getFirstSetEachElement(fn, isSetter) {
	return function(firstArg) {
		var items = this,
			len = items.length,
			i = 0;

		if (!isSetter(arguments.length, firstArg)) {
			// Set each
			for (; i < len; i++) {
				if (isNodeElement(items[i])) {
					fn.apply(items[i], arguments);
				}
			}
			return items;
		}

		// Get first
		for (; i < len; i++) {
			if (isNodeElement(items[i])) {
				return fn.call(items[i], firstArg); // Only need first arg for getting
			}
		}
	};
}

/*
 * Returns a function that creates a set of elements in a certain direction around
 * a given node (i.e. parents, children, siblings, find -> all descendants).
 * 
 * @param {Function|String} direction - A function or name of a function that retrieves elements for a single node.
 * @param {Function|Number} [sorter] - A function used to sort the union of multiple sets of returned elements.
 * If sorter == 0, return an 'until' Node function.
 */
function getGetDirElementsFunc(direction, sorter) {
	if (sorter) {
		//For NodeCollection.prototype
		return function() {
			var len = this.length;

			//Simple and speedy for one node
			if (len === 1) {
				return direction.apply(this[0], arguments);
			}

			//Build a list of NodeCollections
			var collections = [],
				i = 0;
			for (; i < len; i++) {
				collections[i] = direction.apply(this[i], arguments);
			}

			//Union the collections so that the resulting collection contains unique elements and return the sorted result
			return ArrayPrototype.union.apply(NodeCollectionPrototype, collections).sort(sorter);
		};
	}

	//For Node.prototype
	return sorter === 0
		//nextUntil, prevUntil, parentsUntil
		? function(until, filter) {
			var nc = new NodeCollection(),
				node = this,
				stop = typeofString(until) // Until match by CSS selector
					? function() {
						return node.matches(until);
					}
					: until && until.length // Until Node[] contains the current node
						? function() {
							return until.contains(node);
						}
						// Until nodes are equal (or if `until.length === 0`, this will always return false)
						: function() {
							return node === until;
						};

			// Traverse all nodes in the direction and add them (or if there is a selector the ones that match it) to the NodeCollection
			// until the `stop()` function returns `true`
			while ((node = node[direction]) && !stop()) {
				if (!filter || node.matches(filter)) {
					push1(nc, node);
				}
			}

			return nc;
		}

		//nextAll, prevAll, parents
		: function(selector) {
			var nc = new NodeCollection(),
				node = this;

			//Traverse all nodes in the direction and add them (or if there is a selector the ones that match it) to the NodeCollection
			while (node = node[direction]) {
				if (!selector || node.matches(selector)) {
					push1(nc, node);
				}
			}

			return nc;
		};
}

function getHTMLElementAfterPutOrPrependWith(htmlLocation, inserter) {
	return function() {
		var i = arguments.length - 1,
			arg;

		for (; i >= 0; i--) {
			if (typeofString(arg = arguments[i])) {
				this.insertAdjacentHTML(htmlLocation, arg);
			} else {
				// When arg is a collection of nodes, create a fragment by passing the collection in an array
				// (that is the form of input createFragment expects since it normally takes a function's arg list)
				inserter(isNode(arg) ? arg : createFragment([arg]), this);
			}
		}

		return this;
	};
}

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
					push1(nc, sibling);
				}
			}
			return nc;
		};
}

/* 
 * Returns the function body for NodeCollection#[afterPut, appendWith, beforePut, prependWith, replaceWith]
 * 
 * @param {Function} inserter(newNode, refNode) - The function that performs the insertion.
 */
function getNodeCollectionPutOrWithFunction(inserter) {
	return function(nc, addClones) {
		//Determine if this function was called by a function created with `getNodeCollectionPutToOrReplaceAllFunction()`
		addClones = addClones === 0;

		var len = this.length,
			i = 1,
			fragment,
			clone;

		//Only create the DocumentFragment and do insertions if this NodeCollection isn't empty
		if (len) {
			fragment = createFragment(addClones ? [nc] : arguments);
			for (; i < len; i++) {
				clone = fragment.cloneNode(true);
				if (addClones) {
					array_push.apply(nc, clone.childNodes);
				}
				inserter(clone, this[i]);
			}
			inserter(fragment, this[0]); //The first node always gets the original fragment
		}

		return this;
	};
}

/* Returns the function body for NodeCollection#[appendTo, putAfter, putBefore, prependTo, replaceAll] */
function getNodeCollectionPutToOrReplaceAllFunction(funcName) {
	var NodeInserter = NodePrototype[funcName];

	return function(target) {
		var copy = ncFrom(this);

		if (typeofString(target)) {
			Firebolt(target)[funcName](copy, 0); //Pass in 0 to tell the function to add clones to the copy
		} else {
			NodeInserter.call(target, copy);
		}

		return copy;
	};
}

/* 
 * Returns the function body for Node#[appendTo, putAfter, putBefore, prependTo, replaceAll]
 * 
 * @param {Function} inserter(newNode, refNode) - The function that performs the insertion.
 */
function getNodeInsertingFunction(inserter) {
	return function(target) {
		if (typeofString(target)) {
			target = Firebolt(target);
		} else if (isNode(target)) {
			inserter(this, target);
			return this;
		}

		var i = target.length;
		if (i--) {
			for (; i > 0; i--) {
				inserter(this.cloneNode(true), target[i]);
			}
			inserter(this, target[0]);
		}

		return this;
	};
}

/* 
 * Returns the function body for NodeCollection#[afterPut, appendWith, beforePut, prependWith, replaceWith]
 * 
 * @param {Function} inserter(newNode, refNode) - The function that performs the insertion.
 */
function getNodePutOrWithFunction(inserter) {
	return function() {
		inserter(createFragment(arguments), this);

		return this;
	};
}

/*
 * Takes in the input from `.wrap()` or `.wrapInner()` and returns a new element (or null/undefined) to be the wrapping element.
 */
function getWrappingElement(input) {
	if (typeofString(input)) {
		input = $1(input);
	}
	else if (!input.nodeType) { //Element[]
		input = input[0];
	}

	return input && input.cloneNode(true);
}

/*
 * Takes in a wrapping element and returns its deepest first element child (or itself if it has no child elements).
 */
function getWrappingInnerElement(wrapper) {
	while (wrapper.firstElementChild) {
		wrapper = wrapper.firstElementChild;
	}
	return wrapper;
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
 * Used to determine if the element's computed display style is "none".
 * To save time from getting the element's computed style object, a style object may be passed as the second parameter
 * (useful in places where the computed style object has already been retrieved).
 */
function isDisplayNone(element, styleObject) {
	return (styleObject || getComputedStyle(element)).display == 'none';
}

/*
 * Determines if the passed in node is an element
 * 
 * @param {Node} node
 * @returns {Boolean}
 */
function isNodeElement(node) {
	return node.nodeType === 1;
}

/*
 * Prepends a node to a reference node. 
 */
function prepend(newNode, refNode) {
	refNode.insertBefore(newNode, refNode.firstChild);
}

/*
 * Appends a single value to the end of the specified array.
 * 
 * @param {Array} array - Must be a true array (includes NodeCollection).
 * @param {*} value - The value to append to the array.
 */
function push1(array, value) {
	array[array.length] = value;
}

/*
 * Replaces a reference node with a new node.
 */
function replaceWith(newNode, refNode) {
	refNode.parentNode.replaceChild(newNode, refNode);
}

/*
 * Simply returns `false`. For use in Node#on/off
 */
function returnFalse() {
	return false;
}

function sanitizeCssPropName(name) {
	// Camelize the property name, and check if it exists on the saved iframe's style object
	if (iframe.style[name = camelize(name)] === _undefined) {
		// The input property name is not supported, so make the vendor name and check if that one is supported
		var vendorName = cssVendorPrefix + name[0].toUpperCase() + name.slice(1);
		if (iframe.style[vendorName] != _undefined) {
			name = vendorName;
		}
	}

	return name;
}

/*
 * Takes in an Array constructor and creates a partial ES6 shim for the `.from()` function,
 * setting it on the constructor if it does not already exist, then returns that function.
 * 
 * @param {function} - The Array or NodeCollection constructor function.
 * @returns {function} - The created `from` function.
 */
function setAndGetArrayFromFunction(constructor) {
	function from(arrayLike) {
		var len = arrayLike.length,
			array = new constructor(len),
			i = 0;

		for (; i < len; i++) {
			array[i] = arrayLike[i];
		}

		return array;
	}

	constructor.from = constructor.from || from;

	return from;
}

function sortDocOrder(a, b) {
	b = a.compareDocumentPosition(b);
	return b & 4 ? -1 // Node a should come first
		: b & 1 ? 0   // Nodes are in different documents
		: 1;          // Else node b should come first
}

function sortRevDocOrder(a, b) {
	b = a.compareDocumentPosition(b);
	return b & 2 ? -1 // Node b should come first
		: b & 1 ? 0   // Nodes are in different documents
		: 1;          // Else node a should come first
}

function typeofObject(value) {
	return typeof value == 'object';
}

function typeofString(value) {
	return typeof value == 'string';
}

var
	/* Browser/Engine detection */
	isIE = document.documentMode,
	isIOS = /^iP/.test(navigator.platform), // iPhone, iPad, iPod
	usesWebkit = window.webkitURL,
	webkitNotIOS = usesWebkit && !isIOS,
	usesGecko = window.mozInnerScreenX != _undefined,

	/*
	 * Determines if an item is a Node.
	 * Gecko's instanceof Node is faster (but might want to check if that's because it caches previous calls).
	 */
	isNode = usesGecko
		? function(obj) {
			return obj instanceof Node;
		}
		: function(obj) {
			return obj && obj.nodeType;
		},

	//Property strings
	nextElementSibling = 'nextElementSibling',
	previousElementSibling = 'previousElementSibling',
	prototype = 'prototype',

	//Prototype references
	ArrayPrototype = Array[prototype],
	ElementPrototype = Element[prototype],
	EventPrototype = Event[prototype],
	HTMLElementPrototype = HTMLElement[prototype],
	NodePrototype = Node[prototype],
	NodeListPrototype = NodeList[prototype],
	HTMLCollectionPrototype = HTMLCollection[prototype],
	StringPrototype = String[prototype],

	//Helpers
	isArray = Array.isArray,
	arrayFrom = setAndGetArrayFromFunction(Array),
	array_push = ArrayPrototype.push,
	stopPropagation = EventPrototype.stopPropagation,
	defineProperty = Object.defineProperty,
	keys = Object.keys,

	//Local + global selector funtions
	getElementById = window.$$ = window.$ID =
		webkitNotIOS ? function(id) {
			return document.getElementById(id);
		} : getElementSelectionFunction(document.getElementById),

	getElementsByClassName = window.$CLS =
		webkitNotIOS ? function(className) {
			return document.getElementsByClassName(className);
		} : getElementSelectionFunction(document.getElementsByClassName),

	getElementsByTagName = window.$TAG =
		webkitNotIOS ? function(tagName) {
			return document.getElementsByTagName(tagName);
		} : getElementSelectionFunction(document.getElementsByTagName),

	querySelector = window.$QS =
		webkitNotIOS ? function(selector) {
			return document.querySelector(selector);
		} : getElementSelectionFunction(document.querySelector),

	querySelectorAll = window.$QSA =
		webkitNotIOS ? function(selector) {
			return document.querySelectorAll(selector);
		} : getElementSelectionFunction(document.querySelectorAll),

	/* Pre-built RegExps */
	rgxDataType = /\b(?:xml|json)\b|script\b/, // Matches an AJAX data type in Content-Type header
	rgxNotId = /[ .,>:[+~\t-\f]/,    //Matches other characters that cannot be in an id selector
	rgxNotClass = /[ #,>:[+~\t-\f]/, //Matches other characters that cannot be in a class selector
	rgxAllDots = /\./g,
	rgxNotTag = /[^A-Za-z]/,
	rgxFirstTag = /<\w+/, //Matches the first tag in an HTML string
	rgxSingleTag = /^<[A-Za-z]+\/?>$/, //Matches a single HTML tag such as "<div/>"
	rgxSpaceChars = /[ \t-\f]+/, //From W3C http://www.w3.org/TR/html5/single-page.html#space-character
	rgxFormButton = /button|file|reset|submit/, //Matches input element types that are buttons
	rgxCheckableElement = /checkbox|radio/,     //Matches checkbox or radio input element types
	rgxCamelizables = isIE ? /^-+|-+([a-z])/g : /-+([a-z])/g, //Matches dashed parts of CSS property names
	rgxDasherizables = /[A-Z]/g, //Matches capitol letters in a camel case string
	rgxNoParse = /^\d+(?:[^\d.]|\..*\D|\..*0$)/, //Matches strings that look like numbers but should remain as strings
	rgxUpToUnits = /.*\d/, //Matches a CSS string value up to the units (i.e. matches up to the last number before 'px' or '%')

	// Determines if the function is different for NodeLists
	rgxDifferentNL = /^(?:af|ap|be|conc|cop|ea|fill|ins|prep|pu|rep|rev|sor|toggleC)|wrap|remove(?:Class)?$/,

	/* Needed for parsing HTML */
	optData = [1, '<select multiple>', '</select>'],
	tableData = [1, '<table>', '</table>'],
	cellData = [3, '<table><tbody><tr>', '</tr></tbody></table>'],
	specialElementsMap = {
		'<option': optData,
		'<optgroup': optData,
		'<thead': tableData,
		'<tbody': tableData,
		'<tfoot': tableData,
		'<colgroup': tableData,
		'<caption': tableData,
		'<tr': [2, '<table><tbody>', '</tbody></table>'],
		'<col': [2, '<table><colgroup>', '</colgroup></table>'],
		'<td': cellData,
		'<th': cellData
	},

	/* AJAX */
	timestamp = Date.now(),
	ajaxSettings = {
		async: true,
		isLocal: /^(?:file|.*-extension|widget):/.test(location.href),
		type: 'GET',
		url: location.href
	},

	/* Animations */
	ANIMATION_DEFAULT_DURATION = 400,
	ANIMATION_DEFAULT_EASING = 'swing',
	TOGGLE = 'toggle',

	/* Misc */
	documentHead = document.head, //The document's <head> element
	iframe = createElement('iframe'), //Used for subclassing Array and determining default CSS values

	/* CSS */
	cssVendorPrefix = usesWebkit ? 'webkit'
					: usesGecko ? 'Moz'
					: isIE ? 'ms'
					: 'O',
	cssTransitionKey = sanitizeCssPropName('transition'),
	noCssTransitionSupport = iframe.style[cssTransitionKey] === _undefined,

	/* Events */
	transitionendEventName = cssTransitionKey + (cssTransitionKey[0] === 'w' ? 'End' : 'end'),

//#endregion Private


//#region ============================ Array =================================

/**
 * @class Array
 * @classdesc The JavaScript Array object.
 * @mixes Object
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array | Array - JavaScript | MDN}
 */

/**
 * @summary Creates a new Array instance from an array-like object.
 * 
 * @description
 * This is a partial shim for the ES6-defined {@linkcode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from | Array.from()}
 * function that only accepts array-like objects and does not support the optional `mapFn` or `thisArg` arguments.
 * 
 * Firebolt will not alter `Array.from` if it is already implemented by the browser. Furthermore, since Firebolt implements a subset
 * if the ES6-defined functionality, code that works with Firebolt's shim will also work when browsers natively implement
 * `Array.from`, so your code will be future-proof.
 * 
 * @function Array.from
 * @param {Object} arrayLike - An array-like object to convert to an array.
 * @returns {Array}
 */

prototypeExtensions = {
	/**
	 * Removes all elements from the array.
	 * 
	 * @function Array#clear
	 */
	clear: function() {
		this.length = 0;
	},

	/**
	 * Returns a duplicate of the array.
	 * 
	 * @function Array#clone
	 * @returns {Array} A shallow copy of the array.
	 */
	clone: function() {
		return arrayFrom(this);
	},

	/**
	 * Determines if the input item is in the array.
	 * 
	 * @function Array#contains
	 * @returns {Boolean} `true` if the item is in the array, `false` otherwise.
	 */
	contains: ArrayPrototype.contains || function(e) {
		return this.indexOf(e) >= 0;
	},

	/**
	 * @summary Executes a function on each item in the array.
	 * 
	 * @description
	 * A generic iterator function is similar to `Array#forEach()` but with the following differences:
	 * 
	 * 1. `this` always refers to the current item in the iteration (the `value` argument to the callback).
	 * 2. Returning `false` in the callback will cancel the iteration (similar to a `break` statement).
	 * 3. The array is returned to allow for function chaining.
	 * 
	 * @function Array#each
	 * @param {function(*, Number, Array)} callback(value,index,array) - A function to be executed on each
	 *                                                                   item in the array.
	 * @returns {Array} this
	 */
	each: function(callback) {
		var i = 0;

		while (i < this.length && callback.call(this[i], this[i], i++, this) !== false);

		return this;
	},

	/**
	 * Determines if the arrays are equal by doing a shallow comparison of their elements using strict equality.
	 * 
	 * __Note:__ The order of elements in the arrays DOES matter. The elements must be found in the same order
	 * for the arrays to be considered equal.
	 * 
	 * @example
	 * var array = [1, 2, 3];
	 * 
	 * array.equals(array);     // -> true
	 * array.equals([1, 2, 3]); // -> true
	 * array.equals([3, 2, 1]); // -> false
	 * 
	 * @function Array#equals
	 * @param {Array} array - Array or array-like object.
	 * @returns {Boolean} `true` if the arrays are equal, `false` otherwise.
	 * @throws {TypeError} Throws an error if the input value is `null` or `undefined`.
	 */
	equals: function(array) {
		// Only need to check contents if the input array is not the same as this array
		if (this !== array) {
			if (this.length !== array.length) {
				return false;
			}

			for (var i = 0; i < array.length; i++) {
				if (this[i] !== array[i]) {
					return false;
				}
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
	 * @function Array#get
	 * @param {Number} index - A zero-based integer indicating which item to retrieve.
	 * @returns {*} The item at the specified index.
	 */
	get: function(index) {
		return this[index < 0 ? index + this.length : index];
	},

	/**
	 * Removes all occurrences of the passed in items from the array if they exist in the array.
	 * 
	 * @example
	 * var array = [1, 2, 3, 3, 4, 3, 5];
	 * array.remove(1);    // -> [2, 3, 3, 4, 3, 5]
	 * array.remove(3);    // -> [2, 4, 5]
	 * array.remove(2, 5); // -> [4]
	 * 
	 * @function Array#remove
	 * @param {...*} *items - Items to remove from the array.
	 * @returns {Array} A reference to the array (so it's chainable).
	 */
	remove: function() {
		for (var i = 0, remIndex; i < arguments.length; i++) {
			while ((remIndex = this.indexOf(arguments[i])) >= 0) {
				this.splice(remIndex, 1);
			}
		}

		return this;
	},

	/**
	 * Returns an array containing every distinct item that is in either this array or the input array(s).
	 * 
	 * @example
	 * [1, 2, 3].union([2, 3, 4, 5]); // -> [1, 2, 3, 4, 5]
	 * 
	 * @function Array#union
	 * @param {...Array} *arrays - A variable number of arrays or array-like objects.
	 * @returns {Array} An array that is the union of this array and the input array(s).
	 */
	union: function() {
		var union = this.uniq(),
			i = 0,
			j,
			array;

		for (; i < arguments.length; i++) {
			array = arguments[i];
			for (j = 0; j < array.length; j++) {
				if (union.indexOf(array[j]) < 0) {
					push1(union, array[j]);
				}
			}
		}

		return union;
	}
};

function getTypedArrayFunctions(constructor) {
	return {
		/**
		 * Returns a copy of the array with all "empty" items (as defined by {@linkcode Firebolt.isEmpty}) removed.
		 * 
		 * @function Array#clean
		 * @returns {Array} A clean copy of the array.
		 * @see Firebolt.isEmpty
		 */
		clean: function() {
			var cleaned = new constructor(),
				i = 0;

			for (; i < this.length; i++) {
				if (!Firebolt.isEmpty(this[i])) {
					push1(cleaned, this[i]);
				}
			}

			return cleaned;
		},

		/**
		 * Returns a new array with all of the values of this array that are not in any of the input arrays (performs a set difference).
		 * 
		 * @example
		 * [1, 2, 3, 4, 5].diff([5, 2, 10]); // -> [1, 3, 4]
		 * 
		 * @function Array#diff
		 * @param {...Array} *arrays - A variable number of arrays or array-like objects.
		 * @returns {Array}
		 */
		diff: function() {
			var difference = new constructor(),
				i = 0,
				j,
				k,
				item,
				array;

			next: for (; i < this.length; i++) {
				item = this[i];

				for (j = 0; j < arguments.length; j++) {
					array = arguments[j];

					for (k = 0; k < array.length; k++) {
						if (item === array[k]) {
							continue next;
						}
					}
				}

				//The item was not part of any of the input arrays so it can be added to the difference array
				push1(difference, item);
			}

			return difference;
		},

		/**
		 * Performs a set intersection on this array and the input array(s).
		 * 
		 * @example
		 * [1, 2, 3].intersect([2, 3, 4]); // -> [2, 3]
		 * [1, 2, 3].intersect([101, 2, 50, 1], [2, 1]); // -> [1, 2]
		 * 
		 * @function Array#intersect
		 * @param {...Array} *arrays - A variable number of arrays or array-like objects.
		 * @returns {Array} An array that is the intersection of this array and the input array(s).
		 */
		intersect: function() {
			var intersection = new constructor(),
				i = 0,
				j,
				item;

			next: for (; i < this.length; i++) {
				//The current item can only be added if it is not already in the intersection
				if (intersection.indexOf(item = this[i]) < 0) {
					//If the item is not in every input array, continue to the next item without adding the current one
					for (j = 0; j < arguments.length; j++) {
						if (ArrayPrototype.indexOf.call(arguments[j], item) < 0) {
							continue next;
						}
					}

					push1(intersection, item);
				}
			}

			return intersection;
		},

		/**
		 * Returns a duplicate-free clone of the array.
		 * 
		 * @example
		 * // Unsorted
		 * [4, 2, 3, 2, 1, 4].uniq();     // -> [4, 2, 3, 1]
		 * 
		 * // Sorted
		 * [1, 2, 2, 3, 4, 4].uniq();     // -> [1, 2, 3, 4]
		 * [1, 2, 2, 3, 4, 4].uniq(true); // -> [1, 2, 3, 4] (but faster than on the previous line)
		 * 
		 * @function Array#uniq
		 * @param {Boolean} [isSorted=false] - If the input array's contents are sorted and this is set to `true`,
		 * a faster algorithm will be used to create the unique array.
		 * @returns {Array}
		 */
		uniq: function(isSorted) {
			var unique = new constructor(),
				i = 0;

			for (; i < this.length; i++) {
				if (isSorted) {
					if (this[i] !== this[i + 1]) {
						push1(unique, this[i]);
					}
				} else if (unique.indexOf(this[i]) < 0) {
					push1(unique, this[i]);
				}
			}

			return unique;
		},

		/**
		 * Returns a copy of the current array without any elements from the input parameters.
		 * 
		 * @example
		 * [1, 2, 3, 4].without(2, 4); // -> [1, 3]
		 * 
		 * @function Array#without
		 * @param {...*} *items - Items to leave out of the returned array.
		 * @returns {Array}
		 */
		without: function() {
			var array = new constructor(),
				i = 0,
				j;

			next: for (; i < this.length; i++) {
				for (j = 0; j < arguments.length; j++) {
					if (this[i] === arguments[j]) {
						continue next;
					}
				}
				push1(array, this[i]);
			}

			return array;
		}
	};
}

// Define the properties on Array.prototype
definePrototypeExtensionsOn(ArrayPrototype, extend(prototypeExtensions, getTypedArrayFunctions(Array)));

//#endregion Array


//#region =========================== Element ================================

/**
 * @class Element
 * @classdesc The HTML DOM Element interface.
 * @mixes Node
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/element|Element - Web API Interfaces | MDN}
 */

/**
 * Returns a list of the elements within the element with the specified class name.  
 * Alias of `Element.getElementsByClassName()`.
 * 
 * @function Element#CLS
 * @param {String} className
 * @returns {HTMLCollection|NodeList} A collection of elements with the specified class name.
 */
ElementPrototype.CLS = ElementPrototype.getElementsByClassName;

/**
 * Returns a list of the elements within the element with the specified tag name.  
 * Alias of `Element.getElementsByTagName()`.
 * 
 * @function Element#TAG
 * @param {String} tagName
 * @returns {HTMLCollection|NodeList} A collection of elements with the specified tag name.
 */
ElementPrototype.TAG = ElementPrototype.getElementsByTagName;

/**
 * Returns the first element within the element that matches the specified CSS selector.  
 * Alias of `Element.querySelector()`.
 * 
 * @function Element#QS
 * @param {String} selector
 * @returns {?Element}
 */
ElementPrototype.QS = ElementPrototype.querySelector;

/**
 * Returns a list of the elements within the element that match the specifed CSS selector.  
 * Alias of `Element.querySelectorAll()`.
 * 
 * @function Element#QSA
 * @param {String} selector
 * @returns {NodeList} A list of selected elements.
 */
ElementPrototype.QSA = ElementPrototype.querySelectorAll;

/**
 * Gets the value of the element's specified attribute.
 * 
 * @function Element#attr
 * @param {String} attribute - The name of the attribute who's value you want to get.
 * @returns {String} The value of the attribute.
 */
/**
 * Sets the element's specified attribute.
 * 
 * @function Element#attr
 * @param {String} attribute - The name of the attribute who's value should be set.
 * @param {String|Number} value - The value to set the specified attribute to.
 */
/**
 * Sets the specified attributes of the element.
 * 
 * @function Element#attr
 * @param {Object} attributes - An object of attribute-value pairs to set.
 */
ElementPrototype.attr = function(attrib, value) {
	if (value === _undefined) {
		if (typeofString(attrib)) {
			return this.getAttribute(attrib); //Get
		}

		//Reuse the value parameter since it is undefined
		for (value in attrib) {
			this.setAttribute(value, attrib[value]); //Set multiple
		}
	}
	else {
		this.setAttribute(attrib, value); //Set single
	}

	return this;
};

/**
 * @summary Gets the element's stored data object.
 * 
 * @description
 * HTML5 data-* attributes are pulled into the stored data object the first time the data property is accessed
 * and then are no longer accessed or mutated (they are stored in a private Firebolt property).
 * 
 * @function Element#data
 * @returns {Object} The element's stored data object.
 */
/**
 * @summary Get the value at the named data store for the element as set by `.data(key, value)` or by an HTML5 data-* attribute.
 * 
 * @description
 * The HTML5 data-* attributes are pulled into the stored data object the first time the data property is accessed
 * and then are no longer accessed or mutated (they are stored in a private Firebolt property).
 * 
 * @function Element#data
 * @param {String} key - The name of the stored data.
 * @returns {*} The value of the stored data.
 */
/**
 * @summary Stores arbitrary data associated with the element.
 * 
 * @description
 * When setting data properties (either input ones or those pulled from HTML5 data-* attributes), Firebolt will
 * camelize dashed key names. For example, when pulling a data-* attribute called `data-foo-bar`, Firebolt will
 * add the data to the element's stored data object with the key `fooBar`.
 * 
 * @function Element#data
 * @param {String} key - A string naming the data to set.
 * @param {*} value - Any arbitrary data to store.
 */
/**
 * @summary Stores arbitrary data associated with the element.
 * 
 * @description
 * When setting data properties (either input ones or those pulled from HTML5 data-* attributes), Firebolt will
 * camelize dashed key names. For example, when pulling a data-* attribute called `data-foo-bar`, Firebolt will
 * add the data to the element's stored data object with the key `fooBar`.
 * 
 * @function Element#data
 * @param {Object} obj - An object of key-value pairs to add to the element's stored data.
 */
ElementPrototype.data = function(key, value) {
	return Firebolt.data(this, key, value, 1); //Pass in 1 to tell the generic function the object is an element
};

/**
 * Gets the descendants of the element, filtered by a selector.
 * 
 * __Note:__ The main difference between when this function and `Element#querySelectorAll()` (or Firebolt's
 * short form `Element#QSA()`) is that in this function, the selector is evaluated with the current element
 * as the root of the selection (as opposed to the document). This can be seen in the example below.
 * 
 * @example <caption>Comparing Element#querySelectorAll() and Element#find()</caption>
 * /// HTML
 * // <div id="test">
 * //   <b>Hello</b>
 * // </div>
 * 
 * var testDiv = $$('test');
 * testDiv.querySelectorAll('div b'); // -> [<b>Hello</b>]
 * testDiv.find('div b'); // -> []
 * testDiv.find('b');     // -> [<b>Hello</b>]
 * 
 * @function Element#find
 * @param {String} selector - A CSS selector string.
 * @returns {NodeList}
 */
/**
 * Gets the descendants of the element, filtered by a collection of elements or a single element.
 * 
 * @function Element#find
 * @param {Element|Element[]} matcher - A collection of elements or a single element used to match
 * descendant elements against.
 * @returns {NodeCollection}
 */
ElementPrototype.find = function(selector) {
	if (typeofString(selector)) {
		// Perform a rooted QSA (staight out of Secrets of the JavaScript Ninja, page 348)
		var origID = this.id;
		try {
			return this.querySelectorAll(
				// Must make this check for when this function is used by NodeCollection#find()
				// because `this` may be a Document or DocumentFragment
				isNodeElement(this) ? '#' + (this.id = 'root' + (timestamp++)) + ' ' + selector
									: selector
			);
		}
		catch (e) {
			throw e;
		}
		finally {
			this.id = origID;
		}
	}

	// Return the intersection of all of the element's descendants with the elements in the
	// input collection or single element (in an array)
	return NodeCollectionPrototype.intersect.call(this.querySelectorAll('*'),
	                                              selector.nodeType ? [selector] : selector);
};

/**
 * Determines if the element matches the specified CSS selector.
 * 
 * @function Element#matches
 * @param {String} selector - A CSS selector string.
 * @returns {Boolean} `true` if the element matches the selector; else `false`.
 */
ElementPrototype.matches = ElementPrototype.matches || ElementPrototype.webkitMatchesSelector || ElementPrototype.mozMatchesSelector || ElementPrototype.msMatchesSelector || ElementPrototype.oMatchesSelector;

/**
 * Gets the value of the element's specified property.
 * 
 * @function Element#prop
 * @param {String} property - The name of the property who's value you want to get.
 * @returns {?} The value of the property being retrieved.
 */
/**
 * Sets the specified property of the element.
 * 
 * @function Element#prop
 * @param {String} property - The name of the property to be set.
 * @param {*} value - The value to set the property to.
 */
/**
 * Sets the specified properties of the element.
 * 
 * @function Element#prop
 * @param {Object} properties - An object of property-value pairs to set.
 */
ElementPrototype.prop = function(prop, value) {
	if (value === _undefined) {
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
 * @function Element#removeAttr
 * @param {String} attribute - The name of the attribute to remove.
 */
ElementPrototype.removeAttr = function(attribute) {
	this.removeAttribute(attribute);

	return this;
};

/**
 * Removes a previously stored piece of Firebolt data.  
 * When called without any arguments, all data is removed.
 * 
 * @function Element#removeData
 * @param {String} [name] - The name of the data to remove.
 */
/**
 * Removes previously stored Firebolt data.  
 * When called without any arguments, all data is removed.
 * 
 * @function Element#removeData
 * @param {Array|String} [list] - An array or space-separated string naming the pieces of data to remove.
 */
ElementPrototype.removeData = function(input) {
	Firebolt.removeData(this, input);

	return this;
};

/**
 * Removes the specified property from the element.
 * 
 * @function Element#removeProp
 * @param {String} propertyName - The name of the property to remove.
 */
ElementPrototype.removeProp = function(propertyName) {
	delete this[propertyName];

	return this;
};

//#endregion Element


//#region =========================== Firebolt ===============================

/**
 * The Firebolt namespace object and selector function. Can also be referenced by the synonyms `FB`
 * and `$` (if `$` has not already been defined).
 * @namespace Firebolt
 */

/**
 * @summary
 * Firebolt's multi-use selector function. Can also be referenced by the synonyms <code>FB</code> and
 * <code>$</code> (if <code>$</code> has not already been defined).
 * 
 * @description
 * Returns a list of the elements either found in the DOM that match the passed in CSS selector or created by passing an HTML string.
 * 
 * __Note #1:__ Unlike jQuery, only a document may be passed as the `context` variable. This is because there are several ways to
 * select elements with an element as the root for the selection. Check out the {@link Element} interface and look at functions
 * like {@linkcode Element#find|.find()}, {@linkcode Element#QSA|.QSA()}, {@linkcode Element#TAG|.TAG()}, etc.
 * 
 * __Note #2:__ This function will only consider the input string an HTML string if the first character of the
 * string is the opening tag character (`<`). If you want to parse an HTML string that does not begin with an
 * element, use {@linkcode Firebolt.parseHTML|$.parseHTML()});
 * 
 * __Note #3:__ Since Firebolt does not use Sizzle as a CSS selector engine, only standard CSS selectors may be used.
 * 
 * __ProTip:__ When creating a single element, it's a better idea to use the {@linkcode Firebolt.elem|$.elem()} function since
 * it maps directly to the native `document.createElement()` function (making it much faster) and gives you the option to pass
 * in an object of attributes to be set on the newly created element.
 * 
 * @example
 * Firebolt('div, span');   // Returns a NodeList of all div and span elements
 * $('button.btn-success'); // Returns a NodeList of all button elements with the class "btn-success"
 * $('<p>content</p><br>'); // Creates a set of nodes and returns it as a NodeCollection (in this case [<p>content</p>, <br>])
 * $.elem('div');           // Calls Firebolt's method to create a new div element 
 * 
 * @global
 * @variation 2
 * @function Firebolt
 * @param {String} string - A CSS selector string or an HTML string.
 * @param {ParentNode} [context=document] - A node to serve as the context when selecting or creating elements.
 * Only a DOM Document may be used as the `context` argument when creating elements.
 * @returns {NodeCollection} A NodeCollection of selected elements or newly created elements.
 * @throws {SyntaxError} When the passed in string is not an HTML string (does not start with the "<" character) and is an invalid CSS selector.
 */
function Firebolt(selector, context) {
	var firstChar = selector[0];

	if (context) {
		return firstChar === '<' ? parseHTML(selector, context, 1) : ncFrom(context.querySelectorAll(selector));
	}

	if (firstChar === '.') { // Check for a single class name
		if (!rgxNotClass.test(selector)) {
			return ncFrom(getElementsByClassName(selector.slice(1).replace(rgxAllDots, ' ')));
		}
	}
	else if (firstChar === '#') { // Check for a single ID
		if (!rgxNotId.test(selector)) {
			context = new NodeCollection(); // Use the unused context argument to be the NodeCollection
			if (selector = getElementById(selector.slice(1))) { // Reuse the selector argument to be the retrieved element
				context[0] = selector;
			}
			return context;
		}
	}
	else if (firstChar === '<') { // Check if the string is an HTML string
		return parseHTML(selector, document, 1); // Pass in 1 to tell the function to detach the nodes from their creation container
	}
	else if (!rgxNotTag.test(selector)) { // Check for a single tag name
		return ncFrom(getElementsByTagName(selector));
	}
	//else
	return ncFrom(querySelectorAll(selector));
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
 * 
 * @function Firebolt.ajax
 * @param {String} url - A string containing the URL to which the request will be sent.
 * @param {Object} [settings] - A set of key/value pairs that configure the Ajax request. All settings are optional.
 * @returns {XMLHttpRequest} The XMLHttpRequest object this request is using (only for requests where the dataType is not "script".
 */
/**
 * @summary Perform an asynchronous HTTP (Ajax) request.
 * 
 * @description
 * This is a simplified version of jQuery's {@link http://api.jquery.com/jQuery.ajax/ | jQuery.ajax()} function.  
 * Firebolt's basic AJAX requests differ from jQuery's in the following ways:
 * 
 * 1. Instead of passing a "jqXHR" to callbacks, the native XMLHttpRequest object is passed.
 * 2. The `data` setting may be a string or a plain object or array to serialize and is appended to the URL as a string for
 *    HEAD requests as well as GET requests.
 * 3. The `processData` setting has been left out because Firebolt will automatically process only plain objects and arrays
 *    (so you wouldn't need to set it to `false` to send another type of data&emsp;such as a `FormData` object).
 * 4. The `success`, `error`, and `complete` settings can only be set to a function, not an array of functions.
 * 5. JSONP is not supported.
 * 6. In addition to the above, the following settings are not supported:
 *    + accepts
 *    + contents
 *    + context
 *    + converters
 *    + dataFilter
 *    + global
 *    + ifModified
 *    + jsonp
 *    + jsonpCallback
 *    + statusCode
 *    + xhr
 * 
 * To get the (almost) full set of AJAX features that jQuery provides, use the Firebolt AJAX extension.
 * 
 * @function Firebolt.ajax
 * @param {Object} [settings] - A set of key/value pairs that configure the Ajax request. All settings are optional.
 * @returns {XMLHttpRequest} The XMLHttpRequest object this request is using.
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
	var xhr = extend(new XMLHttpRequest(), settings.xhrFields),
		async = settings.async,
		beforeSend = settings.beforeSend,
		complete = settings.complete || returnFalse,
		contentType = settings.contentType,
		crossDomain = settings.crossDomain || url.contains('//') && url.indexOf(document.domain) < 0,
		dataType = settings.dataType,
		error = settings.error || returnFalse,
		headers = settings.headers || {}, //For true XHRs only
		lastState = 0, //For true XHRs only
		success = settings.success || returnFalse,
		timeout = settings.timeout,
		type = settings.type.toUpperCase(),
		isGetOrHead = type == 'GET' || type == 'HEAD',
		data = settings.data,
		statusCode, //For true XHRs only
		textStatus;

	if (data) {
		//Process data if necessary
		if (isArray(data) || isPlainObject(data)) {
			data = Firebolt.param(data, settings.traditional);
		}

		//If the request is a GET or HEAD, append the data string to the URL
		if (isGetOrHead) {
			url = url.appendParams(data);
			data = _undefined; //Clear the data so it is not sent later on
		}
	}

	if (dataType == 'script' && (crossDomain || settings.isLocal)) { //Set up an HTML script loader
		//Prevent caching unless the user explicitly set cache to true
		if (settings.cache !== true) {
			url = url.appendParams('_=' + (timestamp++));
		}

		var script = createElement('script').prop({
			charset: settings.scriptCharset || '',
			src: url,
			onload: function() {
				if (timeout) {
					clearTimeout(timeout);
				}
				script.remove();
				success(data, textStatus = 'success', xhr);
				complete(xhr, textStatus);
			},
			onerror: function(ex) {
				if (timeout) {
					clearTimeout(timeout);
				}
				script.remove();
				error(xhr, textStatus = 'error', ex.type);
				complete(xhr, textStatus);
			}
		});

		if (script.async === _undefined) {
			script.defer = async;
		}
		else {
			script.async = async;
		}

		if (beforeSend && beforeSend(xhr, settings) === false) {
			//If the beforeSend function returned false, do not send the request
			return false;
		}

		//Set a timeout if there is one
		if (timeout) {
			timeout = setTimeout(function() {
				script.remove();
				error(xhr, textStatus = 'timeout', '');
				complete(xhr, textStatus);
			}, timeout);
		}

		//Append the script to the head of the document to load it
		documentHead.appendChild(script);
	}
	else { //Set up a true XHR
		//Override the requested MIME type in the XHR if there is one specified in the settings
		if (settings.mimeType) {
			xhr.overrideMimeType(settings.mimeType);
		}

		//Prevent caching if necessary
		if (isGetOrHead && settings.cache === false) {
			url = url.appendParams('_=' + (timestamp++));
		}

		//Set the content type header if there is data to submit or the user has specifed a particular content type
		if (data || contentType) {
			headers['Content-Type'] = contentType || 'application/x-www-form-urlencoded; charset=UTF-8';
		}

		//The main XHR function for when the request has loaded (and track states in between for abort or timeout)
		xhr.onreadystatechange = function() {
			if ((lastState = xhr.readyState) < 4) {
				return;
			}

			if (timeout) {
				clearTimeout(timeout);
			}

			statusCode = xhr.status;

			if (statusCode >= 200 && statusCode < 300 || statusCode === 304 || settings.isLocal && xhr.responseText) { //Success
				if (statusCode === 204 || type == 'HEAD') { //If no content
					textStatus = 'nocontent';
				}
				else {
					textStatus = 'success';
				}

				try {
					//Only need to process data of there is content
					if (textStatus != 'nocontent') {
						//If the data type has not been set, try to figure it out
						if (!dataType) {
							if ( dataType = rgxDataType.exec(xhr.getResponseHeader('Content-Type')) ) {
								dataType = dataType[0];
							}
						}

						//Set data based on the data type
						if (dataType == 'xml') {
							data = xhr.responseXML;
						}
						else if (dataType == 'json') {
							data = JSON.parse(xhr.responseText);
						}
						else {
							data = xhr.responseText;

							if (dataType == 'script') {
								Firebolt.globalEval(data);
							}
						}
					}
					else {
						data = '';
					}

					//Invoke the success callback
					success(data, textStatus, xhr);
				}
				catch (e) {
					error(xhr, textStatus = 'parsererror', getAjaxErrorStatus(xhr));
				}
			}
			else { //Error
				if (textStatus != 'timeout') {
					textStatus = lastState < 3 ? 'abort' : 'error';
				}
				error(xhr, textStatus, getAjaxErrorStatus(xhr));
			}

			//Invoke the complete callback
			complete(xhr, textStatus);
		};

		//Open the request
		xhr.open(type, url, async, settings.username, settings.password);

		//Set the request headers in the XHR
		for (type in headers) { //Reuse the `type` variable since it has already served its purpose in opening the XHR
			xhr.setRequestHeader(type, headers[type]);
		}

		if (beforeSend && beforeSend(xhr, settings) === false) {
			//If the beforeSend function returned false, do not send the request
			return false;
		}

		//Set a timeout if there is one
		if (timeout) {
			timeout = setTimeout(function() {
				textStatus = 'timeout';
				xhr.abort();
			}, timeout);
		}

		//Send the XHR
		xhr.send(data);
	}

	return xhr;
};

/**
 * Sets default values for future Ajax requests. Use of this function is not recommended.
 * 
 * @param {Object} options - A set of key/value pairs that configure the default Ajax settings. All options are optional.
 * @memberOf Firebolt
 */
Firebolt.ajaxSetup = function(options) {
	return extendDeep(ajaxSettings, options);
};

/**
 * Gets the object's stored data object.
 * 
 * __Regarding HTML5 data-* attributes:__ This method does NOT retrieve the data-* attributes unless the
 * {@linkcode Element#data|.data()} method has already retrieved them.
 * 
 * @function Firebolt.data
 * @param {Object} object - An object. This can be anything that has Object in its prototype chain.
 * @returns {Object} The object's stored data object.
 */
/**
 * Get the value at the named data store for the object as set by {@linkcode Firebolt.data|Firebolt.data(key, value)}.
 * 
 * __Regarding HTML5 data-* attributes:__ This method does NOT retrieve the data-* attributes unless the
 * {@linkcode Element#data|.data()} method has already retrieved them.
 * 
 * @function Firebolt.data
 * @param {Object} object - An object. This can be anything that has Object in its prototype chain.
 * @param {String} key - The name of the stored data.
 * @returns {*} The value of the stored data.
 */
/**
 * Stores arbitrary data associated with the object.
 * 
 * __Note:__ When setting data properties, Firebolt will camelize dashed key names. For example, when setting data with the
 * key `foo-bar`, Firebolt will add the data to the element's stored data object with the key `fooBar`.
 * 
 * @function Firebolt.data
 * @param {Object} object - An object. This can be anything that has Object in its prototype chain.
 * @param {String} key - A string naming the data to set.
 * @param {*} value - Any arbitrary data to store.
 * @returns {Object} The passed in object.
 */
/**
 * Stores arbitrary data associated with the object.
 * 
 * __Note:__ When setting data properties, Firebolt will camelize dashed key names. For example, when setting data with the
 * key `foo-bar`, Firebolt will add the data to the element's stored data object with the key `fooBar`.
 * 
 * @function Firebolt.data
 * @param {Object} object - An object. This can be anything that has Object in its prototype chain.
 * @param {Object} data - An object of key-value pairs to add to the object's stored data.
 * @returns {Object} The passed in object.
 */
Firebolt.data = function(object, key, value, isElement) {
	var expando = Firebolt.expando,
		dataStore = object[expando];

	if (!dataStore) {
		// Define the data store object at a non-enumerable property
		defineProperty(object, expando, {
			value: dataStore = {}
		});

		//If the object is an Element, try loading "data-*" attributes
		if (isElement) {
			var attributes = object.attributes,
				dataAttributes = {},
				i = 0,
				attrib,
				val;

			for (; i < attributes.length; i++) {
				attrib = attributes[i];
				if (attrib.name.startsWith('data-')) {
					if (!rgxNoParse.test(val = attrib.value)) {
						//Try to parse the value
						try {
							val = JSON.parse(val);
						}
						catch (e) { }
					}
					// Set the value in the data attributes object and data store
					attrib = camelize(attrib.name.slice(5));
					dataStore[attrib] = dataAttributes[attrib] = val;
				}
			}

			//Save the data attributes if there are any
			if (!isEmptyObject(dataAttributes)) {
				object._$DA_ = dataAttributes;
			}
		}
	}

	if (value === _undefined) {
		if (typeofObject(key)) {
			extend(dataStore, key); //Set multiple
		}
		else {
			if (key === _undefined) {
				return dataStore; // Get the data store object
			}

			// Else get the data at the specified name
			return (value = dataStore[key = camelize(key)]) === _undefined && object._$DA_
				? dataStore[key] = object._$DA_[key] // Save the data-* attribute value to the data store and return it
				: value;
		}
	}
	else {
		dataStore[camelize(key)] = value; // Set value
	}

	return object;
};

/*
 * Maps easing types to CSS transition functions.
 * The easing extension can be used to fill this out more.
 */
Firebolt.easing = {
	swing: 'cubic-bezier(.36,0,.64,1)' //Essentially the same as jQuery (curve is identical in WolframAlpha)
};

/**
 * Creates a new element with the specified tag name and attributes (optional).  
 * Partially an alias of `document.createElement()`.
 * 
 * @function Firebolt.elem
 * @param {String} tagName
 * @param {Object} [attributes] - The JSON-formatted attributes that the element should have once constructed.
 * @returns {Element}
 */
Firebolt.elem = createElement;
function createElement(tagName, attributes) {
	var el = document.createElement(tagName);
	return attributes ? el.attr(attributes) : el;
}

/* The key where Firebolt stores data using $.data() */
Firebolt.expando = 'FB' + Date.now() + 1 / Math.random();

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
 * @param {...Object} object - One or more objects whose properties will be merged into the target object.
 * @returns {Object} The target object.
 */
Firebolt.extend = extend;
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
				if (arg[key] !== _undefined) {
					target[key] = arg[key];
				}
			}
		}

		return target;
	}

	//Extend the Firebolt objects
	extend(NodeCollectionPrototype, target);
	extend(NodeListPrototype, target);
	extend(HTMLCollectionPrototype, target);
}

function extendDeep(target) {
	var i = 1,
		arg,
		key,
		val,
		curval;

	// Extend the target object, extending recursively if the new value is a plain object or array
	for (; i < arguments.length; i++) {
		arg = arguments[i];

		for (key in arg) {
			curval = target[key];
			val = arg[key];

			// If the values are not already the same and the new value is not the
			// target (prevents endless recursion), set the new value on the target
			if (curval !== val && val !== target) {
				target[key] = isArray(val) ? extendDeep(isArray(curval) ? curval : [], val)     // Deep-extend arrays
					: isPlainObject(val) ? extendDeep(isPlainObject(curval) ? curval : {}, val) // Deep-extend plain objects
					: val; // Else just copy the value into the target
			}
		}
	}

	return target;
}

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
 * @param {Function} [success(data, textStatus, xhr)] - A callback function that is executed if the request succeeds.
 * Required if dataType is provided, but can be `null` in that case.
 * @param {String} [dataType] - The type of data expected from the server. Default: Intelligent Guess (xml, json, script, or html).
 * @memberOf Firebolt
 */
Firebolt.get = function(url, data, success, dataType) {
	//Organize arguments into their proper places
	if (typeof data == 'function') {
		dataType = dataType || success; //Using || because when getJSON is called dataType will have a value
		success = data;
		data = '';
	}
	else if (typeofString(success)) {
		dataType = success;
		success = 0;
	}

	return Firebolt.ajax({
		url: url,
		data: data,
		success: success,
		dataType: dataType
	});
};

/**
 * Load JSON-encoded data from the server using a HTTP GET request.
 * 
 * @param {String} url - A string containing the URL to which the request will be sent.
 * @param {String|Object} [data] - A string or object that is sent to the server with the request as a query string.
 * @param {Function} [success(data, textStatus, xhr)] - A callback function that is executed if the request succeeds.
 * @memberOf Firebolt
 */
Firebolt.getJSON = function(url, data, success) {
	return Firebolt.get(url, data, success, 'json');
};

/**
 * Load a JavaScript file from the server using a HTTP GET request, then execute it.
 * 
 * @param {String} url - A string containing the URL to which the request will be sent.
 * @param {Function} [success(data, textStatus, xhr)] - A callback function that is executed if the request succeeds.
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
	documentHead.appendChild(
		createElement('script').prop('text', code)
	).remove();
};

/**
 * Determines if the object has any Firebolt data associated with it.
 * 
 * @param {Object} object - An object. This can be anything that has Object in its prototype chain.
 * @returns {Boolean} `true` if the object has stored Firebolt data; else `false`.
 * @memberOf Firebolt
 */
Firebolt.hasData = function(object) {
	return !isEmptyObject(object[Firebolt.expando]);
};

/**
 * Determines if the passed in value is considered empty. The value is considered empty if it is one of the following:
 * 
 * + `null`
 * + `undefined`
 * + a zero-length string, array, NodeCollection, NodeList, or HTMLCollection
 * + an empty object (if the value has the "Object" class and {@linkcode Firebolt.isEmptyObject} returns `true`)
 * 
 * @function Firebolt.isEmpty
 * @param {*} value - The value to be tested.
 * @returns {Boolean} - `true` if the object is deemed empty, `false` otherwise.
 */
Firebolt.isEmpty = function(value, className) {
	return value == _undefined ||
		(isArray(value) || typeofString(value) || ((className = getClassOf(value)) == 'NodeList' || className == 'HTMLCollection')
			? !value.length
			: className == 'Object' && isEmptyObject(value));
};

/**
 * Determines if an object is empty (contains no enumerable properties).
 * 
 * @function Firebolt.isEmptyObject
 * @param {Object} object - The object to be tested.
 * @returns {Boolean}
 */
Firebolt.isEmptyObject = isEmptyObject;
function isEmptyObject(object) {
	for (object in object) {
		return false;
	}
	return true;
}

/**
 * Determines if a variable is a plain object.
 * 
 * @function Firebolt.isPlainObject
 * @param {*} obj - The item to test.
 */
Firebolt.isPlainObject = isPlainObject;
function isPlainObject(obj) {
	return obj && (obj = obj.constructor) && obj.toString().trim().slice(9, 16) == 'Object(';
}

/**
 * Indicates if the user is on a touchscreen device.
 * 
 * @property {Boolean} isTouchDevice - `true` if the user is on a touchscreen device; else `false`.
 * @memberOf Firebolt
 */
Firebolt.isTouchDevice = 'ontouchstart' in window || 'onmsgesturechange' in window;

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
	return serialize(obj, 0, traditional);
};

function serialize(obj, prefix, traditional) {
	var queryString = '',
		valueIsObject,
		key,
		value,
		cur;

	for (key in obj) {
		value = obj[key];
		if (typeof value == 'function') {
			value = value();
		}
		if (value == _undefined) {
			value = '';
		}

		if (traditional) {
			//Add the key
			queryString += (queryString ? '&' : '') + encodeURIComponent(key);

			//Add the value
			if (isArray(value)) {
				for (cur = 0; cur < value.length; cur++) {
					//Add key again for multiple array values
					queryString += (cur ? '&' + encodeURIComponent(key) : '') + '=' + encodeURIComponent(value[cur] == _undefined ? '' : value[cur]);
				}
			}
			else {
				queryString += '=' + encodeURIComponent(value);
			}
		}
		else if (!(valueIsObject = isArray(value) || getClassOf(value) == 'Object') || !isEmptyObject(value)) {
			/* Inspired by: http://stackoverflow.com/questions/1714786/querystring-encoding-of-a-javascript-object */
			cur = prefix ? prefix + '[' + key + ']' : key;
			queryString += (queryString ? '&' : '') + (valueIsObject ? serialize(value, cur)
																	 : encodeURIComponent(cur) + '=' + encodeURIComponent(value));
		}
	}

	return queryString;
}

/**
 * Parses a string into an array of DOM nodes.
 * 
 * __Note:__ `<script>` elements created with this function will not have their code executed.
 * If you desire this functionality, create a `<script>` with {@linkcode Firebolt.elem}, set
 * its `textContent` property to the script string you want to execute, then add the element
 * to the `document`.
 * 
 * @function Firebolt.parseHTML
 * @param {String} html - HTML string to be parsed.
 * @param {Document} [context=document] - A DOM Document to serve as the context in which the nodes will be created.
 * @returns {NodeCollection} The collection of created nodes.
 */
Firebolt.parseHTML = parseHTML;
function parseHTML(html, context, detachNodes, single) {
	var elem;
	context = context || document;

	// If the HTML is just a single element without attributes, using document.createElement is much faster
	if (rgxSingleTag.test(html)) {
		// Create a new element from the HTML tag, retrieved by stripping "<" from the front and "/>" or ">" from the back
		elem = context.createElement(
			html.slice(1, html.length - (html[html.length - 2] === '/' ? 2 : 1))
		);
		return single ? elem : (html = new NodeCollection())[0] = elem, html;
	}

	// Parse the HTML, taking care to handle special elements
	elem = context.createElement('body');
	context = rgxFirstTag.exec(html);
	if (context && (context = specialElementsMap[context[0]])) {
		elem.innerHTML = context[1] + html + context[2];
		context = context[0];
		while (context--) {
			elem = elem.firstChild;
		}
	}
	else {
		elem.innerHTML = html;
	}

	if (single) {
		// When returning a single element, it should always be removed from its creation parent
		return elem.removeChild(elem.firstChild);
	}

	html = elem.childNodes;

	return detachNodes ? ncFrom(html).remove() : html;
}

/**
 * Load data from the server using a HTTP POST request.
 * 
 * @param {String} url - A string containing the URL to which the request will be sent.
 * @param {String|Object} [data] - A string or object that is sent to the server with the request.
 * @param {Function} [success(data, textStatus, xhr)] - A callback function that is executed if the request succeeds.
 * Required if dataType is provided, but can be `null` in that case.
 * @param {String} [dataType] - The type of data expected from the server. Default: Intelligent Guess (xml, json, script, or html).
 * @memberOf Firebolt
 */
Firebolt.post = function(url, data, success, dataType) {
	//Organize arguments into their proper places
	if (typeof data == 'function') {
		dataType = success;
		success = data;
		data = '';
	}
	else if (typeofString(success)) {
		dataType = success;
		success = 0;
	}

	return Firebolt.ajax({
		type: 'POST',
		url: url,
		data: data,
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
 */
/**
 * Removes previously stored Firebolt data from an object.  
 * When called without any arguments, all data is removed.
 * 
 * @function Firebolt.removeData
 * @param {Object} object - An object. This can be anything that has Object in its prototype chain.
 * @param {Array|String} [list] - An array or space-separated string naming the pieces of data to remove.
 */
Firebolt.removeData = function(object, list) {
	var dataStore = object[Firebolt.expando],
		i = 0;

	// First make sure the data store object exists
	if (dataStore) {
		if (typeofString(list)) {
			list = list.split(' ');
		}
		else if (!list) {
			list = keys(dataStore); // Select all items for removal
		}

		for (; i < list.length; i++) {
			delete dataStore[camelize(list[i])];
		}
	}
};

/**
 * Creates a TextNode from the provided string.
 * 
 * @memberOf Firebolt
 * @param {String} text - The string used to construct the TextNode.
 * @returns {TextNode}
 */
Firebolt.text = function(text) {
	return document.createTextNode(text === _undefined ? '' : text);
};

//#endregion Firebolt


//#region =========================== Function ===============================

/**
 * @class Function
 * @classdesc The JavaScript Function object.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function | Function - JavaScript | MDN}
 */

/**
 * Delays a function call for the specified number of milliseconds.
 * 
 * @example <caption>Call a function at a later time:</caption>
 * window.alert.delay(2000, ['alert!']); // Waits 2 seconds, then opens an alert that says "alert!"
 * 
 * @example <caption>Set a timeout for a function but cancel it before it can be called:</caption>
 * var callbackObject = window.alert.delay(2000, ['alert!']); // Sets the alert to be called in 2 seconds and saves a reference to the returned object
 * callbackObject.callback === window.alert; // -> true (just to show what this variable in the callback object is set to)
 * 
 * //----- Before 2 seconds ellapses -----
 * callbackObject.cancel(); // Prevents the alert function from being called
 * 
 * @function Function#delay
 * @param {Number} delay - The number of milliseconds to wait before calling the functions.
 * @param {Array} [args] - An array containing the arguments the function will be called with.
 * @param {Object} [thisArg=returned callback object] - An object you want `this` to refer to inside the function.
 * Defaults to the object returned by this function. If `thisArg` is an Array, `args` must be present (but may be `null`).
 * @returns {Object} An object with the following properties:
 * + `callback` - The function this method was called upon.
 * + `hasExecuted` - A Boolean, initialized to `false`, that is set to `true` when the delayed function executes.
 * + `execute` - A function that, when called, will execute the function immediately and cancel the timeout so it is not called again by the browser.
 * To prevent the timeout from being cancelled, call this function with the parameter `false`.
 * + `cancel` - A function that, when called, will cancel the timeout to prevent the function from being executed (if it hasn't been already).
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Window.setTimeout | window.setTimeout - Web API Interfaces | MDN}
 */

/**
 * Executes the function repeatedly, with a fixed time delay between each call to the function.
 * 
 * @example <caption>Set a function to repeat every 2 seconds and later stop it from continuing:</caption>
 * function logStuff() {
 *     console.log('stuff');
 * }
 * 
 * var callbackObject = logStuff.every(2000); // Waits 2 seconds, then logs "stuff" to the console and continues to do so every 2 seconds
 * callbackObject.callback === logstuff;      // -> true (just to show what this variable in the callback object is set to)
 * 
 * //----- Later -----
 * callbackObject.clear();  // Stops the logging calls
 * 
 * @function Function#every
 * @param {Number} delay - The number of milliseconds to wait between function calls.
 * @param {Array} [args] - An array containing the arguments the function will be called with.
 * @param {Object} [thisArg=returned callback object] - An object you want `this` to refer to inside the function.
 * Defaults to the object returned by this function. If `thisArg` is an Array, `args` must be present (but may be `null`).
 * @returns {Object} An object with the following properties:
 * + `callback` - The function this method was called upon.
 * + `hasExecuted` - A Boolean, inialized to `false`, that is set to `true` each time the function executes.
 * + `execute` - A function that, when called, will execute the function immediately and cancel the interval so the function will stop being called.
 * To prevent the interval from being cancelled, call this function with the parameter `false`.
 * + `cancel` - A function that, when called, will cancel the interval so the function will stop being called.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Window.setInterval | window.setInterval - Web API Interfaces | MDN}
 */

/*
 * Returns a convenience function for setting and clearing timeouts and intervals.
 */
function getTimingFunction(setTiming, clearTiming) {
	return function(delay, args, thisArg) {
		var
			fn = this,

			callback = function() {
				fn.apply(thisArg, args);
				callbackObject.hasExecuted = true;
			},

			clearRef = setTiming(callback, delay),

			callbackObject = {
				callback: fn,
				hasExecuted: false,
				execute: function(cancel) {
					if (cancel !== false) {
						clearTiming(clearRef);
					}
					callback();
				},
				cancel: function() {
					clearTiming(clearRef);
				}
			};

		thisArg = thisArg || !isArray(args) && args || callbackObject;

		return callbackObject;
	};
}

// Define the delay and every functions on the Function prototype
definePrototypeExtensionsOn(Function[prototype], {
	delay: getTimingFunction(setTimeout, clearTimeout),
	every: getTimingFunction(setInterval, clearInterval)
});

//#endregion Function


//#region =========================== Globals ================================

/*
 * Global Firebolt references.
 */
window.FB = window.Firebolt = Firebolt;
if (window.$ === _undefined) {
	window.$ = Firebolt;
}

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
 * Returns the first element within the document with the specified ID. Can also be called by the alias `$ID()`.  
 * Alias of `document.getElementById()`.
 * 
 * @global
 * @function $$
 * @param {String} id - A case-sensitive string representing the unique ID of the element being sought.
 * @returns {?Element} The element with the specified ID or `null` if there is no such element in the document.
 */

/**
 * Returns the first element within the document that matches the specified CSS selector or the element created from the input HTML string.  
 * Basically the same thing as `$()`, but only dealing with a single element.
 * 
 * @example
 * $1('button.btn-success'); // Returns the first <button> element with the class "btn-success"
 * $1('<p>content</p>');     // Creates a new <p> element containing the string "content".
 * 
 * @global
 * @param {String} string - A CSS selector string or an HTML string.
 * @param {ParentNode} [context=document] - A node to serve as the context when selecting or creating elements.
 * Only a DOM Document may be used as the `context` argument when creating elements.
 * @returns {?Element} - The selected element (or `null` if no element matched the selector) or the created element.
 * @throws {SyntaxError} When the passed in string is not an HTML string (does not start with the "<" character) and is an invalid CSS selector.
 */
window.$1 = function(selector, context) {
	var firstChar = selector[0];

	if (context) {
		return firstChar === '<' ? parseHTML(selector, context, 1, 1) : context.querySelector(selector);
	}

	if (firstChar === '.') { // Check for a single class name
		if (!rgxNotClass.test(selector)) {
			return getElementsByClassName(selector.slice(1).replace(rgxAllDots, ' '))[0];
		}
	}
	else if (firstChar === '#') { // Check for a single id
		if (!rgxNotId.test(selector)) {
			return getElementById(selector.slice(1));
		}
	}
	else if (firstChar === '<') { // Check if the string is an HTML string
		return parseHTML(selector, document, 1, 1); // Pass in the second 1 to tell the function to return only one node
	}
	else if (!rgxNotTag.test(selector)) { // Check for a single tag name
		return getElementsByTagName(selector)[0];
	}
	//else
	return querySelector(selector);
};

/**
 * Returns a list of the elements within the document with the specified class name.  
 * Alias of `document.getElementsByClassName()`.
 * 
 * @global
 * @function $CLS
 * @param {String} className
 * @returns {HTMLCollection} A set of elements with the specified class name.
 */

/**
 * Returns the first element within the document with the specified ID. Can also be called by the alias `$$()`.  
 * Alias of `document.getElementById()`.
 * 
 * @global
 * @function $ID
 * @param {String} id - A case-sensitive string representing the unique ID of the element being sought.
 * @returns {?Element} The element with the specified ID or `null` if there is no such element in the document.
 */

/**
 * Returns a set of the elements within the document with the specified name attribute.  
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
 * Returns the first element within the document that matches the specified CSS selector.  
 * Alias of `document.querySelector()`.
 * 
 * @global
 * @function $QS
 * @param {String} selector
 * @returns {?Element}
 */

/**
 * Returns all elements within the document that match the specified CSS selector.  
 * Alias of `document.querySelectorAll()`.
 * 
 * @global
 * @function $QSA
 * @param {String} selector
 * @returns {NodeList}
 */

/**
 * Returns a set of the elements within the document with the specified tag name.  
 * Alias of `document.getElementsByTagName()`.
 * 
 * @global
 * @function $TAG
 * @param {String} tagName
 * @returns {HTMLCollection} A collection of elements with the specified tag name.
 */

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
 * __Note:__ Unlike jQuery, the format of the space-separated classes required by Firebolt is strict. Each class must name
 * be separated by only a single space character and there cannot be whitespace at the beginning or end of the string.
 * ```javascript
 * element.addClass('one  two').removeClass('three ');  // Bad syntax
 * element.addClass('one two').removeClass('three');    // Correct syntax
 * ```
 * 
 * @function HTMLElement#addClass
 * @param {String} className - One or more classes separated by a single space to be added to the element's class attribute.
 * @throws {TypeError} The input `value` must be string. __Note:__ This error will not be thrown if `value` is not a string and
 * the element does not have a className value at the time of invocation.
 */
HTMLElementPrototype.addClass = function(value) {
	if (value) {
		//Only need to determine which classes should be added if this element's className has a value
		if (this.className) {
			var newClasses = value.split(' '),
				i = 0;

			value = this.className; //Reuse the value argument to build the new class name

			for (; i < newClasses.length; i++) {
				if (!this.hasClass(newClasses[i])) {
					value += ' ' + newClasses[i];
				}
			}
		}

		//Set the new value
		this.className = value;
	}

	return this;
};

/*
 * More performant version of Node#afterPut for HTMLElements.
 * @see Node#afterPut
 */
HTMLElementPrototype.afterPut = getHTMLElementAfterPutOrPrependWith('afterend', insertAfter);

/**
 * @summary Performs a custom animation of a set of CSS properties.
 * 
 * @description
 * Just like HTMLElement#css, CSS properties must be specified the same way they would be in a style sheet since Firebolt
 * does not append "px" to input numeric values (i.e. 1 != 1px).
 * 
 * Unlike jQuery, an object that specifies different easing types for different properties is not supported.
 * (Should it be supported? [Tell me why](https://github.com/woollybogger/Firebolt/issues).)
 * However, relative properties (indicated with `+=` or `-=`) and the `toggle` indicator are supported.
 * 
 * Also, Firebolt allows `"auto"` to be a viable target value for CSS properties where that is a valid value.
 * 
 * For more `easing` options, use Firebolt's [easing extension](https://github.com/woollybogger/firebolt-extensions/tree/master/easing)
 * (or just grab some functions from it and use them as the `easing` parameter).
 * 
 * __Note:__ In IE 9, the easing for all animations will be linear.
 * 
 * @function HTMLElement#animate
 * @param {Object} properties - An object of CSS properties and values that the animation will move toward.
 * @param {Number} [duration=400] - A number of milliseconds that specifies how long the animation will run.
 * @param {String} [easing="swing"] - A string indicating which easing function to use for the transition. The string can be any
 * [CSS transition timing function](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function) or "swing".
 * @param {Function} [complete()] - A function to call once the animation is complete. Inside the function, `this` will
 * refer to the element that was animated.
 * @see {@link http://api.jquery.com/animate/ | .animate() | jQuery API Documentation}
 */
HTMLElementPrototype.animate = function(properties, duration, easing, complete) {
	/* jshint expr:true */

	// Massage arguments into their proper places
	if (duration === _undefined || typeof duration == 'function') {
		complete = duration;
		duration = ANIMATION_DEFAULT_DURATION;
		easing = ANIMATION_DEFAULT_EASING;
	}
	else if (typeofString(duration)) {
		complete = easing;
		easing = duration;
		duration = ANIMATION_DEFAULT_DURATION;
	}
	else if (!typeofString(easing)) {
		complete = easing;
		easing = ANIMATION_DEFAULT_EASING;
	}

	var _this = this,
		i = 0,
		propertyNames = keys(properties),
		numProperties = propertyNames.length,
		numChangingProps = numProperties,
		inlineStyle = _this.style,
		currentStyle = getComputedStyle(_this),
		isCurrentDisplayNone = isDisplayNone(0, currentStyle),
		valsToRestore = {},
		cssIncrementProps,
		framesLeft,
		hideOnComplete,
		sanitaryProp,
		prop,
		val,
		temp;

	// Only perform the animation if there are properties to animate
	if (numProperties) {
		// The original transition style should be restored after the animation completes
		valsToRestore[cssTransitionKey] = inlineStyle[cssTransitionKey];

		// Force the transition style to be 'none' in case the element already has a transition style
		inlineStyle[cssTransitionKey] = 'none';

		if (noCssTransitionSupport) {
			framesLeft = parseInt(duration / 25); // Total animation frames = duration / frame period
			cssIncrementProps = {};
		}

		//Parse properties
		for (; i < numProperties; i++) {
			sanitaryProp = sanitizeCssPropName(prop = propertyNames[i]);
			val = properties[prop];

			//Should set overflow to "hidden" when animating height or width properties
			if ((prop == 'height' || prop == 'width') && valsToRestore.overflow === _undefined) {
				valsToRestore.overflow = inlineStyle.overflow;
				inlineStyle.overflow = 'hidden';
			}

			if (val == TOGGLE) {
				if (isCurrentDisplayNone) {
					if (isDisplayNone(0, currentStyle)) {
						_this.show();
					}
					val = currentStyle[sanitaryProp];
					valsToRestore[sanitaryProp] = inlineStyle[sanitaryProp];
					inlineStyle[sanitaryProp] = 0;
				}
				else {
					val = 0;
					valsToRestore[sanitaryProp] = inlineStyle[sanitaryProp];
					hideOnComplete = 1;
				}
			}
			else if (val == 'auto') {
				valsToRestore[sanitaryProp] = val; // Save value to be set on the element at the end of the transition
				temp = inlineStyle[sanitaryProp];  // Save the current inline value of the property
				inlineStyle[sanitaryProp] = val;   // Set the style to the input value ('auto')
				val = _this.css(sanitaryProp);     // Get the computed style that will be used as the target value (use .css in case the element is hidden)
				inlineStyle[sanitaryProp] = temp;  // Restore the current inline value of the property
			}
			else if (val[1] === '=') { // "+=value" or "-=value"
				val = cssMath(parseFloat(currentStyle[sanitaryProp]), parseFloat(val.replace('=', '')), val.replace(rgxUpToUnits, ''), _this, sanitaryProp);
			}

			properties[prop] = val; // Set the value back into the object of properties in case it changed

			// If the value is the same as the current value, decrement the number of properties that are changing
			if ((val === 0 ? val + 'px' : val) === currentStyle[sanitaryProp]) {
				numChangingProps--;
			} 

			if (noCssTransitionSupport) {
				// The amount of linear change per frame = total change amount / num frames = (newValue - currentValue) * framesLeft
				// Where: currentValue = cssMath(currentValue + 0)
				cssIncrementProps[sanitaryProp] = (parseFloat(val) - parseFloat(cssMath(parseFloat(currentStyle[sanitaryProp]), 0, (val + '').replace(rgxUpToUnits, ''), _this, sanitaryProp))) / framesLeft;
			}
		}

		//Inline the element's current CSS styles (even if some properties were set to 0 in the loop because setting all at once here prevents bugs)
		_this.css(_this.css(propertyNames));

		// Set the CSS transition style
		inlineStyle[cssTransitionKey] = duration + 'ms ' + (Firebolt.easing[easing] || easing);
		inlineStyle[cssTransitionKey + 'Property'] = propertyNames.map(dasherize).toString();
		_this.offsetWidth; // Trigger reflow

		// Start the transition
		if (noCssTransitionSupport) {
			//Increment the CSS properties by their respective amounts each frame period until all frames have been rendered
			(function renderFrame() {
				for (prop in cssIncrementProps) {
					inlineStyle[prop] = parseFloat(inlineStyle[prop]) + cssIncrementProps[prop] + inlineStyle[prop].replace(rgxUpToUnits, '');
				}

				if (--framesLeft) {
					temp = setTimeout(renderFrame, 25);
				}
				else {
					_this.trigger(transitionendEventName);
				}
			})();
		}
		else {
			_this.css(properties); // Setting the CSS values starts the transition
		}

		// Set an event that cleans up the animation and calls the complete callback after the transition is done
		_this.addEventListener(transitionendEventName, _this._$A_ = function onTransitionEnd(animationCompleted) {
			// When multiple properties are being animated at once, there will be multiple transitionend events.
			// Only continue if this is the last transitionend event or the animation was stopped early
			if (!noCssTransitionSupport && animationCompleted && animationCompleted.propertyName && --numChangingProps) return;

			// Immediately remove the event listener and delete its saved reference
			_this.removeEventListener(transitionendEventName, onTransitionEnd);
			delete _this._$A_;

			if (!animationCompleted) {
				//Get the current values of the CSS properties being animated
				properties = _this.css(propertyNames);
			}

			if (noCssTransitionSupport) {
				//End the frame rendering and set all the final CSS values
				clearTimeout(temp);
				_this.css(properties);
			}

			// Force the animation to stop now by setting the transition style to 'none'
			inlineStyle[cssTransitionKey] = 'none';
			_this.offsetWidth; // Trigger reflow

			// Restore any CSS properties that need to be restored
			_this.css(valsToRestore);

			if (!animationCompleted) {
				//Set all the current CSS property values
				_this.css(properties);
			}
			else {
				if (hideOnComplete) {
					_this.hide();
				}

				if (complete) {
					complete.call(_this);
				}
			}
		});
	}

	return _this;
};

/*
 * More performant version of Node#appendWith for HTMLElements.
 * @see Node#appendWith
 */
HTMLElementPrototype.appendWith = function() {
	for (var i = 0, arg; i < arguments.length; i++) {
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
};

/*
 * More performant version of Node#beforePut for HTMLElements.
 * @see Node#beforePut
 */
HTMLElementPrototype.beforePut = function() {
	for (var i = 0, arg; i < arguments.length; i++) {
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
};

/**
 * Gets the value of the specified style property.
 * 
 * @function HTMLElement#css
 * @param {String} propertyName - The name of the style property who's value you want to retrieve.
 * @returns {String} The value of the specifed style property.
 */
/**
 * Gets an object of property-value pairs for the input array of CSS properties.
 * 
 * @function HTMLElement#css
 * @param {String[]} propertyNames - An array of one or more CSS property names.
 * @returns {Object.<String, String>} An object of property-value pairs where the values are the computed style values of the input properties.
 */
/**
 * Sets the specified style property.
 * 
 * __Note:__ Unlike jQuery, if the passed in value is a number, it will not be converted to a string with `'px'` appended to it
 * to it prior to setting the CSS value. This helps keep the library small and fast and will force your code to be more obvious
 * as to how it is changing the element's style (which is a good thing).
 * 
 * @function HTMLElement#css
 * @param {String} propertyName - The name of the style property to set.
 * @param {?String|Number} value - A value to set for the specified property.
 */
/**
 * Sets CSS style properties.
 * 
 * __Note:__ Just like the previous function, if a value in the object is a number, it will not be converted to a
 * string with `'px'` appended to it to it prior to setting the CSS value.
 * 
 * @function HTMLElement#css
 * @param {Object.<String, String|Number>} properties - An object of CSS property-values.
 */
HTMLElementPrototype.css = function(prop, value) {
	var _this = this, //Improves minification
		computedStyle,
		mustHide,
		retVal;

	if (value === _undefined) {
		// Temporarily use `retVal` to keep track if the input is an array (it will get set to the correct return value when needed)
		if ((retVal = isArray(prop)) || typeofString(prop)) {
			computedStyle = getComputedStyle(_this);

			// If the element is not visible, it should be shown before reading its CSS values
			mustHide = isDisplayNone(0, computedStyle) && _this.show();

			if (retVal) { // isArray
				// Build an object with the values specified by the input array of properties
				retVal = {};
				for (value = 0; value < prop.length; value++) { // Reuse the value argument instead of a new var
					retVal[prop[value]] = computedStyle[sanitizeCssPropName(prop[value])];
				}
			}
			else {
				// Get the specified property
				retVal = computedStyle[sanitizeCssPropName(prop)];
			}

			if (mustHide) {
				_this.hide(); // Hide the element since it was shown temporarily to obtain style values
			}

			return retVal;
		}

		// Set all specifed properties
		for (value in prop) { // Reuse the value argument instead of a new var
			_this.style[sanitizeCssPropName(value)] = prop[value];
		}
	}
	else {
		// Set the specified property
		_this.style[sanitizeCssPropName(prop)] = value;
	}

	return _this;
};

/**
 * Removes all of the element's child nodes.
 * 
 * @example
 * // HTML (before)
 * // <div id="mydiv">
 * //     <span>Inside Span</span>
 * //     Some Text
 * // </div>
 * 
 * // JavaScript
 * $ID('mydiv').empty();
 *
 * // HTML (after)
 * // <div id="mydiv"></div>
 * 
 * @function HTMLElement#empty
 */
HTMLElementPrototype.empty = function() {
	while (this.firstChild) {
		this.removeChild(this.firstChild);
	}

	return this;
};

/**
 * Displays the element by fading it to opaque.
 * 
 * @function HTMLElement#fadeIn
 * @param {Number} [duration=400] - A number of milliseconds that specifies how long the animation will run.
 * @param {String} [easing="swing"] - A string indicating which easing function to use for the transition. The string can be any
 * [CSS transition timing function](http://www.w3schools.com/cssref/css3_pr_transition-timing-function.asp) or "swing".
 * @param {Function} [complete()] - A function to call once the animation is complete. Inside the function, `this` will
 * refer to the element that was animated.
 */
HTMLElementPrototype.fadeIn = function(duration, easing, complete) {
	return isDisplayNone(this) ? this.fadeToggle(duration, easing, complete) : this;
};

/**
 * Hides the element by fading it to transparent.
 * 
 * @function HTMLElement#fadeOut
 * @param {Number} [duration=400] - A number of milliseconds that specifies how long the animation will run.
 * @param {String} [easing="swing"] - A string indicating which easing function to use for the transition. The string can be any
 * [CSS transition timing function](http://www.w3schools.com/cssref/css3_pr_transition-timing-function.asp) or "swing".
 * @param {Function} [complete()] - A function to call once the animation is complete. Inside the function, `this` will
 * refer to the element that was animated.
 */
HTMLElementPrototype.fadeOut = function(duration, easing, complete) {
	return isDisplayNone(this) ? this : this.fadeToggle(duration, easing, complete);
};

/**
 * Displays or hides the element by animating its opacity.
 * 
 * @function HTMLElement#fadeToggle
 * @param {Number} [duration=400] - A number of milliseconds that specifies how long the animation will run.
 * @param {String} [easing="swing"] - A string indicating which easing function to use for the transition. The string can be any
 * [CSS transition timing function](http://www.w3schools.com/cssref/css3_pr_transition-timing-function.asp) or "swing".
 * @param {Function} [complete()] - A function to call once the animation is complete. Inside the function, `this` will
 * refer to the element that was animated.
 */
HTMLElementPrototype.fadeToggle = function(duration, easing, complete) {
	return this.animate({opacity: TOGGLE}, duration, easing, complete);
};

/**
 * @summary Immediately completes the element's currently running animation.
 * 
 * @description
 * Unlike when {@linkcode HTMLElement#stop|HTMLElement#stop()} is called with a truthy `jumpToEnd` parameter, this function
 * will also trigger a `transitionend` event in addition to immediately finishing the element's running animation. The
 * event will not be triggered however, if the element is not running an animation.
 * 
 * @function HTMLElement#finish
 */
HTMLElementPrototype.finish = function() {
	return this._$A_ ? this.trigger(transitionendEventName) : this;
};

/**
 * Determines if the element's class list has the specified class name.
 * 
 * @function HTMLElement#hasClass
 * @param {String} className - A string containing a single class name.
 * @returns {Boolean} `true` if the class name is in the element's class list; else `false`.
 */
HTMLElementPrototype.hasClass = iframe.classList ? (iframe.classList.add('a', 'b'),
	function(className) {
		return this.classList.contains(className);
	})
	: function(className) { // A function for browsers that don't support the `classList` property
		return new RegExp('(?:^|\\s)' + className + '(?:\\s|$)').test(this.className);
	};

/**
 * Hides the element by setting its display style to 'none'.
 * 
 * @function HTMLElement#hide
 */
HTMLElementPrototype.hide = function() {
	this._$DS_ = this.style.display; // Save current display style
	this.style.display = 'none';     // Hide the element by setting its display style to "none"

	return this;
};

/**
 * Gets the element's inner HTML.
 * 
 * @function HTMLElement#html
 * @returns {String} The element's inner HTML.
 */
/**
 * Sets the element's inner HTML.
 * 
 * __ProTip:__ Quite often, this function is used to set the text contents of elements. However, if the text being set does not
 * (or should not) contain any actual HTML, the `Node#text()` function should be used instead as it will be faster and also
 * prevent unwanted HTML from being injected into the page.
 * 
 * @function HTMLElement#html
 * @param {String} innerHTML - An HTML string.
 */
HTMLElementPrototype.html = function(innerHTML) {
	if (innerHTML === _undefined) {
		return this.innerHTML; //Get
	}
	this.innerHTML = innerHTML; //Set

	return this;
};

/**
 * Gets the element's current coordinates relative to the document.
 * 
 * @function HTMLElement#offset
 * @returns {{top: Number, left: Number}} An object containing the coordinates detailing the element's distance from the top and left of the document.
 * @example
 * // HTML
 * // <body style="margin: 0">
 * //   <div id="mydiv" style="position: absolute; margin: 10px; left: 10px"></div>
 * // </body>
 * 
 * $$('mydiv').offset();  // -> Object {top: 10, left: 20}
 */
/**
 * Sets the element's coordinates relative to the document.
 * 
 * @function HTMLElement#offset
 * @param {{top: Number, left: Number}} coordinates - An object containing the properties `top` and `left`,
 * which are numbers indicating the new top and left coordinates for the element.
 */
HTMLElementPrototype.offset = function(coordinates) {
	var el = this,
		top = 0,
		left = 0;

	if (coordinates) {
		//If the element's position is absolute or fixed, the coordinates can be directly set
		var position = this.css('position');
		if (position[0] === 'a' || position[0] === 'f') {
			return this.css({top: coordinates.top, left: coordinates.left});
		}

		//Otherwise, reset the element's top and left values so relative coordinates can be calculated
		this.css({top: 0, left: 0});
	}

	//Calculate the element's current offset
	do {
		top += el.offsetTop;
		left += el.offsetLeft;
	} while (el = el.offsetParent);

	//Set the element's coordinates with relative positioning or return the calculated coordinates
	return coordinates ? this.css({
			position: 'relative',
			top: 0 - top + coordinates.top,
			left: 0 - left + coordinates.left
		})
		: {top: top, left: left};
};

/*
 * More performant version of Node#prependWith for HTMLElements.
 * @see Node#prependWith
 */
HTMLElementPrototype.prependWith = getHTMLElementAfterPutOrPrependWith('afterbegin', prepend);

/**
 * @summary Removes the specified class(es) or all classes from the element.
 * 
 * @description
 * __Note:__ Unlike jQuery, the format of the space-separated classes required by Firebolt is strict. Each class must
 * be separated by only a single space character and there cannot be whitespace at the beginning or end of the string.
 * ```javascript
 * element.addClass('one  two').removeClass('three ');  // Bad syntax
 * element.addClass('one two').removeClass('three');    // Correct syntax
 * ```
 * 
 * @function HTMLElement#removeClass
 * @param {String} [className] - One or more classes separated by a single space to be removed from the element's class attribute.
 */
HTMLElementPrototype.removeClass = iframe.className.length !== 3 || webkitNotIOS ?
	// Browser compatibility (IE and other old browsers) and speed boost for non-iOS WebKit browsers
	function(value) {
		if (value === _undefined) {
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
	}
	// All other browsers
	: function(value) {
		if (value === _undefined) {
			this.className = ''; //Remove all classes
		}
		else {
			this.classList.remove.apply(this.classList, value.split(' '));
		}
	
		return this;
	};

/**
 * Encode a form element or form control element as a string for submission in an HTTP request.
 * 
 * __Note:__ Unlike jQuery, successful `<select>` controls that have the `multiple` attribute will be encoded
 * using {@linkcode Firebolt.param|Firebolt.param()} with the `traditional` parameter set to `false`, so its
 * array value will be preserved in the encoded string.
 * 
 * @function HTMLElement#serialize
 * @returns {String} A URL-encoded string of the form element's value or an empty string if the element is
 * not a [successful control](http://www.w3.org/TR/html401/interact/forms.html#h-17.13.2).
 * @this HTMLFormElement|HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement
 */
HTMLElementPrototype.serialize = function() {
	var type = this.type,
		name = this.name,
		value = this.val();

	if (!name ||                                           // Doesn't have a name
		this.disabled ||                                   // Is disabled
		value == _undefined ||                             // Is a <select> element and has no value or is not a form control
		rgxFormButton.test(type) ||                        // Is a form button (button|file|reset|submit)
		rgxCheckableElement.test(type) && !this.checked) { // Is a checkbox or radio button and is not checked
		return '';
	}

	//Check if the value is a string because <select> elements may return an array of selected options
	return typeofString(value) ? encodeURIComponent(name) + '=' + encodeURIComponent(value)
							   : serialize( HTMLElementPrototype.prop.call({}, name, value) );
};

/* For form elements, return the serialization of its form controls */
HTMLFormElement[prototype].serialize = function() {
	return this.elements.serialize();
};

/**
 * Shows the element if it is hidden.  
 * __Note:__ If the element's default display style is 'none' (such as is the case with `<script>` elements), it will not be shown.
 * Also, this method will not show an element if its `visibility` is set to 'hidden' or its `opacity` is `0`.
 * 
 * @function HTMLElement#show
 */
HTMLElementPrototype.show = function() {
	var inlineStyle = this.style;

	if (isDisplayNone(0, inlineStyle)) {
		inlineStyle.display = this._$DS_ || ''; //Use the saved display style or clear the display style
	}

	if (isDisplayNone(this)) {
		//Add an element of the same type as this element to the iframe's body to figure out what the default display value should be
		inlineStyle.display = getComputedStyle(
			documentHead.appendChild(iframe).contentDocument.body.appendChild(iframe.contentDocument.createElement(this.tagName))
		).display;
		iframe.remove(); //Remove the iframe from the document (this also deletes its contents)
	}

	return this;
};

/**
 * Displays the element with a sliding motion.
 * 
 * @function HTMLElement#slideDown
 * @param {Number} [duration=400] - A number of milliseconds that specifies how long the animation will run.
 * @param {String} [easing="swing"] - A string indicating which easing function to use for the transition. The string can be any
 * [CSS transition timing function](http://www.w3schools.com/cssref/css3_pr_transition-timing-function.asp) or "swing".
 * @param {Function} [complete()] - A function to call once the animation is complete. Inside the function, `this` will
 * refer to the element that was animated.
 */
HTMLElementPrototype.slideDown = function(duration, easing, complete) {
	return isDisplayNone(this) ? this.slideToggle(duration, easing, complete) : this;
};

/**
 * Displays or hides the element with a sliding motion.
 * 
 * @function HTMLElement#slideToggle
 * @param {Number} [duration=400] - A number of milliseconds that specifies how long the animation will run.
 * @param {String} [easing="swing"] - A string indicating which easing function to use for the transition. The string can be any
 * [CSS transition timing function](http://www.w3schools.com/cssref/css3_pr_transition-timing-function.asp) or "swing".
 * @param {Function} [complete()] - A function to call once the animation is complete. Inside the function, `this` will
 * refer to the element that was animated.
 */
HTMLElementPrototype.slideToggle = function(duration, easing, complete) {
	return this.animate({
		height: TOGGLE,
		marginTop: TOGGLE,
		marginBottom: TOGGLE,
		paddingTop: TOGGLE,
		paddingBottom: TOGGLE
	}, duration, easing, complete);
};

/**
 * Hides the element with a sliding motion.
 * 
 * @function HTMLElement#slideUp
 * @param {Number} [duration=400] - A number of milliseconds that specifies how long the animation will run.
 * @param {String} [easing="swing"] - A string indicating which easing function to use for the transition. The string can be any
 * [CSS transition timing function](http://www.w3schools.com/cssref/css3_pr_transition-timing-function.asp) or "swing".
 * @param {Function} [complete()] - A function to call once the animation is complete. Inside the function, `this` will
 * refer to the element that was animated.
 */
HTMLElementPrototype.slideUp = function(duration, easing, complete) {
	return isDisplayNone(this) ? this : this.slideToggle(duration, easing, complete);
};

/**
 * @summary Stops the animation currently running on the element.
 * 
 * @description
 * When `.stop()` is called on an element, the currently-running animation (if any) is immediately stopped.
 * If, for instance, an element is being hidden with `.slideUp()` when `.stop()` is called, the element will
 * now still be displayed, but will be a fraction of its previous height. Callback functions are not called.
 * 
 * If `jumptToEnd` is `true`, this is equivalent to calling {@linkcode HTMLElement#finish|HTMLElement#finish()},
 * except the `transitionend` event will not occur.
 * 
 * @function HTMLElement#stop
 * @param {Boolean} [jumpToEnd=false] - A Boolean indicating whether to complete the current animation immediately.
 */
HTMLElementPrototype.stop = function(jumpToEnd) {
	if (this._$A_) {
		this._$A_(jumpToEnd);
	}

	return this;
};

/**
 * Shows the element if it is hidden or hides it if it is currently showing.
 * 
 * @function HTMLElement#toggle
 * @param {Boolean} [showOrHide] - A Boolean indicating whether to show or hide the element (`true` => show, `false` => hide).
 * @see HTMLElement#hide
 * @see HTMLElement#show
 */
HTMLElementPrototype.toggle = function(showOrHide) {
	if (showOrHide === true) {
		return this.show();
	}
	else if (showOrHide === false) {
		return this.hide();
	}
	return isDisplayNone(this) ? this.show() : this.hide();
};

/**
 * @summary Add or remove one or more classes from the element depending on the class's presence (or lack thereof).
 * 
 * @description
 * __Note:__ Unlike jQuery, the format of the space-separated classes required by Firebolt is strict. Each class must
 * be separated by only a single space character and there cannot be whitespace at the beginning or end of the string.
 * ```javascript
 * element.toggleClass('one  two ');  // Bad syntax
 * element.toggleClass('one two');    // Correct syntax
 * ```
 * 
 * @function HTMLElement#toggleClass
 * @param {String} [className] - One or more classes separated by a single space to be toggled. If left empty, the element's current class is toggled.
 * @param {Boolean} [addOrRemove] - A Boolean indicating whether to add or remove the class (`true` => add, `false` => remove).
 */
HTMLElementPrototype.toggleClass = function(value, addOrRemove) {
	if (addOrRemove === true) {
		return this.addClass(value);
	}
	else if (addOrRemove === false) {
		return this.removeClass(value);
	}

	if (this.className && value !== true) {
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
			this._$TC_ = this.className; //Save the element's current class name
			value = ''; //Set to an empty string so the class name will be cleared
		}
	}
	else if (!value || value === true) {
		//Retrieve the saved class name or an empty string if there is no saved class name
		value = value !== false && this._$TC_ || (value ? this.className : '');
	}

	//Set the new value
	this.className = value;

	return this;
};

/**
 * Retrieves the element's current value. If the element is a `<select>` element, `null` is returned if none of its options
 * are selected and an array of selected options is returned if the element's `multiple` attribute is present.
 * 
 * @function HTMLElement#val
 * @returns {String|Array|null} The element's value.
 */
/**
 * Sets the element's value.
 * 
 * @function HTMLElement#val
 * @param {String} value - The value to give to the element.
 */
/**
 * Checks the element if its current value is in the input array of values and deselects it otherwise (only `<input>` elements with
 * type `checkbox` or `radio`).  
 * If the element is a `<select>` element, all of its options with a value matching one in the input array of values will be selected
 * and all others deselected. If the select element does not allow multiple selection, only the first matching element is selected.
 * 
 * @function HTMLElement#val
 * @param {String[]} values - The array of values used to determine if the element (or its options) should be checked (or selected).
 */
HTMLElementPrototype.val = function(value) {
	//If `value` is not an array with values to check
	if (!isArray(value)) {
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

	if (value === _undefined) {
		//If multiple selection is allowed and there is at least one selected item, return an array of selected values
		if (multiple && this.selectedIndex >= 0) {
			value = [];
			for (; i < options.length; i++) {
				if (options[i].selected) {
					push1(value, options[i].value);
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
 * @function Node#afterPut
 * @param {...(String|Node|NodeCollection)} content - One or more HTML strings, nodes, or collections of nodes to insert.
 * @throws {TypeError|NoModificationAllowedError} The subject node must have a
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Node.parentNode|ParentNode}.
 */
NodePrototype.afterPut = getNodePutOrWithFunction(insertAfter);

/**
 * Appends this node to the end of the target element(s).
 * 
 * @function Node#appendTo
 * @param {String|ParentNode|NodeCollection} target - A specific node, collection of nodes, or a selector to find a set of nodes to which this node will be appended.
 * @throws {HierarchyRequestError} The target(s) must implement the {@link ParentNode} interface.
 */
NodePrototype.appendTo = getNodeInsertingFunction(append);

/**
 * Appends content to the end of the node.
 * 
 * @function Node#appendWith
 * @param {...(String|Node|NodeCollection)} content - One or more HTML strings, nodes, or collections of nodes to insert.
 * @throws {HierarchyRequestError} This node must implement the {@link ParentNode} interface.
 */
NodePrototype.appendWith = getNodePutOrWithFunction(append);

/**
 * Inserts content before the node.
 * 
 * @function Node#beforePut
 * @param {...(String|Node|NodeCollection)} content - One or more HTML strings, nodes, or collections of nodes to insert.
 * @throws {TypeError|NoModificationAllowedError} The subject node must have a
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Node.parentNode|ParentNode}.
 */
NodePrototype.beforePut = getNodePutOrWithFunction(insertBefore);

/**
 * Gets the node's child elements, optionally filtered by a selector.
 * 
 * @function Node#childElements
 * @param {String} [selector] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection}
 */
NodePrototype.childElements = function(selector) {
	// Try to directly get the element's children, or else filter its child nodes to be only elements
	var children = this.children || ncFilter.call(this.childNodes, isNodeElement);

	if (!selector) {
		return ncFrom(children);
	}

	var nc = new NodeCollection(),
		i = 0;
	for (; i < children.length; i++) {
		if (children[i].matches(selector)) {
			push1(nc, children[i]);
		}
	}
	return nc;
};

/**
 * Create a clone of the node.
 * 
 * @function Node#clone
 * @param {Boolean} [withDataAndEvents=false] - A boolean indicating if the node's data and events should be copied over to the clone.
 * @param {Boolean} [deepWithDataAndEvents=value of withDataAndEvents] - If `false`, data and events for the descendants of the cloned node will
 * not be copied over. If cloning with data and events and you know the descendants do not have any data or events that should be copied, using
 * this variable (by setting it to `false`) will improve performance.
 * @returns {NodeCollection}
 */
NodePrototype.clone = function(withDataAndEvents, deepWithDataAndEvents) {
	var clone = this.cloneNode(true);

	if (withDataAndEvents) {
		copyDataAndEvents(this, clone, deepWithDataAndEvents === false);
	}

	return clone;
};

/**
 * @summary Gets the first node that matches the selector by testing the node itself and traversing up through its ancestors in the DOM tree.
 * 
 * @description
 * __Note:__ Unlike jQuery, there is no version of this function where you can provide a "context" element, whose children that match
 * the input CSS selector will be searched for a match. This is because it is very easy to get the matching children of an element
 * yourself using {@linkcode Element#QSA|Element#QSA()} or {@linkcode Element#find|Element#find()} and you may find that one of
 * these functions suits your needs better than the other.
 * 
 * @function Node#closest
 * @param {String|Node|Node[]} selector - A CSS selector, a node, or a collection of nodes used to match the node and its parents against.
 * @returns {?Node} - The first node that matches the selector.
 */
NodePrototype.closest = function(selector) {
	var node = this;

	if (selector.nodeType) {
		// If the selector is a node and is an ancestor of this node, it is the closest
		return selector.contains(node) ? selector : null;
	}

	if (typeofString(selector)) {
		// If the node is not an element, skip to its parent element
		node = isNodeElement(node) ? node : node.parentElement;

		// Search the node's parent elements until one matches the selector or there are no more parents
		while (node && !node.matches(selector)) {
			node = node.parentElement;
		}
	}
	else {
		// Search the node's parent nodes until one is found in the collection or there are no more parents
		while (node && selector.indexOf(node) < 0) {
			node = node.parentNode;
		}
	}

	return node;
};

/**
 * Gets the child nodes of the element as a {@link NodeCollection}.
 * 
 * __ProTip:__ If you don't need the child nodes in a NodeCollection, you should access them using the native
 * `childNodes` property (which is a {@link NodeList}).
 * 
 * @function Node#contents
 * @returns {NodeCollection}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Node.childNodes | Node.childNodes - Web API Interfaces | MDN}
 */
NodePrototype.contents = function(justChildNodes) { // Parameter for internal use; used by NodeCollection#contents
	var iframeContent = this.contentDocument,
		childNodes = this.childNodes;
	return iframeContent ? new NodeCollection(iframeContent) : justChildNodes ? childNodes : ncFrom(childNodes);
};

/**
 * Get the node's immediately following sibling element. If a selector is provided, it retrieves the next sibling only if it matches that selector.
 * 
 * @function Node#next
 * @param {String} [selector] - A CSS selector to match the next sibling against.
 * @returns {?Element}
 */
NodePrototype.next = getNextOrPrevFunc(nextElementSibling, 1);

/**
 * Gets all following siblings of the node, optionally filtered by a selector.
 * 
 * @function Node#nextAll
 * @param {String} [selector] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection} The set of following sibling elements in order beginning with the closest sibling.
 */
NodePrototype.nextAll = getGetDirElementsFunc(nextElementSibling);

/**
 * Gets the node's following siblings, up to but not including the element matched by the selector, DOM node,
 * or node in a collection.
 * 
 * @function Node#nextUntil
 * @param {String|Element|Node[]} [selector] - A CSS selector, an element, or a collection of nodes used to indicate
 * where to stop matching following sibling elements.
 * @param {String} [filter] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection} - The set of following sibling elements in order beginning with the closest sibling.
 */
NodePrototype.nextUntil = getGetDirElementsFunc(nextElementSibling, 0);

/* 
 * Used by Node#off
 * Removes the passed in handler from the array of handlers or removes all handlers if handler is undefined.
 * Deletes the array of handlers if it is empty after handlers have been removed.
 */
function removeSelectorHandler(selectorHandlers, selector, handler) {
	var handlers = selectorHandlers[selector];
	if (handlers) {
		if (handler) {
			for (var i = 0; i < handlers.length; i++) {
				if (handlers[i].f === handler) {
					handlers.splice(i--, 1); // Use i-- so that i has the same value when the loop completes and i++ happens
				}
			}
		} else {
			handlers.clear();
		}

		if (!handlers.length) {
			// The array of handlers is now empty so it can be deleted
			delete selectorHandlers[selector];
		}
	}
}

/**
 * Removes one or more event handlers set by `.on()` or `.one()`.
 * 
 * @function Node#off
 * @param {String} events - One or more space-separated event types, such as "click" or "click keypress".
 * @param {String} [selector] - A selector which should match the one originally passed to `.on()`
 * when attaching event handlers.
 * @param {Function} [handler] - A handler function previously attached for the event(s),
 * or the special value `false` (see `Node#on()`).
 * @see {@link http://api.jquery.com/off/#off-events-selector-handler|.off() | jQuery API Documentation}
 */
/**
 * Removes one or more event handlers set by `.on()` or `.one()`.
 * 
 * @function Node#off
 * @param {Object} events - An object where the string keys represent one or more space-separated
 * event types and the values represent handler functions previously attached for the event(s).
 * @param {String} [selector] - A selector which should match the one originally passed to `.on()`
 * when attaching event handlers.
 * @see {@link http://api.jquery.com/off/#off-events-selector|.off() | jQuery API Documentation}
 */
/**
 * Removes all event handlers set by `.on()` or `.one()`.
 * 
 * @function Node#off
 * @see {@link http://api.jquery.com/off/#off|.off() | jQuery API Documentation}
 */
NodePrototype.off = off;
function off(events, selector, handler) {
	var eventHandlers = this._$E_,
		eventType,
		selectorHandlers,
		sel,
		i;

	// Don't bother doing anything if there haven't been any Firebolt handlers set
	if (eventHandlers) {
		if (typeofObject(events)) {
			// Call this function for each event and handler in the object
			for (i in events) {
				off.call(this, i, selector, events[i]);
			}
		} else {
			// If events was passed in, remove those events, else remove all events
			events = events ? events.split(' ') : keys(eventHandlers);

			if (selector !== _undefined && !typeofString(selector)) {
				// The handler was in the selector argument and there is no real selector argument
				handler = selector;
				selector = _undefined;
			}

			// If the handler is the value false, the handler should be a function that returns false
			if (handler === false) {
				handler = returnFalse;
			}

			for (i = 0; i < events.length; i++) {
				if (selectorHandlers = eventHandlers[eventType = events[i]]) {
					// If a selector was provided, remove handlers for that particular selector
					if (selector && selector !== '**') {
						removeSelectorHandler(selectorHandlers, selector, handler);
					} else {
						// Remove handlers for all selectors
						for (sel in selectorHandlers) {
							// If `sel` is the non-delegate selector (is falsy), only remove the handler if the input
							// selector does not exist (for if it did exist it would have to be '**', which is only
							// for removing delegated handlers)
							if (sel || !selector) {
								removeSelectorHandler(selectorHandlers, sel, handler);
							}
						}
					}

					// If there are no more selectors left, the object for the current event can be deleted
					// and the event listener must be removed
					if (isEmptyObject(selectorHandlers)) {
						delete eventHandlers[eventType];
						this.removeEventListener(eventType, nodeEventHandler);
					}
				}
			}

			// If there are no handlers left for any events, delete the event handler store
			if (isEmptyObject(eventHandlers)) {
				this._$E_ = _undefined;
			}
		}
	}

	return this;
}

/* Slightly alter the Event#stopPropagation() method for more convenient use in Node#on() */
EventPrototype.stopPropagation = function() {
	this.propagationStopped = true;
	stopPropagation.call(this);
};
EventPrototype.propagationStopped = false; // Set the default value on the Event prototype

/* This is the function that will be invoked for each event type when a handler is set with Node#on() */
function nodeEventHandler(eventObject, extraParameters) {
	var _this = this,
		target = eventObject.target,
		eType = eventObject.type,
		selectorHandlers = _this._$E_[eType],
		selectorHandlersCopy = {},
		selectors = keys(selectorHandlers).remove(''), // Don't want the selector for non-delegated handlers in the array
		numSelectors = selectors.length,
		i = 0,
		selector,
		result;

	// If the extra parameters are not defined (by `.triggerHandler()`), perhaps they were defined by `.trigger()`
	if (extraParameters === _undefined) {
		extraParameters = eventObject._$P_;
	}

	/*
	 * @param {{f: function, d: *, o: boolean}} handlerObject - The object containing the handler data that was set in `.on()`
	 */
	function callHandlerOnTarget(handlerObject) {
		eventObject.data = handlerObject.d; // Set data in the event object before calling the handler

		result = handlerObject.f.call(target, eventObject, extraParameters); // Call the handler and store the result

		if (result === false) {
			eventObject.stopPropagation();
			eventObject.preventDefault();
		}

		// Remove the handler if it should only occur once
		if (handlerObject.o) {
			off.call(_this, eType, selector, handlerObject.f);
			handlerObject.o = 0; // Make the "one" specifier falsy so this if statement won't try to remove it again
		}
	}

	// Only do delegated events if there are selectors that can be used to delegate events and if the target
	// was not this element (since if it was this element there would be nothing to bubble up from)
	if (numSelectors && target !== _this) {
		// Build a copy of the selector handlers so they won't be altered if `.off()` is ever called
		for (; i < numSelectors; i++) {
			selectorHandlersCopy[selectors[i]] = arrayFrom(selectorHandlers[selectors[i]]);
		}

		// Call the handlers for each selector on each matching element
		// up to the current element or until propagation is stopped
		do {
			if (isNodeElement(target)) {
				for (i = 0; i < numSelectors; i++) {
					if (target.matches(selector = selectors[i])) {
						selectorHandlersCopy[selector].forEach(callHandlerOnTarget);
					}
				}
			}
		} while ((target = target.parentNode) !== _this && !eventObject.propagationStopped);
	}

	// If there are non-delegated handlers and propagation has not been stopped, call the handlers on the current element
	selectorHandlers = selectorHandlers[selector = ''];
	if (selectorHandlers && !eventObject.propagationStopped) {
		target = _this;
		// Use a clone so the handlers array won't be altered if `off()` is ever called
		arrayFrom(selectorHandlers).forEach(callHandlerOnTarget);
	}

	return result;
}

/**
 * @summary Attaches an event handler function for one or more events to the node.
 *  
 * @description Check out [jQuery's documentation](http://api.jquery.com/on/) for details.
 * There are only a couple minor differences:
 * 1. Firebolt does not offer event namespacing.
 * 2. The native [Event](https://developer.mozilla.org/en-US/docs/Web/API/Event) object is passed to the handler (with an
 * added `data` property, and if propagation is stopped, there will be a `propagationStopped` property set to `true`).
 * 
 * @function Node#on
 * @param {String} events - One or more space-separated event types, such as "click" or "click keypress".
 * @param {String} [selector] - A selector string to filter the descendants of the selected elements that trigger the event.
 * If the selector is `null` or omitted, the event is always triggered when it reaches the selected element.
 * @param {*} [data] - Data to be passed to the handler in `eventObject.data` when an event is triggered.
 * @param {Function} handler(eventObject) - A function to execute when the event is triggered.
 * Inside the function, `this` will refer to the node the event was triggered on. The value
 * `false` is also allowed as a shorthand for a function that simply does `return false`.
 * @see {@link http://api.jquery.com/on/#on-events-selector-data-handler|.on() | jQuery API Documentation}
 */
/**
 * @summary Attaches an event handler function for one or more events to the node.
 *  
 * @description Check out [jQuery's documentation](http://api.jquery.com/on/) for details.
 * There are only a couple minor differences:
 * 1. Firebolt does not offer event namespacing.
 * 2. The native [Event](https://developer.mozilla.org/en-US/docs/Web/API/Event) object is passed to the handler (with an
 * added `data` property, and if propagation is stopped, there will be a `propagationStopped` property set to `true`).
 * 
 * @function Node#on
 * @param {Object} events - An object where the string keys represent one or more space-separated
 * event types and the values represent handler functions to be called for the event(s).
 * @param {String} [selector] - A selector string to filter the descendants of the selected elements that trigger the event.
 * If the selector is `null` or omitted, the event is always triggered when it reaches the selected element.
 * @param {*} [data] - Data to be passed to the handler in `eventObject.data` when an event is triggered.
 * @see {@link http://api.jquery.com/on/#on-events-selector-data|.on() | jQuery API Documentation}
 */
NodePrototype.on = on;
function on(events, selector, data, handler, /*INTERNAL*/ one) {
	var eventHandlers = this._$E_ || (this._$E_ = {}),
		selectorIsString = typeofString(selector),
		selectorHandlers,
		eventType,
		i;

	if (typeofString(events)) {
		events = events.split(' ');

		// Organize arguments into their proper places
		if (handler === _undefined) {
			if (data === _undefined) {
				handler = selector; // The handler was in the selector argument
			} else {
				handler = data;     // The handler was in the data argument
				data = selectorIsString ? _undefined : selector; // Data was undefined or was in the selector argument
			}
		}

		if (!selectorIsString) {
			selector = ''; // Make the selector an empty string to be used as an object key
		}

		// If the handler is the value false, the handler should be a function that returns false
		if (handler === false) {
			handler = returnFalse;
		}

		for (i = 0; i < events.length; i++) {
			if (eventType = events[i]) { // Sanity check
				selectorHandlers = eventHandlers[eventType]; // Get the selector handlers object for the event type

				// If the object for the event doesn't exist, create it and add Firebolt's event function as a listener
				if (!selectorHandlers) {
					selectorHandlers = eventHandlers[eventType] = {};
					this.addEventListener(eventType, nodeEventHandler);
				}

				// Get the array of handlers for the selector or create it if it doesn't exist
				selectorHandlers = selectorHandlers[selector] || (selectorHandlers[selector] = []);

				// Add the user-input handler and data to the array of handlers
				push1(selectorHandlers, {f: handler, d: data, o: one});
			}
		}
	} else {
		// Call this function for each event and event handler in the object
		for (i in events) {
			on.call(this, i, selector, data, events[i], one);
		}
	}

	return this;
}

/**
 * Attaches a handler to an event for the node. The handler is executed at most once per event type.  
 * Exactly the same as `Node#on()` except the event handler is removed after it executes for the first time.
 * 
 * @function Node#one
 * @param {String} events
 * @param {String} [selector]
 * @param {*} [data]
 * @param {Function} handler(eventObject)
 * @see {@link http://api.jquery.com/one/#one-events-selector-data-handler|.one() | jQuery API Documentation}
 */
/**
 * Attaches a handler to an event for the node. The handler is executed at most once per event type.  
 * Exactly the same as `Node#on()` except the event handler is removed after it executes for the first time.
 * 
 * @function Node#one
 * @param {Object} events
 * @param {String} [selector]
 * @param {*} [data]
 * @see {@link http://api.jquery.com/one/#one-events-selector-data|.one() | jQuery API Documentation}
 */
NodePrototype.one = function(events, selector, data, handler) {
	return on.call(this, events, selector, data, handler, 1);
};

/**
 * Gets the node's ancestors, optionally filtered by a selector.
 * 
 * @function Node#parents
 * @param {String} [selector] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection} - The set of the node's ancestors, ordered from the immediate parent on up.
 */
NodePrototype.parents = getGetDirElementsFunc('parentElement');

/**
 * Gets the node's ancestors, up to but not including the element matched by the selector, DOM node,
 * or node in a collection.
 * 
 * @function Node#parentsUntil
 * @param {String|Element|Node[]} [selector] - A CSS selector, an element, or a collection of nodes used to indicate
 * where to stop matching ancestor elements.
 * @param {String} [filter] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection} - The set of the node's ancestors, ordered from the immediate parent on up.
 */
NodePrototype.parentsUntil = getGetDirElementsFunc('parentElement', 0);

/**
 * Prepends content to the beginning of the node.
 * 
 * @function Node#prependWith
 * @param {...(String|Node|NodeCollection)} content - One or more HTML strings, nodes, or collections of nodes to insert.
 * @throws {HierarchyRequestError} This node must implement the {@link ParentNode} interface.
 */
NodePrototype.prependWith = getNodePutOrWithFunction(prepend);

/**
 * Prepends this node to the beginning of the target element(s).
 * 
 * @function Node#prependTo
 * @param {String|ParentNode|NodeCollection} target - A specific node, collection of nodes, or a selector to find a set of nodes to which this node will be prepended.
 * @throws {HierarchyRequestError} The target(s) must implement the {@link ParentNode} interface.
 */
NodePrototype.prependTo = getNodeInsertingFunction(prepend);

/**
 * Get the node's immediately preceeding sibling element. If a selector is provided, it retrieves the previous sibling only if it matches that selector.
 * 
 * @function Node#prev
 * @param {String} [selector] - A CSS selector to match the previous sibling against.
 * @returns {?Element}
 */
NodePrototype.prev = getNextOrPrevFunc(previousElementSibling, 1);

/**
 * Gets all preceeding siblings of the node, optionally filtered by a selector.
 * 
 * @function Node#prevAll
 * @param {String} [selector] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection} The set of preceeding sibling elements in order beginning with the closest sibling.
 */
NodePrototype.prevAll = getGetDirElementsFunc(previousElementSibling);

/**
 * Gets the node's preceeding siblings, up to but not including the element matched by the selector, DOM node,
 * or node in a collection.
 * 
 * @function Node#prevUntil
 * @param {String|Element|Node[]} [selector] - A CSS selector, an element, or a collection of nodes used to indicate
 * where to stop matching preceeding sibling elements.
 * @param {String} [filter] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection} - The set of preceeding sibling elements in order beginning with the closest sibling.
 */
NodePrototype.prevUntil = getGetDirElementsFunc(previousElementSibling, 0);

/**
 * Inserts this node directly after the specified target(s).
 * 
 * @function Node#putAfter
 * @param {String|Node|NodeCollection} target - A specific node, collection of nodes, or a selector to find a set of nodes after which this node will be inserted.
 * @throws {TypeError} The target node(s) must have a {@link https://developer.mozilla.org/en-US/docs/Web/API/Node.parentNode|ParentNode}.
 */
NodePrototype.putAfter = getNodeInsertingFunction(insertAfter);

/**
 * Inserts this node directly before the specified target(s).
 * 
 * @function Node#putBefore
 * @param {String|Node|NodeCollection} target - A specific node, collection of nodes, or a selector to find a set of nodes after which this node will be inserted.
 * @throws {TypeError} The target node(s) must have a {@link https://developer.mozilla.org/en-US/docs/Web/API/Node.parentNode|ParentNode}.
 */
NodePrototype.putBefore = getNodeInsertingFunction(insertBefore);

/**
 * Replace the target with this node.
 * 
 * @function Node#replaceAll
 * @param {String|Node|NodeCollection} target - A specific node, collection of nodes, or a selector to find a set of nodes to be replaced by this node.
 * @throws {TypeError} The target node(s) must have a {@link https://developer.mozilla.org/en-US/docs/Web/API/Node.parentNode|ParentNode}.
 */
NodePrototype.replaceAll = getNodeInsertingFunction(replaceWith);

/**
 * Replace the node with some other content.
 * 
 * @function Node#replaceWith
 * @param {...(String|Node|NodeCollection)} content - A specific node, a collection of nodes, or some HTML to replace the subject node.
 * @throws {TypeError} The subject node must have a {@link https://developer.mozilla.org/en-US/docs/Web/API/Node.parentNode|ParentNode}.
 */
NodePrototype.replaceWith = getNodePutOrWithFunction(replaceWith);

/**
 * Removes this node from the DOM.
 * 
 * @function Node#remove
 * @returns void (`undefined`)
 */
NodePrototype.remove = function() {
	if (this.parentNode) {
		this.parentNode.removeChild(this);
	}
};

/**
 * Gets the node's siblings, optionally filtered by a selector.
 * 
 * @function Node#siblings
 * @param {String} [selector] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection} - The set of the node's ancestors, ordered from the immediate parent on up.
 * @throws {TypeError} The subject node must have a
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Node.parentNode | ParentNode}.
 */
NodePrototype.siblings = function(selector) {
	return NodePrototype.childElements.call(this.parentNode, selector).remove(this);
};

/**
 * Gets this node's text content.
 * 
 * __Note:__ Consider using the native `textContent` property instead of this function.
 * 
 * __Warning #1:__ There is a known bug where `<body>` elements will have an empty string as the `text` property instead
 * of this function due to browsers continuing to implement a deprecated API on the HTMLBodyElement prototype. Please use the native
 * `textContent` property to get and set the text content of `<body>` elements instead of attempting to use this function.
 * 
 * __Warning #2:__ `<script>` elements have a `text` property with the exact same functionality as the `textContent` property
 * that cannot be overwritten. Please use the native `text` property or the `textContent` property to get and set the text
 * content of `<script>` elements instead of attempting to use this function.
 * 
 * @function Node#text
 * @returns {String} The node's text content.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Node.textContent|Node.textContent - Web API Interfaces | MDN}
 */
/**
 * @summary Sets this node's text content.
 * 
 * @description
 * __Note:__ Consider using the native `textContent` property instead of this function.
 * 
 * __Warning #1:__ There is a known bug where `<body>` elements will have an empty string as the `text` property instead
 * of this function due to browsers continuing to implement a deprecated API on the HTMLBodyElement prototype. Please use the native
 * `textContent` property to get and set the text content of `<body>` elements instead of attempting to use this function.
 * 
 * __Warning #2:__ `<script>` elements have a `text` property with the exact same functionality as the `textContent` property
 * that cannot be overwritten. Please use the native `text` property or the `textContent` property to get and set the text
 * content of `<script>` elements instead of attempting to use this function.
 * 
 * @function Node#text
 * @param {String} text - The text or content that will be converted to a string to be set as the node's text content.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Node.textContent | Node.textContent - Web API Interfaces | MDN}
 */
NodePrototype.text = function(text) {
	if (text === _undefined) {
		return this.textContent; // Get
	}

	this.textContent = text; // Set

	return this;
};

/**
 * Triggers a real DOM event on the node for the given event type.
 * 
 * @function Node#trigger
 * @param {String} eventType - A string containing a JavaScript event type, such as "click" or "submit".
 * @param {*} extraParameters - Additional parameters that will be passed as the second argument to the triggered event handler(s).
 */
/**
 * Uses the input Event object to trigger the specified event on the node.
 * 
 * @function Node#trigger
 * @param {Event} event - An {@link https://developer.mozilla.org/en-US/docs/Web/API/Event | Event} object.
 * @param {*} extraParameters - Additional parameters that will be passed as the second argument to the triggered event handler(s).
 */
NodePrototype.trigger = function(event, extraParameters) {
	if (typeofString(event)) {
		event = createEventObject(event);
	}

	event._$P_ = extraParameters;

	this.dispatchEvent(event);

	return this;
};

/**
 * @summary Executes all handlers attached to the node for an event type.
 * 
 * @description
 * The `.triggerHandler()` method behaves similarly to `.trigger()`, with the following exceptions:
 * 
 * + The `.triggerHandler()` method does not cause the default behavior of an event to occur (such as a form submission or button click).
 * + Events triggered with `.triggerHandler()` do not bubble up the DOM hierarchy; if they are not handled by the target node directly,
 *   they do nothing.
 * + Instead of returning the node, `.triggerHandler()` returns whatever value was returned by the last handler it caused to be executed.
 *   If no handlers are triggered, it returns `undefined`.
 * 
 * @function Node#triggerHandler
 * @param {String} eventType - A string containing a JavaScript event type, such as "click" or "submit".
 * @param {*} extraParameters - Additional parameters that will be passed as the second argument to the triggered event handler(s).
 */
NodePrototype.triggerHandler = function(event, extraParameters) {
	// Only trigger handlers if there are event handlers saved to the node
	return this._$E_ && this._$E_[event] && nodeEventHandler.call(this, createEventObject(event), extraParameters);
};

/**
 * Remove the node's parent from the DOM, leaving the node in its place.
 * 
 * @function Node#unwrap
 * @throws {TypeError} The subject node must have a {@link ParentNode}, which in turn must also have a ParentNode.
 */
NodePrototype.unwrap = function() {
	var parent = this.parentNode,
		grandparent = parent.parentNode;

	if (parent.nodeName != 'BODY') {
		while (parent.firstChild) {
			grandparent.insertBefore(parent.firstChild, parent);
		}
		grandparent.removeChild(parent);
	}

	return this;
};

/**
 * Wrap an HTML structure around the content of the node.
 * 
 * @function Node#wrapInner
 * @param {String|Element|Element[]} wrappingElement - CSS selector&mdash;to select wrapping element(s)&mdash;,
 *     HTML string&mdash;to create wrapping element(s)&mdash;, element, or collection of elements used to
 *     specify the structure to wrap around the node's contents.
 * @throws {HierarchyRequestError} The node must implement the {@link ParentNode} interface.
 */
NodePrototype.wrapInner = function(wrappingElement) {
	if (wrappingElement = getWrappingElement(wrappingElement)) {
		this.appendChild(getWrappingInnerElement(wrappingElement).appendWith(this.childNodes));
	}

	return this;
};

/**
 * Wrap an HTML structure around the node.
 * 
 * @function Node#wrapWith
 * @param {String|Element|Element[]} wrappingElement - CSS selector&mdash;to select wrapping element(s)&mdash;,
 *     HTML string&mdash;to create wrapping element(s)&mdash;, element, or collection of elements used to
 *     specify the structure to wrap around the node.
 * @throws {TypeError} The subject node must have a {@link ParentNode}.
 */
NodePrototype.wrapWith = function(wrappingElement) {
	if (wrappingElement = getWrappingElement(wrappingElement)) {
		replaceWith(wrappingElement, this);
		getWrappingInnerElement(wrappingElement).appendChild(this);
	}

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

/**
 * Same constructor as {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array | Array}.
 * 
 * @class NodeCollection
 * @mixes Array
 * @classdesc
 * A mutable collection of DOM nodes. It subclasses the native {@link Array} class (but take note that the `.clone()`,
 * `.remove()`, and `.filter()` functions have been overridden), and has all of the main DOM-manipulating functions.
 * `NodeCollection` can also be reference by its shorter alias: `NC`.
 * 
 * __Note:__ Since it is nearly impossible to fully subclass the Array class in JavaScript, there is one minor hiccup
 * with the way NodeCollection subclasses Array. The `instanceof` operator will not report that NodeCollection is an
 * instance of anything other than a NodeCollection. It also will not report that `NodeCollection` is a function.
 * This is demonstrated in the following code:
 * ```javascript
 * var nc = new NodeCollection(); // (or 'new NC()' for short)
 * nc instanceof NodeCollection;  // true
 * nc instanceof NC;     // true
 * nc instanceof Array;  // false
 * nc instanceof Object; // false
 * nc.constructor instanceof Function; // false
 * ```
 * All other operations, such as `Array.isArray()` and `typeof`, will work correctly.
 * 
 * It should be noted that all functions that do not have a specified return value, return the calling object,
 * allowing for function chaining.  
 * <br />
 */
var
	//<iframe> Array subclassing
	NodeCollection = window.NodeCollection = window.NC = documentHead.appendChild(iframe).contentWindow.Array,

	//Extend NodeCollection's prototype with the Array functions
	NodeCollectionPrototype = extend(NodeCollection[prototype], prototypeExtensions, getTypedArrayFunctions(NodeCollection)),

	//Set and get the NodeCollection.from function (gets the custom function and not the native one even if it exists)
	ncFrom = setAndGetArrayFromFunction(NodeCollection),

	//Save a reference to the original filter function for use later on
	ncFilter = NodeCollectionPrototype.filter;

iframe.remove(); //Remove the iframe that was used to subclass Array

/* Add a bunch of functions by calling the HTMLElement version on each element in the collection */
('addClass animate blur click empty fadeIn fadeOut fadeToggle '
+ 'finish focus hide removeAttr removeClass removeData removeProp '
+ 'show slideDown slideToggle slideUp stop toggle toggleClass').split(' ').forEach(function(fnName) {
	var fn = HTMLElementPrototype[fnName];
	NodeCollectionPrototype[fnName] = function() {
		for (var i = 0, len = this.length; i < len; i++) {
			if (isNodeElement(this[i])) {
				fn.apply(this[i], arguments);
			}
		}
		return this;
	};
});

/**
 * @summary Adds the queried elements to a copy of the existing collection (if they are not already in the collection)
 * and returns the result.
 * 
 * @description
 * Do not assume that this method appends the nodes to the existing collection in the order they are passed to the method
 * (that's what `concat` is for). When all nodes are members of the same document, the resulting collection will be sorted
 * in document order; that is, in order of each node's appearance in the document. If the collection consists of nodes
 * from different documents or ones not in any document, the sort order is undefined (but nodes in the collection that are
 * in the same document will still be in document order).
 * 
 * @function NodeCollection#add
 * @param {String} selector - A CSS selector to use to find elements to add to the collection.
 * @returns {NodeCollection} The result of unioning the queried elements with the current collection.
 */
/**
 * Adds the newly created elements to a copy of the existing collection and returns the result.
 * 
 * @function NodeCollection#add
 * @param {String} html - An HTML fragment to add to the collection.
 * @returns {NodeCollection} The result adding the elements created with the HTML to current collection.
 */
/**
 * @summary Adds the node to a copy of the existing collection (if it is not already in the collection) and returns the result.
 * 
 * @description
 * Do not assume that this method appends the node to the existing collection (that is what `push` is for).
 * When all nodes are members of the same document, the resulting collection will be sorted in document order;
 * that is, in order of each node's appearance in the document. If the collection consists of nodes from
 * different documents or ones not in any document, the sort order is undefined (but nodes in the collection
 * that are in the same document will still be in document order).
 * 
 * @function NodeCollection#add
 * @param {Node} node - A DOM Node.
 * @returns {NodeCollection} The result of adding the node to the current collection.
 */
/**
 * @summary Returns the union of the current collection of nodes and the input one.
 * 
 * @description
 * Do not assume that this method appends the nodes to the existing collection in the order they are passed to the method
 * (that's what `concat` is for). When all nodes are members of the same document, the resulting collection will be sorted
 * in document order; that is, in order of each node's appearance in the document. If the collection consists of nodes
 * from different documents or ones not in any document, the sort order is undefined (but nodes in the collection that are
 * in the same document will still be in document order).
 * 
 * @function NodeCollection#add
 * @param {NodeCollection|NodeList|HTMLCollection|Node[]} nodes
 * @returns {NodeCollection} The result of adding the input nodes to the current collection.
 */
NodeCollectionPrototype.add = function(input) {
	return (
		input.nodeType ? this.contains(input) ? ncFrom(this) : this.concat(input)
		               : this.union(typeofString(input) ? Firebolt(input) : input)
	).sort(sortDocOrder);
};

/**
 * Adds the input class name to all elements in the collection.
 * 
 * @function NodeCollection#addClass
 * @param {String} className - The class to be added to each element in the collection.
 */

/**
 * Alias of {@link NodeCollection#afterPut} provided for similarity with jQuery.
 * 
 * Note that Firebolt does not define a method called "after" for {@link Node}. This is because the DOM Living Standard has defined
 * a native function called `after` for the {@link http://dom.spec.whatwg.org/#interface-childnode|ChildNode Interface} that
 * does not function in the same way as `.afterPut()`.
 * 
 * @function NodeCollection#after
 * @see NodeCollection#afterPut
 */
/**
 * Inserts content after each node in the collection.
 * 
 * @function NodeCollection#afterPut
 * @param {...(String|Node|NodeCollection)} content - One or more HTML strings, nodes, or collections of nodes to insert.
 * @throws {TypeError|NoModificationAllowedError} The subject collection of nodes must only contain nodes that have a
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Node.parentNode | ParentNode}.
 */
NodeCollectionPrototype.afterPut = NodeCollectionPrototype.after = getNodeCollectionPutOrWithFunction(insertAfter);

/**
 * @summary Performs a custom animation of a set of CSS properties.
 * 
 * @description
 * Just like NodeCollection#css, CSS properties must be specified the same way they would be in a style sheet since Firebolt
 * does not append "px" to input numeric values (i.e. 1 != 1px).
 * 
 * Unlike jQuery, an object that specifies different easing types for different properties is not supported.
 * (Should it be supported? [Tell me why](https://github.com/woollybogger/Firebolt/issues).)
 * However, relative properties (indicated with `+=` or `-=`) and the `toggle` indicator are supported.
 * 
 * For more `easing` options, use Firebolt's [easing extension](https://github.com/woollybogger/firebolt-extensions/tree/master/easing)
 * (or just grab some functions from it and use them as the `easing` parameter).
 * 
 * @function NodeCollection#animate
 * @param {Object} properties - An object of CSS properties and values that the animation will move toward.
 * @param {Number} [duration=400] - A number of milliseconds that specifies how long the animation will run.
 * @param {String} [easing="swing"] - A string indicating which easing function to use for the transition. The string can be any
 * [CSS transition timing function](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function) or "swing".
 * @param {Function} [complete()] - A function to call once the animation is complete. Inside the function, `this` will
 * refer to the element that was animated.
 * @see {@link http://api.jquery.com/animate/ | .animate() | jQuery API Documentation}
 */

/**
 * Appends each node in this collection to the end of the specified target(s).
 * 
 * @function NodeCollection#appendTo
 * @param {String|ParentNode|NodeCollection} target - A specific node, collection of nodes, or a selector to find a set of nodes to which each node will be appended.
 * @throws {HierarchyRequestError} The target(s) must implement the {@link ParentNode} interface.
 */
NodeCollectionPrototype.appendTo = getNodeCollectionPutToOrReplaceAllFunction('appendWith');

/**
 * Alias of {@link NodeCollection#appendWith} provided for similarity with jQuery.
 * 
 * Note that Firebolt does not define a method called "append" for {@link Node}. This is because the DOM Living Standard has defined
 * a native function called `append` for the {@link http://dom.spec.whatwg.org/#interface-parentnode|ParentNode Interface} that
 * does not function in the same way as `.appendWith()`.
 * 
 * @function NodeCollection#append
 * @see NodeCollection#appendWith
 */
/**
 * Appends content to the end of each element in the collection.
 * 
 * @function NodeCollection#appendWith
 * @param {...(String|Node|NodeCollection)} content - One or more HTML strings, nodes, or collections of nodes to insert.
 * @throws {HierarchyRequestError} The nodes in the collection must implement the {@link ParentNode} interface.
 */
NodeCollectionPrototype.appendWith = NodeCollectionPrototype.append = getNodeCollectionPutOrWithFunction(append);

/**
 * Gets the value of the specified attribute of the first element in the collection.
 * 
 * @function NodeCollection#attr
 * @param {String} attribute - The name of the attribute who's value you want to get.
 * @returns {String} The value of the attribute.
 */
/**
 * Sets the specified attribute for each element in the collection.
 * 
 * @function NodeCollection#attr
 * @param {String} attribute - The name of the attribute who's value should be set.
 * @param {String} value - The value to set the specified attribute to.
 */
/**
 * Sets attributes for each element in the collection.
 * 
 * @function NodeCollection#attr
 * @param {Object} attributes - An object of attribute-value pairs to set.
 */
NodeCollectionPrototype.attr = getFirstSetEachElement(HTMLElementPrototype.attr, function(numArgs) {
	return numArgs < 2;
});

/**
 * Alias of {@link NodeCollection#beforePut} provided for similarity with jQuery.
 * 
 * Note that Firebolt does not define a method called "before" for {@link Node}. This is because the DOM Living Standard has defined
 * a native function called `before` for the {@link http://dom.spec.whatwg.org/#interface-childnode|ChildNode Interface} that
 * does not function in the same way as `.beforePut()`.
 * 
 * @function NodeCollection#before
 * @see NodeCollection#beforePut
 */
/**
 * Inserts content before each node in the collection.
 * 
 * @function NodeCollection#beforePut
 * @param {...(String|Node|NodeCollection)} content - One or more HTML strings, nodes, or collections of nodes to insert.
 * @throws {TypeError|NoModificationAllowedError} The subject collection of nodes must only contain nodes that have a
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Node.parentNode|ParentNode}.
 */
NodeCollectionPrototype.beforePut = NodeCollectionPrototype.before = getNodeCollectionPutOrWithFunction(insertBefore);

/**
 * Calls {@linkcode https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement.blur | HTMLElement#blur()} on each element in the collection.
 * 
 * @function NodeCollection#blur
 */

/**
 * Gets the child elements of each element in the collection, optionally filtered by a selector.
 * 
 * @function NodeCollection#childElements
 * @param {String} [selector] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection} The set of children, sorted in document order.
 */
/**
 * Alias for {@linkcode NodeCollection#childElements|NodeCollection#childElements()}.
 * 
 * @function NodeCollection#children
 * @param {String} [selector] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection} The set of children, sorted in document order.
 */
NodeCollectionPrototype.children = NodeCollectionPrototype.childElements = getGetDirElementsFunc(HTMLElementPrototype.childElements, sortDocOrder);

/**
 * Calls {@linkcode https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement.click | HTMLElement#click()} on each element in the collection.
 * 
 * @function NodeCollection#click
 */

/**
 * Create a deep copy of the collection of nodes.
 * 
 * __ProTip:__ If you want a shallow copy of the collection, use `.toNC()` (even thought that's mainly a NodeList function,
 * NodeCollections also have it in their prototype) or pass the collection into `NodeCollection.from()`.
 * 
 * @function NodeCollection#clone
 * @param {Boolean} [withDataAndEvents=false] - A boolean indicating if each node's data and events should be copied over to its clone.
 * @param {Boolean} [deepWithDataAndEvents=value of withDataAndEvents] - If `false`, data and events for the descendants of the cloned nodes will
 * not be copied over. If cloning with data and events and you know the descendants do not have any data or events that should be copied, using
 * this variable (by setting it to `false`) will improve performance.
 * @returns {NodeCollection}
 */
NodeCollectionPrototype.clone = function(withDataAndEvents, deepWithDataAndEvents) {
	var len = this.length,
		clone = new NodeCollection(len),
		i = 0;

	for (; i < len; i++) {
		clone[i] = this[i].clone(withDataAndEvents, deepWithDataAndEvents);
	}

	return clone;
};

/**
 * @summary For each node in the collection, gets the first node that matches the selector by testing the node itself
 * and traversing up through its ancestors in the DOM tree.
 * 
 * @description
 * __Note:__ Unlike jQuery, there is no version of this function where you can provide a "context" element, whose children that match
 * the input CSS selector will be searched for a match. This is because it is very easy to get the matching children of an element
 * yourself using {@linkcode Element#QSA|Element#QSA()} or {@linkcode Element#find|Element#find()} and you may find that one of
 * these functions suits your needs better than the other.
 * 
 * @function NodeCollection#closest
 * @param {String|Node|Node[]} selector - A CSS selector, a node, or a collection of nodes used to match the node and its parents against.
 * @returns {Node[]} - A collection of "closest" nodes.
 */
NodeCollectionPrototype.closest = function(selector) {
	var nc = new NodeCollection(),
		i = 0,
		node;

	for (; i < this.length; i++) {
		if ((node = this[i].closest(selector)) && nc.indexOf(node) < 0) {
			push1(nc, node);
		}
	}

	return nc;
};

/**
 * @summary Gets the child nodes of each element in the collection.
 * 
 * @description If `this` collection contains duplicates, the returned collection will contain duplicates.
 * 
 * @function NodeCollection#contents
 * @returns {NodeCollection} The collection of all the child nodes of the elements in the collection.
 */
NodeCollectionPrototype.contents = function() {
	var nc = new NodeCollection(),
		i = 0;

	for (; i < this.length; i++) {
		// Call Node#contents on the current node, passing in a truthy value so it doesn't
		// bother making a NodeCollection out of the childNodes before returning
		array_push.apply(nc, NodePrototype.contents.call(this[i], 1));
	}

	return nc;
};

/**
 * Gets the value of the specified style property of the first element in the collection.
 * 
 * @function NodeCollection#css
 * @param {String} propertyName - The name of the style property who's value you want to retrieve.
 * @returns {String} The value of the specifed style property.
 */
/**
 * Gets an object of property-value pairs for the input array of CSS properties for the first element in the collection.
 * 
 * @function NodeCollection#css
 * @param {String[]} propertyNames - An array of one or more CSS property names.
 * @returns {Object.<String, String>} An object of property-value pairs where the values are the computed style values of the input properties.
 */
/**
 * Sets the specified style property for each element in the collection.
 * 
 * __Note:__ Unlike jQuery, if the passed in value is a number, it will not be converted to a string with `'px'` appended to it
 * to it prior to setting the CSS value. This helps keep the library small and fast and will force your code to be more obvious
 * as to how it is changing the element's style (which is a good thing).
 * 
 * @function NodeCollection#css
 * @param {String} propertyName - The name of the style property to set.
 * @param {String|Number} value - A value to set for the specified property.
 */
/**
 * Sets CSS style properties for each element in the collection.
 * 
 * __Note:__ Just like the previous function, if a value in the object is a number, it will not be converted to a
 * string with `'px'` appended to it to it prior to setting the CSS value.
 * 
 * @function NodeCollection#css
 * @param {Object.<String, String|Number>} properties - An object of CSS property-values.
 */
NodeCollectionPrototype.css = getFirstSetEachElement(HTMLElementPrototype.css, function(numArgs, firstArg) {
	return isArray(firstArg) || numArgs < 2 && typeofString(firstArg);
});

/**
 * Gets the first element's stored data object.
 * 
 * @function NodeCollection#data
 * @returns {Object} The element's stored data object.
 */
/**
 * Get the value at the named data store for the first element as set by .data(key, value) or by an HTML5 data-* attribute.
 * 
 * @function NodeCollection#data
 * @param {String} key - The name of the stored data.
 * @returns {*} The value of the stored data.
 */
/**
 * Stores arbitrary data associated with each element in the collection.
 * 
 * @function NodeCollection#data
 * @param {String} key - A string naming the data to set.
 * @param {*} value - Any arbitrary data to store.
 */
/**
 * Stores arbitrary data associated with each element in the collection
 * 
 * @function NodeCollection#data
 * @param {Object} obj - An object of key-value pairs to add to each element's stored data.
 */
NodeCollectionPrototype.data = getFirstSetEachElement(ElementPrototype.data, function(numArgs, firstArg) {
	return !numArgs || numArgs < 2 && typeofString(firstArg);
});

/**
 * Removes all child nodes from each element in the list.
 * 
 * @function NodeCollection#empty
 */

/**
 * Displays each element in the collection by fading it to opaque.
 * 
 * @function NodeCollection#fadeIn
 * @param {Number} [duration=400] - A number of milliseconds that specifies how long the animation will run.
 * @param {String} [easing="swing"] - A string indicating which easing function to use for the transition. The string can be any
 * [CSS transition timing function](http://www.w3schools.com/cssref/css3_pr_transition-timing-function.asp) or "swing".
 * @param {Function} [complete()] - A function to call once the animation is complete. Inside the function, `this` will
 * refer to the element that was animated.
 */

/**
 * Hides each element in the collection by fading it to transparent.
 * 
 * @function NodeCollection#fadeOut
 * @param {Number} [duration=400] - A number of milliseconds that specifies how long the animation will run.
 * @param {String} [easing="swing"] - A string indicating which easing function to use for the transition. The string can be any
 * [CSS transition timing function](http://www.w3schools.com/cssref/css3_pr_transition-timing-function.asp) or "swing".
 * @param {Function} [complete()] - A function to call once the animation is complete. Inside the function, `this` will
 * refer to the element that was animated.
 */

/**
 * Displays or hides each element in the collection by animating its opacity.
 * 
 * @function NodeCollection#fadeToggle
 * @param {Number} [duration=400] - A number of milliseconds that specifies how long the animation will run.
 * @param {String} [easing="swing"] - A string indicating which easing function to use for the transition. The string can be any
 * [CSS transition timing function](http://www.w3schools.com/cssref/css3_pr_transition-timing-function.asp) or "swing".
 * @param {Function} [complete()] - A function to call once the animation is complete. Inside the function, `this` will
 * refer to the element that was animated.
 */

/**
 * Creates a new NodeCollection containing only the elements that match the provided selector.
 * (If you want to filter against another set of elements, use the {@linkcode Array#intersect|intersect} function.)
 * 
 * @function NodeCollection#filter
 * @param {String} selector - CSS selector string to match the current collection of elements against.
 * @returns {NodeCollection}
 */
/**
 * Creates a new NodeCollection with all elements that pass the test implemented by the provided function.
 * (If you want to filter against another set of elements, use the {@linkcode Array#intersect|intersect} function.)
 * 
 * @function NodeCollection#filter
 * @param {Function} function(value, index, collection) - A function used as a test for each element in the collection.
 * @returns {NodeCollection}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter | Array#filter() - JavaScript | MDN}
 */
NodeCollectionPrototype.filter = function(selector) {
	return ncFilter.call(this, 
		typeofString(selector)
			? function(node) { return isNodeElement(node) && node.matches(selector); } //Use CSS string filter
			: selector //Use given filter function
	);
};

/**
 * Gets the descendants of each element in the collection, filtered by a selector, collection of elements, or a single element.
 * 
 * @function NodeCollection#find
 * @param {String|Element|Element[]} selector - A CSS selector, a collection of elements, or a single element used to match descendant elements against.
 * @returns {NodeList|NodeCollection}
 * @throws {TypeError} This error is thrown when the collection contains elements that do not have a `querySelectorAll()` function.
 */
NodeCollectionPrototype.find = getGetDirElementsFunc(ElementPrototype.find, sortDocOrder);

/**
 * Immediately completes the currently running animation for each element in the collection.
 * 
 * @function NodeCollection#finish
 */

/**
 * Calls {@linkcode https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement.focus | HTMLElement#focus()} on each element in the collection.
 * 
 * @function NodeCollection#focus
 */

/**
 * Hides each element in the collection.
 * 
 * @function NodeCollection#hide
 * @see HTMLElement#hide
 */

/**
 * Gets the inner HTML of the first element in the list.
 * 
 * @function NodeCollection#html
 * @returns {String} The element's inner HTML.
 */
/**
 * Sets the inner HTML of each element in the list.
 * 
 * @function NodeCollection#html
 * @param {String} innerHTML - An HTML string.
 */
NodeCollectionPrototype.html = getFirstSetEachElement(HTMLElementPrototype.html, function(numArgs) {
	return !numArgs;
});

/**
 * Returns the `index`th item in the collection. If `index` is greater than or equal to the number of nodes in the list, this returns `null`.
 * 
 * @function NodeCollection#item
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
 * @function NodeCollection#insertAfter
 * @see NodeCollection#putAfter
 */

/**
 * Alias of {@link NodeCollection#putBefore} provided for similarity with jQuery.
 * 
 * @function NodeCollection#insertBefore
 * @see NodeCollection#putBefore
 */

/**
 * Get the each node's immediately following sibling element. If a selector is provided, it retrieves the next sibling only if it matches that selector.
 * 
 * @function NodeCollection#next
 * @param {String} [selector] - A CSS selector to match the next sibling against.
 * @returns {NodeCollection} The collection of sibling elements.
 */
NodeCollectionPrototype.next = getNextOrPrevFunc(nextElementSibling);

/**
 * Gets all following siblings of each node in the collection, optionally filtered by a selector.
 * 
 * @function NodeCollection#nextAll
 * @param {String} [selector] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection} The set of following sibling elements in order beginning with the closest sibling.
 */
NodeCollectionPrototype.nextAll = getGetDirElementsFunc(HTMLElementPrototype.nextAll, sortDocOrder);

/**
 * Gets the following siblings of each node in the collection, up to but not including the elements matched by the selector,
 * DOM node, or node in a collection.
 * 
 * @function NodeCollection#nextUntil
 * @param {String|Element|Node[]} [selector] - A CSS selector, an element, or a collection of nodes used to indicate
 * where to stop matching following sibling elements.
 * @param {String} [filter] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection} - The set of following sibling elements in order beginning with the closest sibling.
 */
NodeCollectionPrototype.nextUntil = getGetDirElementsFunc(HTMLElementPrototype.nextUntil, sortDocOrder);

/**
 * Removes one or more event handlers set by `.on()` or `.one()`.
 * 
 * @function NodeCollection#off
 * @param {String} events - One or more space-separated event types, such as "click" or "click keypress".
 * @param {String} [selector] - A selector which should match the one originally passed to `.on()` when attaching event handlers.
 * @param {Function} [handler] - A handler function previously attached for the event(s), or the special value `false` (see `NodeCollection#on()`).
 * @see {@link http://api.jquery.com/off/#off-events-selector-handler|.off() | jQuery API Documentation}
 */
/**
 * Removes one or more event handlers set by `.on()` or `.one()`.
 * 
 * @function NodeCollection#off
 * @param {Object} events - An object where the string keys represent one or more space-separated event types and the values represent
 * handler functions previously attached for the event(s).
 * @param {String} [selector] - A selector which should match the one originally passed to `.on()` when attaching event handlers.
 * @see {@link http://api.jquery.com/off/#off-events-selector|.off() | jQuery API Documentation}
 */
/**
 * Removes all event handlers set by `.on()` or `.one()`.
 * 
 * @function NodeCollection#off
 * @see {@link http://api.jquery.com/off/#off|.off() | jQuery API Documentation}
 */
NodeCollectionPrototype.off = callOnEach(NodePrototype.off);

/**
 * Gets the current coordinates of the first element in the collection relative to the document.
 * 
 * @function NodeCollection#offset
 * @returns {{top: Number, left: Number}} An object containing the coordinates detailing the element's distance from the top and left of the document.
 * @see HTMLElement#offset
 */
/**
 * Sets the each element's coordinates relative to the document.
 * 
 * @function NodeCollection#offset
 * @param {{top: Number, left: Number}} coordinates - An object containing the properties `top` and `left`,
 * which are numbers indicating the new top and left coordinates to set for each element.
 */
NodeCollectionPrototype.offset = getFirstSetEachElement(HTMLElementPrototype.offset, function(numArgs) {
	return !numArgs;
});

/**
 * @summary Attaches an event handler function for one or more events to each node in the collection.
 *  
 * @description Check out [jQuery's documentation](http://api.jquery.com/on/) for details. There are only a couple minor differences:
 * 1. Firebolt does not offer event namespacing.
 * 2. The native [Event](https://developer.mozilla.org/en-US/docs/Web/API/Event) object is passed to the handler (with an added
 * `data` property, and if propagation is stopped, there will be a `propagationStopped` property set to `true`).
 * 
 * @function NodeCollection#on
 * @param {String} events - One or more space-separated event types, such as "click" or "click keypress".
 * @param {String} [selector] - A selector string to filter the descendants of the selected elements that trigger the event.
 * If the selector is `null` or omitted, the event is always triggered when it reaches the selected element.
 * @param {*} [data] - Data to be passed to the handler in `eventObject.data` when an event is triggered.
 * @param {Function} handler(eventObject) - A function to execute when the event is triggered. Inside the function, `this` will refer to
 * the node the event was triggered on. The value `false` is also allowed as a shorthand for a function that simply does `return false`.
 * @see {@link http://api.jquery.com/on/#on-events-selector-data-handler|.on() | jQuery API Documentation}
 */
/**
 * @summary Attaches an event handler function for one or more events to each node in the collection.
 *  
 * @description Check out [jQuery's documentation](http://api.jquery.com/on/) for details. There are only a couple minor differences:
 * 1. Firebolt does not offer event namespacing.
 * 2. The native [Event](https://developer.mozilla.org/en-US/docs/Web/API/Event) object is passed to the handler (with an added
 * `data` property, and if propagation is stopped, there will be a `propagationStopped` property set to `true`).
 * 
 * @function NodeCollection#on
 * @param {Object} events - An object where the string keys represent one or more space-separated event types and the values represent
 * handler functions to be called for the event(s).
 * @param {String} [selector] - A selector string to filter the descendants of the selected elements that trigger the event.
 * If the selector is `null` or omitted, the event is always triggered when it reaches the selected element.
 * @param {*} [data] - Data to be passed to the handler in `eventObject.data` when an event is triggered.
 * @see {@link http://api.jquery.com/on/#on-events-selector-data|.on() | jQuery API Documentation}
 */
NodeCollectionPrototype.on = callOnEach(NodePrototype.on);

/**
 * Attaches a handler to an event for each node in the collection. The handler is executed at most once per node, per event type.  
 * Exactly the same as `NodeCollection#on()` except the event handler is removed after it executes for the first time.
 * 
 * @function NodeCollection#one
 * @param {String} events
 * @param {String} [selector]
 * @param {*} [data]
 * @param {Function} handler(eventObject)
 * @see {@link http://api.jquery.com/one/#one-events-selector-data-handler|.one() | jQuery API Documentation}
 */
/**
 * Attaches a handler to an event for each node in the collection. The handler is executed at most once per node, per event type.  
 * Exactly the same as `NodeCollection#on()` except the event handler is removed after it executes for the first time.
 * 
 * @function NodeCollection#one
 * @param {Object} events
 * @param {String} [selector]
 * @param {*} [data]
 * @see {@link http://api.jquery.com/one/#one-events-selector-data|.one() | jQuery API Documentation}
 */
NodeCollectionPrototype.one = callOnEach(NodePrototype.one);

/**
 * Gets the parent of each node in the collection, optionally filtered by a selector.
 * 
 * @function NodeCollection#parent
 * @param {String} [selector] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection} - The set of parents. Unlike the `.parents()` function, this set may include Document and DocumentFragment nodes.
 */
NodeCollectionPrototype.parent = function(selector) {
	var nc = new NodeCollection(),
		i = 0,
		parent;

	for (; i < this.length; i++) {
		parent = this[i].parentNode;
		if ((!selector || (isNodeElement(parent) && parent.matches(selector))) && nc.indexOf(parent) < 0) {
			push1(nc, parent);
		}
	}

	return nc;
};

/**
 * Gets the ancestors of each node in the collection, optionally filtered by a selector.
 * 
 * @function NodeCollection#parents
 * @param {String} [selector] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection} - The set of ancestors, sorted in reverse document order.
 */
NodeCollectionPrototype.parents = getGetDirElementsFunc(HTMLElementPrototype.parents, sortRevDocOrder);

/**
 * Gets the ancestors of each node in the collection, up to but not including the elements matched by the selector,
 * DOM node, or node in a collection.
 * 
 * @function NodeCollection#parentsUntil
 * @param {String|Element|Node[]} [selector] - A CSS selector, an element, or a collection of nodes used to indicate
 * where to stop matching ancestor elements.
 * @param {String} [filter] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection} - The set of ancestors, sorted in reverse document order.
 */
NodeCollectionPrototype.parentsUntil = getGetDirElementsFunc(HTMLElementPrototype.parentsUntil, sortRevDocOrder);

/**
 * Alias of {@link NodeCollection#prependWith} provided for similarity with jQuery.
 * 
 * Note that Firebolt does not define a method called "prepend" for {@link Node}. This is because the DOM Living Standard has defined
 * a native function called `prepend` for the {@link http://dom.spec.whatwg.org/#interface-parentnode|ParentNode Interface} that
 * does not function in the same way as `.prependWith()`.
 * 
 * @function NodeCollection#prepend
 * @see NodeCollection#prependWith
 */
/**
 * Prepends content to the beginning of each element in the collection.
 * 
 * @function NodeCollection#prependWith
 * @param {...(String|Node|NodeCollection)} content - One or more HTML strings, nodes, or collections of nodes to insert.
 * @throws {HierarchyRequestError} The nodes in the collection must implement the {@link ParentNoded} interface.
 */
NodeCollectionPrototype.prependWith = NodeCollectionPrototype.prepend = getNodeCollectionPutOrWithFunction(prepend);

/**
 * Prepends each node in this collection to the beginning of the specified target(s).
 * 
 * @function NodeCollection#prependTo
 * @param {String|ParentNode|NodeCollection} target - A specific node, collection of nodes, or a selector to find a set of nodes to which each node will be prepended.
 * @throws {HierarchyRequestError} The target(s) must implement the {@link ParentNode} interface.
 */
NodeCollectionPrototype.prependTo = getNodeCollectionPutToOrReplaceAllFunction('prependWith');

/**
 * Get the each node's immediately preceeding sibling element. If a selector is provided, it retrieves the previous sibling only if it matches that selector.
 * 
 * @function NodeCollection#prev
 * @param {String} [selector] - A CSS selector to match the previous sibling against.
 * @returns {NodeCollection} The collection of sibling elements.
 */
NodeCollectionPrototype.prev = getNextOrPrevFunc(previousElementSibling);

/**
 * Gets all preceeding siblings of each node in the collection, optionally filtered by a selector.
 * 
 * @function NodeCollection#prevAll
 * @param {String} [selector] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection} The set of preceeding sibling elements in order beginning with the closest sibling.
 */
NodeCollectionPrototype.prevAll = getGetDirElementsFunc(HTMLElementPrototype.prevAll, sortRevDocOrder);

/**
 * Gets the preceeding siblings of each node in the collection, up to but not including the elements matched by the selector,
 * DOM node, or node in a collection.
 * 
 * @function NodeCollection#prevUntil
 * @param {String|Element|Node[]} [selector] - A CSS selector, an element, or a collection of nodes used to indicate
 * where to stop matching preceeding sibling elements.
 * @param {String} [filter] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection} - The set of preceeding sibling elements in order beginning with the closest sibling.
 */
NodeCollectionPrototype.prevUntil = getGetDirElementsFunc(HTMLElementPrototype.prevUntil, sortRevDocOrder);

/**
 * Gets the value of the specified property of the first element in the list.
 * 
 * @function NodeCollection#prop
 * @param {String} property - The name of the property who's value you want to get.
 * @returns {?} The value of the property being retrieved.
 */
/**
 * Sets the specified property for each element in the list.
 * 
 * @function NodeCollection#prop
 * @param {String} property - The name of the property to be set.
 * @param {*} value - The value to set the property to.
 */
/**
 * Sets the specified properties of each element in the list.
 * 
 * @function NodeCollection#prop
 * @param {Object} properties - An object of property-value pairs to set.
 */
NodeCollectionPrototype.prop = getFirstSetEachElement(HTMLElementPrototype.prop, function(numArgs, firstArg) {
	return numArgs < 2 && typeofString(firstArg);
});

/**
 * Inserts each node in this collection directly after the specified target(s).
 * 
 * @function NodeCollection#putAfter
 * @param {String|Node|NodeCollection} target - A specific node, collection of nodes, or a selector to find a set of nodes after which each node will be inserted.
 * @throws {TypeError} The target node(s) must have a {@link https://developer.mozilla.org/en-US/docs/Web/API/Node.parentNode|ParentNode}.
 */
NodeCollectionPrototype.putAfter = NodeCollectionPrototype.insertAfter = getNodeCollectionPutToOrReplaceAllFunction('afterPut');

/**
 * Inserts each node in this collection directly before the specified target(s).
 * 
 * @function NodeCollection#insertBefore
 * @param {String|Node|NodeCollection} target - A specific node, collection of nodes, or a selector to find a set of nodes before which each node will be inserted.
 * @throws {TypeError} The target node(s) must have a {@link https://developer.mozilla.org/en-US/docs/Web/API/Node.parentNode|ParentNode}.
 */
NodeCollectionPrototype.putBefore = NodeCollectionPrototype.insertBefore = getNodeCollectionPutToOrReplaceAllFunction('beforePut');

/**
 * Removes nodes in the collection from the DOM tree.
 * 
 * @function NodeCollection#remove
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
 * @function NodeCollection#removeAttr
 * @param {String} attribute - The name of the attribute to be removed.
 */

/**
 * Removes the input class name from all elements in the list.
 * 
 * @function NodeCollection#removeClass
 * @param {String} className - The class to be removed from each element in the collection.
 */

/**
 * Removes a previously stored piece of Firebolt data from each element.  
 * When called without any arguments, all data is removed.
 * 
 * @function NodeCollection#removeData
 * @param {String} [name] - The name of the data to remove.
 */
/**
 * Removes previously stored Firebolt data from each element.  
 * When called without any arguments, all data is removed.
 * 
 * @function NodeCollection#removeData
 * @param {Array|String} [list] - An array or space-separated string naming the pieces of data to remove.
 */

/**
 * Removes the specified property from each element in the list.
 * 
 * @function NodeCollection#removeProp
 * @param {String} property - The name of the property to remove.
 */

/**
 * Replace the target with the nodes in this collection.
 * 
 * @function NodeCollection#replaceAll
 * @param {String|Node|NodeCollection} target - A specific node, collection of nodes, or a selector to find a set of nodes to be replaced
 * by the nodes in this collection.
 * @throws {TypeError} The target node(s) must have a {@link https://developer.mozilla.org/en-US/docs/Web/API/Node.parentNode|ParentNode}.
 */
NodeCollectionPrototype.replaceAll = getNodeCollectionPutToOrReplaceAllFunction('replaceWith');

/**
 * Replace each node in the collection with some other content.
 * 
 * @function NodeCollection#replaceWith
 * @param {...(String|Node|NodeCollection)} content - A specific node, a collection of nodes, or some HTML to replace each node in the collection.
 * @throws {TypeError|NoModificationAllowedError} The subject collection of nodes must only contain nodes that have a
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Node.parentNode|ParentNode}.
 */
NodeCollectionPrototype.replaceWith = getNodeCollectionPutOrWithFunction(replaceWith);

/**
 * Encode a set of form elements or form control elements as a string for submission in an HTTP request.  
 * Note that only [successful controls](http://www.w3.org/TR/html401/interact/forms.html#h-17.13.2) will
 * have their values added to the serialized string. All button elements (including file input buttons)
 * are also ignored.
 * 
 * __ProTip:__ The best way to serialize a single form is to select the form element and  call `.serialize()`
 * directly on it (see {@link HTMLElement#serialize}).
 * 
 * @function NodeCollection#serialize
 * @returns {String} A URL-encoded string of the elements' serialized values or an empty string if no element could be successfully serialized.
 * @throws {TypeError} Each element in the collection must be an HTMLElement.
 * @see HTMLElement#serialize
 * @see {@link http://api.jquery.com/serialize/|.serialize() | jQuery API Documentation}
 */
NodeCollectionPrototype.serialize = function() {
	var retStr = '',
		i = 0,
		val;

	for (; i < this.length; i++) {
		if (val = this[i].serialize()) {
			retStr += (retStr ? '&' : '') + val;
		}
	}

	return retStr;
};

/**
 * Shows each element in the collection. For specifics, see {@link HTMLElement#show}.
 * 
 * @function NodeCollection#show
 * @see HTMLElement#show
 */

/**
 * Gets the sibling elements of each node in the collection, optionally filtered by a selector.
 * 
 * @function NodeCollection#siblings
 * @param {String} [selector] - A CSS selector used to filter the returned set of elements.
 * @returns {NodeCollection} The set of siblings, sorted in document order.
 * @throws {TypeError} The target node(s) must have a {@link https://developer.mozilla.org/en-US/docs/Web/API/Node.parentNode|ParentNode}.
 */
NodeCollectionPrototype.siblings = getGetDirElementsFunc(HTMLElementPrototype.siblings, sortDocOrder);

/**
 * Displays each element in the collection with a sliding motion.
 * 
 * @function NodeCollection#slideDown
 * @param {Number} [duration=400] - A number of milliseconds that specifies how long the animation will run.
 * @param {String} [easing="swing"] - A string indicating which easing function to use for the transition. The string can be any
 * [CSS transition timing function](http://www.w3schools.com/cssref/css3_pr_transition-timing-function.asp) or "swing".
 * @param {Function} [complete()] - A function to call once the animation is complete. Inside the function, `this` will
 * refer to the element that was animated.
 */

/**
 * Displays or hides each element in the collection with a sliding motion.
 * 
 * @function NodeCollection#slideToggle
 * @param {Number} [duration=400] - A number of milliseconds that specifies how long the animation will run.
 * @param {String} [easing="swing"] - A string indicating which easing function to use for the transition. The string can be any
 * [CSS transition timing function](http://www.w3schools.com/cssref/css3_pr_transition-timing-function.asp) or "swing".
 * @param {Function} [complete()] - A function to call once the animation is complete. Inside the function, `this` will
 * refer to the element that was animated.
 */

/**
 * Hides each element in the collection with a sliding motion.
 * 
 * @function NodeCollection#slideUp
 * @param {Number} [duration=400] - A number of milliseconds that specifies how long the animation will run.
 * @param {String} [easing="swing"] - A string indicating which easing function to use for the transition. The string can be any
 * [CSS transition timing function](http://www.w3schools.com/cssref/css3_pr_transition-timing-function.asp) or "swing".
 * @param {Function} [complete()] - A function to call once the animation is complete. Inside the function, `this` will
 * refer to the element that was animated.
 */

/**
 * @summary Stops the animation currently running on each element in the collection.
 * 
 * @description
 * When `.stop()` is called on an element, the currently-running animation (if any) is immediately stopped.
 * If, for instance, an element is being hidden with `.slideUp()` when `.stop()` is called, the element will
 * now still be displayed, but will be a fraction of its previous height. Callback functions are not called.
 * 
 * If `jumptToEnd` is `true`, this is equivalent to calling `NodeCollection#finish()`.
 * 
 * @function NodeCollection#stop
 * @param {Boolean} [jumpToEnd=false] - A Boolean indicating whether to complete the current animation immediately.
 */

/**
 * Gets the combined text contents of each node in the list.
 * 
 * @function NodeCollection#text
 * @returns {String} The node's text content.
 */
/**
 * Sets the text content of each node in the list.
 * 
 * @function NodeCollection#text
 * @param {String|*} text - The text or content that will be converted to a string to be set as each nodes' text content.
 */
NodeCollectionPrototype.text = function(text) {
	var len = this.length,
		i = 0;
	//Get
	if (text === _undefined) {
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
 * Shows each element in the collection if it is hidden or hides it if it is currently showing.
 * 
 * @function NodeCollection#toggle
 * @param {Boolean} [showOrHide] - A Boolean indicating whether to show or hide the elements (`true` => show, `false` => hide).
 * @see HTMLElement#hide
 * @see HTMLElement#show
 */

/**
 * Toggles the input class name for all elements in the list.
 * 
 * @function NodeCollection#toggleClass
 * @param {String} className - The class to be toggled for each element in the collection.
 * @param {Boolean} [addOrRemove] - A Boolean indicating whether to add or remove the class (`true` => add, `false` => remove).
 */

/**
 * Returns all of the nodes in the NodeCollection, as an {@link Array}.
 * 
 * @function NodeCollection#toArray
 * @returns {Array}
 */
NodeCollectionPrototype.toArray = ArrayPrototype.clone;

/**
 * Returns a shallow copy of the NodeCollection.  
 * This is mainly just so it can be inherited by {@link NodeList}, but can also be used like {@linkcode Array#clone}.
 * 
 * @function NodeCollection#toNC
 * @returns {NodeCollection}
 */
NodeCollectionPrototype.toNC = function() {
	return ncFrom(this);
};

/**
 * Triggers a real DOM event on each node in the collection for the given event type.
 * 
 * @function NodeCollection#trigger
 * @param {String} eventType - A string containing a JavaScript event type, such as "click" or "submit".
 * @param {*} extraParameters - Additional parameters that will be passed as the second argument to the triggered event handler(s).
 */
/**
 * Uses the input Event object to trigger the specified event on each node in the collection.
 * 
 * @function NodeCollection#trigger
 * @param {Event} event - An {@link https://developer.mozilla.org/en-US/docs/Web/API/Event | Event} object.
 * @param {*} extraParameters - Additional parameters that will be passed as the second argument to the triggered event handler(s).
 */
NodeCollectionPrototype.trigger = callOnEach(NodePrototype.trigger);

/**
 * @summary Executes all handlers attached to the node for an event type.
 * 
 * @description
 * The `.triggerHandler()` method behaves similarly to `.trigger()`, with the following exceptions:
 * 
 * + The `.triggerHandler()` method does not cause the default behavior of an event to occur (such as a form submission or button click).
 * + While `.trigger()` will operate on all nodes in the collection, `.triggerHandler()` only affects the first node.
 * + Events triggered with `.triggerHandler()` do not bubble up the DOM hierarchy; if they are not handled by the target node directly,
 *   they do nothing.
 * + Instead of returning the node, `.triggerHandler()` returns whatever value was returned by the last handler it caused to be executed.
 *   If no handlers are triggered, it returns `undefined`.
 * 
 * @function NodeCollection#triggerHandler
 * @param {String} eventType - A string containing a JavaScript event type, such as "click" or "submit".
 * @param {*} extraParameters - Additional parameters that will be passed as the second argument to the triggered event handler(s).
 */
NodeCollectionPrototype.triggerHandler = function(eventType, extraParameters) {
	return this[0] && this[0].triggerHandler(eventType, extraParameters);
};

/**
 * Remove the each node's parent from the DOM, leaving the node in its place.
 * 
 * @function NodeCollection#unwrap
 * @throws {TypeError} Each node must have a {@link ParentNode}, which in turn must also have a ParentNode.
 */
NodeCollectionPrototype.unwrap = function() {
	var parents = NodeCollectionPrototype.parent.call(this),
		i = 0;
	for (; i < parents.length; i++) {
		NodePrototype.unwrap.call(parents[i].firstChild);
	}

	return this;
};

/**
 * Retrieves the current value of the first element in the collection. If the element is a `<select>` element, `null` is returned if
 * none of its options are selected and an array of selected options is returned if the element's `multiple` attribute is present.
 * 
 * @function NodeCollection#val
 * @returns {String|Array|null} The first element's value.
 */
/**
 * Sets the value of each element in the collection.
 * 
 * @function NodeCollection#val
 * @param {String} value - The value to give to each element.
 */
/**
 * Checks each element in the collection if its current value is in the input array of values and deselects it otherwise
 * (only `<input>` elements with type `checkbox` or `radio`).  
 * If an element is a `<select>` element, all of its options with a value matching one in the input array of values will be selected
 * and all others deselected. If the select element does not allow multiple selection, only the first matching element is selected.
 * 
 * @function NodeCollection#val
 * @param {String[]} values - The array of values used to determine if each element (or its options) should be checked (or selected).
 */
NodeCollectionPrototype.val = function(value) {
	//Get first
	if (value === _undefined) {
		return this[0].val();
	}

	//Set each
	for (var i = 0; i < this.length; i++) {
		this[i].val(value);
	}

	return this;
};

/**
 * Wrap an HTML structure around the contents of each node in the collection.
 * 
 * @function NodeCollection#wrapInner
 * @param {String|Element|Element[]) wrappingElement - CSS selector&mdash;to select wrapping element(s)&mdash;,
 *     HTML string&mdash;to create wrapping element(s)&mdash;, element, or collection of elements used to
 *     specify the wrapping structure.
 * @throws {HierarchyRequestError} The target node(s) must implement the {@link ParentNode} interface.
 */
NodeCollectionPrototype.wrapInner = function(wrappingElement) {
	if (wrappingElement = getWrappingElement(wrappingElement)) {
		for (var i = 0; i < this.length; i++) {
			this[i].wrapInner(wrappingElement);
		}
	}

	return this;
};

/**
 * A jQuery-reminiscent alias for {@linkcode NodeCollection#wrapWith}.
 * 
 * @function NodeCollection#wrap
 * @param {String|Element|Element[]) wrappingElement
 */
/**
 * Wrap an HTML structure around each node in the collection.
 * 
 * @function NodeCollection#wrapWith
 * @param {String|Element|Element[]) wrappingElement - CSS selector&mdash;to select wrapping element(s)&mdash;,
 *     HTML string&mdash;to create wrapping element(s)&mdash;, element, or collection of elements used to
 *     specify the wrapping structure.
 * @throws {TypeError} The target node(s) must have a {@link ParentNode}.
 */
NodeCollectionPrototype.wrap =
NodeCollectionPrototype.wrapWith = function(wrappingElement) {
	if (wrappingElement = getWrappingElement(wrappingElement)) {
		for (var i = 0; i < this.length; i++) {
			NodePrototype.wrapWith.call(this[i], wrappingElement);
		}
	}

	return this;
};

//#endregion NodeCollection


//#region =========================== NodeList ===============================

/**
 * @classdesc
 * The HTML DOM NodeList interface. Represents a collection of DOM Nodes.
 * 
 * NodeLists have <u>almost</u> the exact same API as {@link NodeCollection}, so there are a few caveats to take note of:
 * 
 * <u>__1.__</u>
 * Unlike NodeCollections, NodeLists are immutable and therefore do not have any of the following functions:
 * 
 * + clear
 * + pop
 * + push
 * + shift
 * + splice
 * + unshift
 * 
 * If you want to manipulate a NodeList using these functions, you must retrieve it as a NodeCollection by
 * calling {@linkcode NodeList#toNC|.toNC()} on the NodeList.
 * 
 * <u>__2.__</u>
 * The following functions return the NodeCollection equivalent of the NodeList instead of
 * the NodeList itself:
 * 
 * + afterPut / after
 * + appendWith / append
 * + appendTo
 * + beforePut / before
 * + copyWithin (ES6 browsers only)
 * + each
 * + fill (ES6 browsers only)
 * + putAfter / insertAfter
 * + putBefore / insertBefore
 * + prependWith / prepend
 * + prependTo
 * + remove
 * + removeClass
 * + replaceAll
 * + replaceWith
 * + reverse
 * + sort
 * + toggleClass
 * + unwrap
 * + wrapWith / wrap
 * + wrapInner
 * 
 * This is because these functions will or may alter live NodeLists, as seen in this example:
 * 
 * ```javascript
 * var blueThings = $CLS('blue');  // If you're unfamiliar with Firebolt, $CLS is Firebolt's alias for document.getElementsByClassName
 * console.log(blueThings.length); // -> 10 (for example)
 * 
 * var ncBlueThings = blueThings.removeClass('blue');
 * blueThings.length === 0;   // -> true (since now there are no elements with the 'blue' class)
 * ncBlueThing.length === 10; // -> true (since `removeClass` returned the NodeList as a NodeCollection)
 * ```
 * 
 * Returning a NodeCollection allows for correct functionality when chaining calls originally made on a NodeList,
 * but be aware that a live NodeList saved as a variable may be altered by these functions.
 * 
 * <u>__3.__</u>
 * Since it is not possible to manually create a new NodeList in JavaScript (there are tricks but
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
 * + union
 * + unique
 * + without
 * 
 * This, however, should not be worrisome since NodeCollections have all of the same functions as NodeLists
 * with the added benefits of being mutable and static (not live).
 * 
 * <u>__4.__</u>
 * Passing a NodeList (or HTMLCollection) as a parameter to the `NodeCollection#concat()` function will add the NodeList itself to
 * the collection instead of merging in its elements. This is because NodeLists and HTMLCollections don't directly inherit from
 * NodeCollection/Array (they are merely given some of their functions), so they are treated as objects instead of arrays. A simple
 * way to fix this is to call `.toNC()` on the NodeList/HTMLCollection when passing it as a parameter to `concat` like so:
 * 
 * ```javascript
 * var nodes = $QSA('div.special'),
 *     moreNodes = $TAG('p'),
 *     concatenation = nodes.concat( moreNodes.toNC() );
 * ```
 * <br />
 * 
 * @class NodeList
 * @see NodeCollection
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/NodeList | NodeList - Web API Interfaces | MDN}
 */

/* Give NodeLists and HTMLCollections many of the same prototype functions as NodeCollections */
Object.getOwnPropertyNames(NodeCollectionPrototype)
	.diff('clear length pop push shift splice unshift'.split(' ')) //These properties should not be added to the NodeList prototype
	.forEach(function(methodName) {
		if (!NodeListPrototype[methodName]) {
			var method = NodeCollectionPrototype[methodName];
			HTMLCollectionPrototype[methodName] = NodeListPrototype[methodName] = rgxDifferentNL.test(methodName) ? function() {
				return method.apply(ncFrom(this), arguments); // Convert to a NodeCollection first, then apply the method
			} : method; // Else directly copy the method
		}
	});

/**
 * Returns the specific node whose ID or, as a fallback, name matches the string specified by `name`.
 * 
 * @function NodeCollection#namedItem
 * @param {String} name
 * @returns {?Element}
 */
NodeListPrototype.namedItem = NodeCollectionPrototype.namedItem = function(name) {
	for (var i = 0, node; i < this.length; i++) {
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
 * @function NodeList#toNC
 * @returns {NodeCollection}
 */
// This function was added to the NodeList prototype in the loop above (because NodeCollection has this function too)

/*
 * NodeLists/HTMLCollections always contain unique elements, so theses are equivalent to calling
 * NodeCollection#toNC() on the NodeList/HTMLCollection.
 */
NodeListPrototype.uniq = HTMLCollectionPrototype.uniq = NodeCollectionPrototype.toNC;

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
 * @function Number#toPaddedString
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


//#region ============================ Object ================================

/**
 * @class Object
 * @classdesc The JavaScript Object class.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object|Object - JavaScript | MDN}
 */

/**
 * A generic iterator function for iterating over objects via their named properties.
 * Iteration can be cancelled by returning `false` in the callback.
 * 
 * @function Object.each
 * @param {Object} object - An object to iterate over.
 * @param {function(*, String, Object)} callback(value,key,object) - A function to be executed on each item.
 * @returns {Object} The input object.
 */
Object.each = function(obj, callback) {
	for (var i in obj) {
		if (callback.call(obj[i], obj[i], i, obj) === false) break;
	}

	return obj;
};

/**
 * Gets the passed in object's JavaScript [[class]].
 * 
 * @example
 * Object.getClassOf([]);       // -> "Array"
 * Object.getClassOf({});       // -> "Object"
 * Object.getClassOf(window);   // -> "Window"
 * Object.getClassOf('string'); // -> "String"
 * Object.getClassOf(/^.+reg/); // -> "RegExp"
 * Object.getClassOf(document.querySelectorAll('div')); // -> "NodeList"
 * 
 * @function Object.getClassOf
 * @param {*} obj - The object whose class will be retrieved.
 * @returns String - The passed in object's class name.
 */
Object.getClassOf = getClassOf;
function getClassOf(value) {
	if (value === _undefined) {
		return 'Undefined';
	}
	if (value === null) {
		return 'Null';
	}
	if ((value = specialElementsMap.toString.call(value).slice(8, -1)) == 'global' ||
		value == 'DOMWindow') { // 'DOMWindow' check is specifically for iOS 5.1
		return 'Window';
	}
	if (value == 'Document') {
		return 'HTMLDocument';
	}
	return value;
}

//#endregion Object


//#region ============================ String ================================

/**
 * @class String
 * @classdesc The JavaScript String class.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String|String - JavaScript | MDN}
 */

//Reuse the prototype extensions variable to hold an object of String extensions
prototypeExtensions = {
	/**
	 * Appends query string parameters to a URL.
	 *
	 * @function String#appendParams
	 * @param {String} params - Query string parameters.
	 * @returns {String} A reference to the string (chainable).
	 * @example
	 * var url = "www.google.com";
	 * url = url.appendParams('lang=en'); // -> "www.google.com?lang=en"
	 * url = url.appendParams('a=1&b=2'); // -> "www.google.com?lang=en&a=1&b=2"
	 */
	appendParams: function(params) {
		return this + (this.contains('?') ? '&' : '?') + params;
	},

	/**
	 * HTML-encodes the string by converting HTML special characters to their entity equivalents and returns the result.
	 * 
	 * @example
	 * '<img src="//somesite.com" />'.escapeHTML();  // -> '&lt;img src="//somesite.com" /&gt;'
	 * 
	 * @function String#escapeHTML
	 * @returns {String} The HTML-escaped text.
	 */
	escapeHTML: function() {
		return createElement('div').text(this).innerHTML;
	},

	/**
	 * Returns the string split into an array of substrings (tokens) that were separated by white-space.
	 *
	 * @function String#tokenize
	 * @returns {String[]} An array of tokens.
	 * @example
	 * var str = "The boy who lived.";
	 * str.tokenize(); // -> ["The", "boy", "who", "lived."]
	 */
	tokenize: function() {
		return this.match(/\S+/g) || [];
	},

	/**
	 * HTML-decodes the string by converting entities of HTML special characters to their normal form and returns the result.
	 * 
	 * @example
	 * '&lt;img src="//somesite.com" /&gt;'.unescapeHTML();  // -> '<img src="//somesite.com" />'
	 * 
	 * @function String#unescapeHTML
	 * @returns {String} The HTML-unescaped text.
	 */
	unescapeHTML: function() {
		return createElement('div').html(this).textContent;
	}
};


/* Add ES6 functions to String.prototype */

if (!StringPrototype.contains) {
	/**
	 * Determines whether the passed in string is in the current string.
	 *
	 * @function String#contains
	 * @param {String} searchString - The string to be searched for.
	 * @param {Number} [position=0] - The position in this string at which to begin the search.
	 * @returns {Boolean} `true` if this string contains the search string; else `false`.
	 * @example
	 * var str = "Winter is coming.";
	 * alert( str.contains(" is ") );    // true
	 * alert( str.contains("summer") );  // false
	 */
	prototypeExtensions.contains = function(searchString, position) {
		return this.toString().indexOf(searchString, position) >= 0;
	};
}

if (!StringPrototype.endsWith) {
	/**
	 * Determines if a string ends with the characters of another string.
	 *
	 * @function String#endsWith
	 * @param {String} searchString - The characters to be searched for at the end of this string.
	 * @param {Number} [position=this.length] - Search within this string as if this string were only this long;
	 * clamped within the range established by this string's length.
	 * @returns {Boolean} `true` if this string ends with `searchString`; else `false`.
	 * @example
	 * var str = "Who am I, Gamling?";
	 * alert( str.endsWith("Gamling?") );  // true
	 * alert( str.endsWith("am I") );      // false
	 * alert( str.endsWith("am I", 8) );   // true
	 */
	prototypeExtensions.endsWith = function(searchString, position) {
		var str = this.toString(),
			strLen = str.length;
		position = (position < strLen ? position : strLen) - searchString.length;
		return position >= 0 && str.indexOf(searchString, position) === position;
	};
}

if (!StringPrototype.repeat) {
	/**
	 * Copies the current string a given number of times and returns the new string.
	 *
	 * @function String#repeat
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
	prototypeExtensions.repeat = function(count) {
		count = Math.floor(count) || 0;
		if (!isFinite(count) || count < 0) {
			throw new RangeError('Invalid count value');
		}
		// Thanks to V8 for the algorithm: https://github.com/v8/v8-git-mirror/blob/master/src/harmony-string.js#L27
		var str = this.toString(),
			retStr = '';
		for (;;) {
			if (count & 1) retStr += str;
			count >>= 1;
			if (count === 0) return retStr;
			str += str;
		}
	};
}

if (!StringPrototype.startsWith) {
	/**
	 * Determines whether a string starts with the characters of another string.
	 *
	 * @function String#startsWith
	 * @param {String} searchString - The characters to be searched for at the start of this string.
	 * @param {Number} [position=0] - The position in this string at which to begin searching for `searchString`.
	 * @returns {Boolean} `true` if this string starts with the search string; else `false`.
	 * @example
	 * var str = "Who am I, Gamling?";
	 * alert( str.endsWith("Who") );      // true
	 * alert( str.endsWith("am I") );     // false
	 * alert( str.endsWith("am I", 4) );  // true
	 */
	prototypeExtensions.startsWith = function(searchString, position) {
		return this.toString().lastIndexOf(searchString, position = position || 0) === position;
	};
}

// Define the prototype properties on String.prototype
definePrototypeExtensionsOn(StringPrototype, prototypeExtensions);

//#endregion String


//#region ========================= Browser Fixes ============================

//Fix the `nextElementSibling` and `previousElementSibling` properties for ChildNodes in browsers than only support them on Elements
if (Firebolt.text()[nextElementSibling] === _undefined) {

	[CharacterData[prototype], DocumentType[prototype]].forEach(function(proto) {
		defineProperty(proto, nextElementSibling, {
			get: function() {
				var sibling = this;
				while ((sibling = sibling.nextSibling) && sibling.nodeType !== 1);
				return sibling;
			}
		});
		defineProperty(proto, previousElementSibling, {
			get: function() {
				var sibling = this;
				while ((sibling = sibling.previousSibling) && sibling.nodeType !== 1);
				return sibling;
			}
		});
	});

}

//Fix the parentElement property for Nodes in browsers than only support it on Element
if (document.parentElement === _undefined) {

	defineProperty(NodePrototype, 'parentElement', {
		get: function() {
			var parent = this.parentNode;
			return parent && isNodeElement(parent) ? parent : null;
		}
	});

}

//#endregion Browser Compatibility and Speed Boosters

})(self, document, Array, Object, decodeURIComponent, encodeURIComponent, getComputedStyle, parseFloat, setTimeout, clearTimeout); //self === window
