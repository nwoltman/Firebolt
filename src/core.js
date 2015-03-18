/*!
 * Firebolt core file
 * @version 0.13.0
 * @author Nathan Woltman
 * @copyright 2014-2015 Nathan Woltman
 * @license MIT https://github.com/woollybogger/Firebolt/blob/master/LICENSE.txt
 */

/**
 * The Firebolt core module.
 * @module core
 */

/* exported UNDEFINED */
/* exported definePrototypeExtensionsOn */
/* exported getFirstSetEachElement */
/* exported isNodeElement */
/* exported push1 */
/* exported typeofString */
/* exported usesWebkit */
/* exported usesGecko */
/* exported prototype */
/* exported ElementPrototype */
/* exported HTMLElementPrototype */
/* exported NodePrototype */
/* exported NodeCollectionPrototype */
/* exported isArray */
/* exported arrayFrom */
/* exported defineProperty */
/* exported iframe */
/* exported bodyEl */
/* exported timestamp */
/* exported prototypeExtensions */
/* exported Firebolt */
/* exported createElement */
/* exported extend */
/* exported isEmptyObject */
/* exported isPlainObject */
/* exported getClassOf */

(function(
  window,
  document,
  Object,
  Array,
  // CLOSURE_GLOBALS
  UNDEFINED
) {
  'use strict';

  //#region =========================== Private ================================

  /*
   * Function for appending a node to a reference node.
   */
  function append(newNode, refNode) {
    refNode.appendChild(newNode);
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
   * Returns a function that creates a set of elements in a certain direction around
   * a given node (i.e. parents, children, siblings, find -> all descendants).
   * 
   * @param {Function} getDirectionElement - A function that retrieves an element or elements for a single node.
   * @param {Function|Number} [sorter] - A function used to sort the union of multiple sets of returned elements.
   *     If sorter == 0, return an 'until' Node function.
   */
  function getGetDirElementsFunc(getDirectionElement, sorter) {
    if (sorter) {
      // For NodeCollection.prototype
      return function() {
        var len = this.length;

        // Simple and speedy for one node
        if (len === 1) {
          return getDirectionElement.apply(this[0], arguments);
        }

        // Build a list of NodeCollections
        var collections = [];
        for (var i = 0; i < len; i++) {
          collections[i] = getDirectionElement.apply(this[i], arguments);
        }

        // Union the collections so that the result contains unique elements and return the sorted result
        return ArrayPrototype.union.apply(NodeCollectionPrototype, collections).sort(sorter);
      };
    }

    // For Node.prototype
    return sorter === 0
      // nextUntil, prevUntil, parentsUntil
      ? function(until, filter) {
        var nc = new NodeCollection();
        var node = this;
        var stop =
          typeofString(until) // Until match by CSS selector
            ? function() {
              return node.matches(until);
            }
            : until && until.length // Until Node[] contains the current node
              ? function() {
                return until.indexOf(node) >= 0;
              }
              // Until nodes are equal (or if `until.length === 0`, this will always return false)
              : function() {
                return node === until;
              };

        // Traverse all nodes in the direction and add them (or if there is a selector the ones that match it)
        // to the NodeCollection until the `stop()` function returns `true`
        while ((node = getDirectionElement(node)) && !stop()) {
          if (!filter || node.matches(filter)) {
            push1(nc, node);
          }
        }

        return nc;
      }

      // nextAll, prevAll, parents
      : function(selector) {
        var nc = new NodeCollection();
        var node = this;

        // Traverse all nodes in the direction and add them (or if there is a selector the ones that match it)
        // to the NodeCollection
        while (node = getDirectionElement(node)) {
          if (!selector || node.matches(selector)) {
            push1(nc, node);
          }
        }

        return nc;
      };
  }

  /*
   * Returns a function for Node#next(), Node#prev(), NodeCollection#next(), or NodeCollection#prev().
   * 
   * @param {Function} getDirElementSibling - Either `getNextElementSibling` or `getPreviousElementSibling`.
   * @param {Boolean} [forNode=false] - If truthy, returns the function for Node.prototype,
   *     otherwise the function for NodeCollection.prototype is returned.
   */
  function getNextOrPrevFunc(getDirElementSibling, forNode) {
    return forNode
      ? function(selector) {
        var sibling = getDirElementSibling(this);
        return (!selector || sibling && sibling.matches(selector)) ? sibling : null;
      }
      : function(selector) {
        var nc = new NodeCollection();
        for (var i = 0, sibling; i < this.length; i++) {
          sibling = getDirElementSibling(this[i]);
          if (sibling && (!selector || sibling.matches(selector))) {
            push1(nc, sibling);
          }
        }
        return nc;
      };
  }

  /*
   * Takes in the input from `.wrapWith()` or `.wrapInner()` and returns a new
   * element (or null/undefined) to be the wrapping element.
   */
  function getWrappingElement(input) {
    if (typeofString(input)) {
      input = $1(input);
    } else if (!input.nodeType) { // Element[]
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
   * Takes in an Array constructor and polyfills Array.from() and Array.of() if they
   * do not already exist and returns the polyfilled version of Array.from().
   * 
   * @param {function} - The Array or NodeCollection constructor function.
   * @returns {function} - The created `from` function.
   */
  function setArrayStaticsAndGetFromFunction(constructor) {
    function from(arrayLike) {
      var len = arrayLike.length || 0;
      var array = new constructor(len);

      for (var i = 0; i < len; i++) {
        array[i] = arrayLike[i];
      }

      return array;
    }

    constructor.of = constructor.of || function() {
      var len = arguments.length;
      var array = new constructor(len);

      for (var i = 0; i < len; i++) {
        array[i] = arguments[i];
      }

      return array;
    };

    constructor.from = constructor.from || from;

    return from;
  }

  function typeofString(value) {
    return typeof value == 'string';
  }

    // Used for subclassing Array and determining things about the browser
  var iframe = createElement('iframe');
  var bodyEl = createElement('body');

    // Browser/Engine detection
  var isIOS = /^iP/.test(navigator.platform); // iPhone, iPad, iPod
  var usesWebkit = iframe.style.webkitAppearance !== UNDEFINED;
  var webkitNotIOS = usesWebkit && !isIOS;
  var usesGecko = window.mozInnerScreenX != UNDEFINED;

    // Some browser compatibility functions
  var characterData = document.createTextNode('');
  var getNextElementSibling =
    (characterData.nextElementSibling === UNDEFINED)
      ? function(el) {
        while ((el = el.nextSibling) && el.nodeType !== 1);
        return el;
      }
      : function(el) {
        return el.nextElementSibling;
      };
  var getPreviousElementSibling =
    (characterData.previousElementSibling === UNDEFINED)
      ? function(el) {
        while ((el = el.previousSibling) && el.nodeType !== 1);
        return el;
      }
      : function(el) {
        return el.previousElementSibling;
      };
  var getParentElement =
    (characterData.parentElement === UNDEFINED)
      ? function(el) {
        el = el.parentNode;
        return el && isNodeElement(el) ? el : null;
      }
      : function(el) {
        return el.parentElement;
      };

    /*
     * Determines if an item is a Node.
     * Gecko's instanceof Node is faster (but might want to check if that's because it caches previous calls).
     */
  var isNode = usesGecko
    ? function(obj) {
      return obj instanceof Node;
    }
    : function(obj) {
      return obj && obj.nodeType;
    };

    // Property strings
  var prototype = 'prototype';

    // Prototype references
  var ArrayPrototype = Array[prototype];
  var ElementPrototype = Element[prototype];
  var HTMLElementPrototype = HTMLElement[prototype];
  var NodePrototype = Node[prototype];
  var NodeListPrototype = NodeList[prototype];
  var HTMLCollectionPrototype = HTMLCollection[prototype];

    // Helpers
  var isArray = Array.isArray;
  var arrayFrom = setArrayStaticsAndGetFromFunction(Array);
  var array_push = ArrayPrototype.push;
  var defineProperty = Object.defineProperty; // jshint ignore:line

    // Local + global selector funtions
  var getElementById = window.$$ = window.$ID =
    webkitNotIOS ? function(id) {
      return document.getElementById(id);
    } : getElementSelectionFunction(document.getElementById);

  var getElementsByClassName = window.$CLS =
    webkitNotIOS ? function(className) {
      return document.getElementsByClassName(className);
    } : getElementSelectionFunction(document.getElementsByClassName);

  var getElementsByTagName = window.$TAG =
    webkitNotIOS ? function(tagName) {
      return document.getElementsByTagName(tagName);
    } : getElementSelectionFunction(document.getElementsByTagName);

  var querySelector = window.$QS =
    webkitNotIOS ? function(selector) {
      return document.querySelector(selector);
    } : getElementSelectionFunction(document.querySelector);

  var querySelectorAll = window.$QSA =
    webkitNotIOS ? function(selector) {
      return document.querySelectorAll(selector);
    } : getElementSelectionFunction(document.querySelectorAll);


    /* Pre-built RegExps */

  var rgxNotId = /[ .,>:[+~\t-\f]/; // Matches other characters that cannot be in an id selector

  var rgxNotClass = /[ #,>:[+~\t-\f]/; // Matches other characters that cannot be in a class selector

  var rgxAllDots = /\./g;

  var rgxNotTag = /\W/; // Matches a CSS selector that is not selecting by a single tag

  var rgxFirstTag = /<(\w+)/; // Matches the first tag in an HTML string

  var rgxSingleTag = /^<([\w-]+)\s*\/?>(?:<\/\1>)?$/; // Matches a single HTML tag such as "<div/>"

  var rgxSpaceChars = /[ \t-\f]+/; // From W3C http://www.w3.org/TR/html5/single-page.html#space-characte;

    // Determines if the function is different for NodeLists
  var rgxDifferentNL = /^(?:af|ap|be|conc|cop|ea|fill|ins|prep|pu|rep|rev|sor|toggleC)|wrap|remove(?:Class)?$/;

    /* Needed for parsing HTML */
  var optData = [1, '<select multiple>', '</select>'];
  var tableData = [1, '<table>', '</table>'];
  var cellData = [3, '<table><tbody><tr>', '</tr></tbody></table>'];
  var specialElementsMap = {
    option: optData,
    optgroup: optData,
    thead: tableData,
    tbody: tableData,
    tfoot: tableData,
    colgroup: tableData,
    caption: tableData,
    tr: [2, '<table><tbody>', '</tbody></table>'],
    col: [2, '<table><colgroup>', '</colgroup></table>'],
    td: cellData,
    th: cellData
  };

    /* Misc */
  var timestamp = Date.now();
  var readyCallbacks = [];

  //#region MODULE_VARS
  //#endregion MODULE_VARS

  //#endregion Private


  //#region ============================ Array =================================

  /**
   * @class Array
   * @classdesc The native JavaScript Array object.
   * @augments Object
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array|Array - JavaScript | MDN}
   */

  /**
   * @summary Creates a new Array instance from an array-like object.
   * 
   * @description
   * This is a partial polyfill for the ES6-defined
   * {@linkcode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from|Array.from()}
   * function that only accepts array-like objects and does not support the optional `mapFn` or `thisArg` arguments.
   * 
   * Firebolt will not alter `Array.from` if it is already implemented by the browser. Furthermore, since Firebolt
   * implements a subset of the ES6-defined functionality, code that works with Firebolt's shim will also work when
   * browsers natively implement `Array.from`, so your code will be future-proof.
   * 
   * @function Array.from
   * @param {Object} arrayLike - An array-like object to convert to an array.
   * @returns {Array}
   */

   /**
    * @summary Creates a new Array instance with a variable number of arguments.
    * 
    * @description
    * This is a complete polyfill for the ES6-defined
    * {@linkcode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/of|Array.of()}
    * for browsers that have not implemented it function yet.
    * 
    * @function Array.of
    * @param {...*} elementN - Elements with which to populate the new array.
    * @returns {Array}
    */

  var prototypeExtensions = {
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
     * @summary Executes a function on each item in the array.
     * 
     * @description
     * A generic iterator function is similar to `Array#forEach()` but with the following differences:
     * 
     * 1. `this` always refers to the current item in the iteration (the `value` argument to the callback).
     * 2. Returning `false` in the callback will cancel the iteration (similar to a `break` statement).
     * 3. The array is returned to allow for function chaining.
     * 4. The callback __is__ invoked for indexes that have been deleted or elided.
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
     * Determines if the array includes a certain element.
     * 
     * @function Array#includes
     * @param {*} searchElement - The element to search for.
     * @param {Number} [fromIndex=0] - The index in this array at which to begin the search.
     * @returns {Boolean} `true` if the item is in the array, `false` otherwise.
     */
    includes: ArrayPrototype.includes || function() {
      return ArrayPrototype.indexOf.apply(this, arguments) >= 0;
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
      var union = this.uniq();
      var j;
      var array;

      for (var i = 0; i < arguments.length; i++) {
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

  /* VARS END */

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
        var cleaned = new constructor();

        for (var i = 0; i < this.length; i++) {
          if (!Firebolt.isEmpty(this[i])) {
            push1(cleaned, this[i]);
          }
        }

        return cleaned;
      },

      /**
       * Returns a new array with all of the values of this array that are not in
       * any of the input arrays (performs a set difference).
       * 
       * @example
       * [1, 2, 3, 4, 5].diff([5, 2, 10]); // -> [1, 3, 4]
       * 
       * @function Array#diff
       * @param {...Array} *arrays - A variable number of arrays or array-like objects.
       * @returns {Array}
       */
      diff: function() {
        var difference = new constructor();
        var i = 0;
        var j;
        var k;
        var item;
        var array;

        next: for (; i < this.length; i++) {
          item = this[i];

          for (j = 0; j < arguments.length; j++) {
            array = arguments[j];

            for (k = 0; k < array.length; k++) {
              if (array[k] === item) {
                continue next;
              }
            }
          }

          // The item was not part of any of the input arrays so it can be added to the difference array
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
        var intersection = new constructor();
        var i = 0;
        var j;
        var item;

        next: for (; i < this.length; i++) {
          // The current item can only be added if it is not already in the intersection
          if (intersection.indexOf(item = this[i]) < 0) {

            // If the item is not in every input array, continue to the next item
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
       *     a faster algorithm will be used to create the unique array.
       * @returns {Array}
       */
      uniq: function(isSorted) {
        var unique = new constructor();

        for (var i = 0; i < this.length; i++) {
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
        var array = new constructor();
        var i = 0;
        var j;

        next: for (; i < this.length; i++) {
          for (j = 0; j < arguments.length; j++) {
            if (arguments[j] === this[i]) {
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
   * @classdesc
   * The HTML DOM Element interface.
   * 
   * It should be noted that all functions that do not have a specified return value,
   * return the calling object, allowing for function chaining.
   * @augments Node
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/element|Element - Web API Interfaces | MDN}
   */

  /**
   * Sets an attribute on an element to the specified value, or removes
   * the attribute if the value is `null` or `undefined`.
   * 
   * @private
   * @param {Element} element - A DOM element.
   * @param {String} key - The name of the attribute.
   * @param {?String} value - The value to set the attribute to.
   *     If `null` or `undefined`, the attribute is removed.
   */
  function setAttribute(element, key, value) {
    if (value != UNDEFINED) {
      element.setAttribute(key, value);
    } else {
      element.removeAttribute(key);
    }
  }

  /**
   * Returns a list of the elements within the element with the specified class name.<br />
   * Alias of `Element.getElementsByClassName()`.
   * 
   * @function Element#CLS
   * @param {String} className
   * @returns {HTMLCollection|NodeList} A collection of elements with the specified class name.
   */
  ElementPrototype.CLS = ElementPrototype.getElementsByClassName;

  /**
   * Returns a list of the elements within the element with the specified tag name.<br />
   * Alias of `Element.getElementsByTagName()`.
   * 
   * @function Element#TAG
   * @param {String} tagName
   * @returns {HTMLCollection|NodeList} A collection of elements with the specified tag name.
   */
  ElementPrototype.TAG = ElementPrototype.getElementsByTagName;

  /**
   * Returns the first element within the element that matches the specified CSS selector.<br />
   * Alias of `Element.querySelector()`.
   * 
   * @function Element#QS
   * @param {String} selector
   * @returns {?Element}
   */
  ElementPrototype.QS = ElementPrototype.querySelector;

  /**
   * Returns a list of the elements within the element that match the specifed CSS selector.<br />
   * Alias of `Element.querySelectorAll()`.
   * 
   * @function Element#QSA
   * @param {String} selector
   * @returns {NodeList} A list of selected elements.
   */
  ElementPrototype.QSA = ElementPrototype.querySelectorAll;

  /*
   * More performant version of Node#afterPut for Elements.
   * @see Node#afterPut
   */
  ElementPrototype.afterPut = function() {
    for (var i = arguments.length - 1, arg; i >= 0; i--) {
      if (typeofString(arg = arguments[i])) {
        this.insertAdjacentHTML('afterend', arg);
      } else {
        insertAfter(isNode(arg) ? arg : createFragment(arg), this);
      }
    }

    return this;
  };

  /*
   * More performant version of Node#appendWith for Elements.
   * @see Node#appendWith
   */
  ElementPrototype.appendWith = function() {
    for (var i = 0, arg; i < arguments.length; i++) {
      if (typeofString(arg = arguments[i])) {
        this.insertAdjacentHTML('beforeend', arg);
      } else {
        this.appendChild(isNode(arg) ? arg : createFragment(arg));
      }
    }

    return this;
  };

  /*
   * More performant version of Node#beforePut for Elements.
   * @see Node#beforePut
   */
  ElementPrototype.beforePut = function() {
    for (var i = 0, arg; i < arguments.length; i++) {
      if (typeofString(arg = arguments[i])) {
        this.insertAdjacentHTML('beforebegin', arg);
      } else {
        insertBefore(isNode(arg) ? arg : createFragment(arg), this);
      }
    }

    return this;
  };

  /**
   * Gets the value of the element's specified attribute.
   * 
   * @function Element#attr
   * @variation 1
   * @param {String} attribute - The name of the attribute who's value you want to get.
   * @returns {?String} The value of the attribute. If the element does not have the specified
   *     attribute, `null` is returned.
   */
  /**
   * @summary Sets the element's specified attribute.
   * 
   * @description
   * If the `value` argument is specified and is `null` or `undefined`, the specified attribute is removed.
   * 
   * @function Element#attr
   * @variation 2
   * @param {String} attribute - The name of the attribute who's value should be set.
   * @param {String|Number} value - The value to set the specified attribute to.
   */
  /**
   * @summary Sets the specified attributes of the element.
   * 
   * @description
   * If a value in the `attributes` object is `null` or `undefined`, the attribute is removed from the element.
   * 
   * @function Element#attr
   * @variation 3
   * @param {Object} attributes - An object of attribute-value pairs.
   */
  ElementPrototype.attr = function(attribute, value) {
    if (arguments.length < 2) {
      if (typeofString(attribute)) {
        return this.getAttribute(attribute); // Get
      }

      for (var a in attribute) {
        setAttribute(this, a, attribute[a]); // Set multiple
      }
    } else {
      setAttribute(this, attribute, value); // Set single
    }

    return this;
  };

  /**
   * Removes all of the element's child nodes.
   * 
   * @example
   * // HTML (before)
   * // <div id="mydiv">
   * //   <span>Inside Span</span>
   * //   Some Text
   * // </div>
   * 
   * // JavaScript
   * $$('mydiv').empty();
   *
   * // HTML (after)
   * // <div id="mydiv"></div>
   * 
   * @function Element#empty
   */
  ElementPrototype.empty = function() {
    while (this.firstChild) {
      this.removeChild(this.firstChild);
    }

    return this;
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
   *     descendant elements against.
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
   * Gets the element's inner HTML.
   * 
   * @function Element#html
   * @returns {String} The element's inner HTML.
   */
  /**
   * Sets the element's inner HTML.
   * 
   * __ProTip:__ Quite often, this function is used to set the text contents of elements. However, if the text being
   * set does not (or should not) contain any actual HTML, the {@linkcode Node#text|Node#text()} function should be
   * used instead as it will be faster and also prevent unwanted HTML from being injected into the page.
   * 
   * @function Element#html
   * @param {String} htmlString
   */
  ElementPrototype.html = function(htmlString) {
    if (htmlString === UNDEFINED) {
      return this.innerHTML; // Get
    }
    this.innerHTML = htmlString; // Set

    return this;
  };

  /**
   * Determines if the element matches the specified CSS selector.
   * 
   * @function Element#matches
   * @param {String} selector - A CSS selector string.
   * @returns {Boolean} `true` if the element matches the selector; else `false`.
   */
  ElementPrototype.matches = ElementPrototype.matches ||
                             ElementPrototype.webkitMatchesSelector ||
                             ElementPrototype.mozMatchesSelector ||
                             ElementPrototype.msMatchesSelector ||
                             ElementPrototype.oMatchesSelector;

  /*
   * More performant version of Node#prependWith for Elements.
   * @see Node#prependWith
   */
  ElementPrototype.prependWith = function() {
    for (var i = arguments.length - 1, arg; i >= 0; i--) {
      if (typeofString(arg = arguments[i])) {
        this.insertAdjacentHTML('afterbegin', arg);
      } else {
        prepend(isNode(arg) ? arg : createFragment(arg), this);
      }
    }

    return this;
  };

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
    if (value === UNDEFINED) {
      if (typeofString(prop)) {
        return this[prop]; // Get
      }
      extend(this, prop); // Set multiple
    } else {
      this[prop] = value; // Set single
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
   * 
   * @property {Object} fn - Alias for `{@link NodeCollection}.prototype`.
   */

  /**
   * @summary
   * Firebolt's multi-use selector function. Can also be referenced by the synonyms <code>FB</code> and
   * <code>$</code> (if <code>$</code> has not already been defined).
   * 
   * @description
   * Returns a list of the elements either found in the DOM that match the passed in CSS selector or
   * created by passing an HTML string.
   * 
   * __Note #1:__ This function will only consider the input string an HTML string if the first character of the
   * string is the opening tag character ("<"). If you want to parse an HTML string that does not begin with
   * "<", use {@linkcode Firebolt.parseHTML|$.parseHTML()});
   * 
   * __Note #2:__ Since Firebolt does not use Sizzle as a CSS selector engine, only standard CSS selectors may be used.
   * 
   * __ProTip:__ When creating a single element, it's a better idea to use the {@linkcode Firebolt.elem|$.elem()}
   * function since it maps directly to the native `document.createElement()` function (making it much faster) and
   * gives you the option to pass in an object of attributes to be set on the newly created element.
   * 
   * @example
   * Firebolt('div, span');   // Returns a NodeCollection of all div and span elements
   * $('button.btn-success'); // Returns a NodeCollection of all button elements with the class "btn-success"
   * $('<p>content</p><br>'); // Creates DOM nodes and returns them in a NodeCollection ([<p>content</p>, <br>])
   * $.elem('div');           // Calls Firebolt's method to create a new div element 
   * 
   * @global
   * @variation 2
   * @function Firebolt
   * @param {String} string - A CSS selector string or an HTML string.
   * @returns {NodeCollection} A NodeCollection of selected elements or newly created elements.
   * @throws {SyntaxError} When the passed in string is not an HTML string (does not start with the "<" character)
   *     and is an invalid CSS selector.
   */
  function Firebolt(selector) {
    var firstChar = selector[0];
    var nc, el; // Used in selecting elements by ID

    if (firstChar === '.') { // Check for a single class name
      if (!rgxNotClass.test(selector)) {
        return ncFrom(getElementsByClassName(selector.slice(1).replace(rgxAllDots, ' ')));
      }
    } else if (firstChar === '#') { // Check for a single ID
      if (!rgxNotId.test(selector)) {
        nc = new NodeCollection();
        if (el = getElementById(selector.slice(1))) {
          nc[0] = el;
        }
        return nc;
      }
    } else if (firstChar === '<') { // Check if the string is a HTML string
      return parseHTML(selector);
    } else if (!rgxNotTag.test(selector)) { // Check for a single tag name
      return ncFrom(getElementsByTagName(selector));
    }

    // If we could not select by class name, ID, or tag name or parse HTML, use querySelectorAll
    return ncFrom(querySelectorAll(selector));
  }

  /**
   * Creates a new element with the specified tag name and attributes (optional).<br />
   * Partially an alias of `document.createElement()`.
   * 
   * @function Firebolt.elem
   * @param {String} tagName
   * @param {Object} [attributes] - The JSON-formatted attributes that the element should have once constructed.
   * @returns {Element}
   */
  function createElement(tagName, attributes) { // jshint ignore:line
    var el = document.createElement(tagName);
    return attributes ? el.attr(attributes) : el;
  }
  Firebolt.elem = createElement;

  /* The key where Firebolt stores data using $.data() */
  Firebolt.expando = 'FB' + Date.now() + 1 / Math.random();

  /**
   * @summary Merge the contents of one or more objects into the first object.
   * 
   * @description __Warning:__ Providing `false` for the `deep` argument is not supported.
   * 
   * @function Firebolt.extend
   * @param {Boolean} [deep] - If `true`, the merge becomes recursive (performs a deep copy).
   * @param {Object} target - The object that will receive the new properties.
   * @param {...Object} objectN - One or more objects whose properties will be added to the `target` object.
   * @returns {Object} The `target` object.
   */
  function extend() { // jshint ignore:line
    var deep = (arguments[0] === true);
    var i = 1;
    var target = arguments[deep ? i++ : 0];
    var arg;
    var key;
    var val;
    var curval;

    for (; i < arguments.length; i++) {
      arg = arguments[i];

      for (key in arg) {
        val = arg[key];
        if (val === UNDEFINED)
          continue;

        if (deep) {
          curval = target[key];

          // If the values are not already the same and the new value is not the
          // target (prevents endless recursion), set the new value on the target
          if (curval !== val && val !== target) {
            // Deep-extend arrays and plain objects
            if (isArray(val)) {
              target[key] = extend(true, isArray(curval) ? curval : [], val);
            } else if (isPlainObject(val)) {
              target[key] = extend(true, isPlainObject(curval) ? curval : {}, val);
            } else {
              target[key] = val;
            }
          }
        } else {
          target[key] = val;
        }
      }
    }

    return target;
  }
  Firebolt.extend = extend;

  /**
   * Creates a new DocumentFragment and (optionally) appends the passed in content to it.
   * 
   * @function Firebolt.frag
   * @param {...(String|Node|Node[])} [content] - One or more HTML strings, nodes, or collections
   *     of nodes to append to the fragment.
   * @returns {DocumentFragment} The newly created document fragment.
   */
  function createFragment() {
    var fragment = document.createDocumentFragment();
    var i = 0;
    var item;
    var len;
    var j;

    for (; i < arguments.length; i++) {
      if (isNode(item = arguments[i])) {
        fragment.appendChild(item);
      } else {
        if (typeofString(item)) {
          // Pass in the 1 to tell parseHTML it doesn't need to detach the returned nodes
          // from their creation container (because this function will do that)
          item = parseHTML(item, document, 0, 1);
        }

        if (len = item.length) {
          fragment.appendChild(item[0]);
          if (item.length < len) { // If the item is a live NodeList/HTMLCollection
            while (item.length) {
              fragment.appendChild(item[0]);
            }
          } else {
            for (j = 1; j < len; j++) {
              fragment.appendChild(item[j]);
            }
          }

        }
      }
    }

    return fragment;
  }
  Firebolt.frag = createFragment;

  /**
   * Executes some JavaScript code globally.
   * 
   * @function Firebolt.globalEval
   * @param {String} code - The JavaScript code to execute.
   */
  Firebolt.globalEval = function(code) {
    document.head.appendChild(
      createElement('script').prop('text', code)
    ).remove();
  };

  /**
   * Determines if the passed in value is considered empty. The value is considered empty if it is one of the following:
   * 
   * + `null`
   * + `undefined`
   * + a zero-length string, array, NodeList, HTMLCollection, or NodeCollection
   * + an empty object (if the value has the "Object" class and {@linkcode Firebolt.isEmptyObject} returns `true`)
   * 
   * @function Firebolt.isEmpty
   * @param {*} value - The value to be tested.
   * @returns {Boolean} - `true` if the object is deemed empty, `false` otherwise.
   */
  Firebolt.isEmpty = function(value, className) {
    return value == UNDEFINED || (
      isArray(value) || typeofString(value) ||
      (className = getClassOf(value)) == 'NodeList' || className == 'HTMLCollection'
        ? !value.length
        : className == 'Object' && isEmptyObject(value)
    );
  };

  /**
   * Determines if an object is empty (contains no enumerable properties).
   * 
   * @function Firebolt.isEmptyObject
   * @param {Object} object - The object to be tested.
   * @returns {Boolean}
   */
  function isEmptyObject(object) {
    for (object in object) {
      return false;
    }
    return true;
  }
  Firebolt.isEmptyObject = isEmptyObject;

  /**
   * Determines if a variable is a plain object.
   * 
   * @function Firebolt.isPlainObject
   * @param {*} obj - The item to test.
   */
  function isPlainObject(obj) {
    return obj && (obj = obj.constructor) && obj.toString().trim().slice(9, 16) == 'Object(';
  }
  Firebolt.isPlainObject = isPlainObject;

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
   * @param {Boolean} [single] - If truthy, returns only a single Node instead of a NodeCollection. If this parameter
   *     is specified, you must also pass in a value for `context` (but it can just be falsy to use the default value).
   * @returns {NodeCollection|Node} The collection of created nodes (or single Node if `single` was truthy).
   */
  function parseHTML(html, context, single, /*INTERNAL*/ doNotDetachNodes) {
    var tag = rgxSingleTag.exec(html);
    var elem, collection, i;

    if (tag) {
      elem = (context || document).createElement(tag[1]);
      return single ? elem : NodeCollection.of(elem);
    }

    // Parse the HTML, taking care to handle special elements
    elem = context ? context.createElement('body') : bodyEl;
    collection = rgxFirstTag.exec(html);
    if (collection && (collection = specialElementsMap[collection[1]])) {
      elem.innerHTML = collection[1] + html + collection[2];
      i = collection[0];
      while (i--) {
        elem = elem.firstChild;
      }
    } else {
      elem.innerHTML = html;
    }

    if (single) {
      // When returning a single element, it should always be removed from its creation parent
      return elem.removeChild(elem.firstChild);
    }

    return doNotDetachNodes ? elem.childNodes : ncFrom(elem.childNodes).remove();
  }
  Firebolt.parseHTML = parseHTML;

  /**
   * Specify a function to execute when the DOM is fully loaded.<br />
   * Executes the function immediately (synchronously) if the DOM has already finished loading.
   * 
   * @function Firebolt.ready
   * @param {Function} callback - A function to execute once the DOM has been loaded.
   */
  Firebolt.ready = function(callback) {
    if (readyCallbacks && document.readyState != 'complete') {
      if (!readyCallbacks.length) {
        document.addEventListener('DOMContentLoaded', function() {
          for (var i = 0; i < readyCallbacks.length; i++) {
            readyCallbacks[i]();
          }
          readyCallbacks = UNDEFINED; // Undefine the callbacks array to indicate that the ready event has fired
        });
      }
      readyCallbacks.push(callback);
    } else {
      callback();
    }
  };

  /**
   * Creates a TextNode from the provided string.
   * 
   * @function Firebolt.text
   * @param {String} text - The string used to construct the TextNode.
   * @returns {TextNode}
   */
  Firebolt.text = function(text) {
    return document.createTextNode(text === UNDEFINED ? '' : text);
  };

  //#endregion Firebolt


  //#region =========================== Globals ================================

  /*
   * Global Firebolt references.
   */
  window.FB = window.Firebolt = Firebolt;
  if (window.$ === UNDEFINED) {
    window.$ = Firebolt;
  }

  /**
   * Returns the first element within the document with the specified ID.
   * Can also be called by the alias `$ID()`.<br />
   * Alias of `document.getElementById()`.
   * 
   * @global
   * @function $$
   * @param {String} id - A case-sensitive string representing the unique ID of the element being sought.
   * @returns {?Element} The element with the specified ID or `null` if there is no such element in the document.
   */

  /**
   * Returns the first element within the document that matches the specified
   * CSS selector or the element created from the input HTML string.
   * 
   * Basically the same thing as `$()`, but only dealing with a single element.
   * 
   * @example
   * $1('button.btn-success'); // Returns the first <button> element with the class "btn-success"
   * $1('<p>content</p>');     // Creates a new <p> element containing the string "content".
   * 
   * @global
   * @function $1
   * @param {String} string - A CSS selector string or an HTML string.
   * @returns {?Element} - The selected element (or `null` if no element matched the selector) or the created element.
   * @throws {SyntaxError} When the passed in string is not an HTML string (does not start with the "<" character)
   *     and is an invalid CSS selector.
   */
  window.$1 = function(selector) {
    var firstChar = selector[0];

    if (firstChar === '.') { // Check for a single class name
      if (!rgxNotClass.test(selector)) {
        return getElementsByClassName(selector.slice(1).replace(rgxAllDots, ' '))[0];
      }
    } else if (firstChar === '#') { // Check for a single id
      if (!rgxNotId.test(selector)) {
        return getElementById(selector.slice(1));
      }
    } else if (firstChar === '<') { // Check if the string is a HTML string
      return parseHTML(selector, document, 1); // The 1 tells parseHTML to return only one node
    } else if (!rgxNotTag.test(selector)) { // Check for a single tag name
      return getElementsByTagName(selector)[0];
    }

    // If we could not select by class name, ID, or tag name or parse HTML, use querySelector
    return querySelector(selector);
  };

  /**
   * Returns a list of the elements within the document with the specified class name.<br />
   * Alias of `document.getElementsByClassName()`.
   * 
   * @global
   * @function $CLS
   * @param {String} className
   * @returns {HTMLCollection} A set of elements with the specified class name.
   */

  /**
   * Returns the first element within the document with the specified ID.
   * Can also be called by the alias `$$()`.<br />
   * Alias of `document.getElementById()`.
   * 
   * @global
   * @function $ID
   * @param {String} id - A case-sensitive string representing the unique ID of the element being sought.
   * @returns {?Element} The element with the specified ID or `null` if there is no such element in the document.
   */

  /**
   * Returns a set of the elements within the document with the specified name attribute.<br />
   * Alias of `document.getElementsByName()`.
   * 
   * @global
   * @function $NAME
   * @param {String} name
   * @returns {HTMLCollection|NodeList} A collection of elements with the specified name attribute.
   */
  window.$NAME = function(name) {
    return document.getElementsByName(name);
  };

  /**
   * Returns the first element within the document that matches the specified CSS selector.<br />
   * Alias of `document.querySelector()`.
   * 
   * @global
   * @function $QS
   * @param {String} selector
   * @returns {?Element}
   */

  /**
   * Returns all elements within the document that match the specified CSS selector.<br />
   * Alias of `document.querySelectorAll()`.
   * 
   * @global
   * @function $QSA
   * @param {String} selector
   * @returns {NodeList}
   */

  /**
   * Returns a set of the elements within the document with the specified tag name.<br />
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
   * 
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
   * 
   * It should be noted that all functions that do not have a specified return value,
   * return the calling object, allowing for function chaining.
   * @augments Element
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement|HTMLElement - Web API Interfaces | MDN}
   */

  /**
   * Adds the specified class(es) to the element.
   * 
   * @function HTMLElement#addClass
   * @param {String} className - One or more classes separated by a single space to be
   *     added to the element's class attribute.
   * @throws {TypeError} The input `value` must be string. __Note:__ This error will not be thrown if `value` is not
   *     a string and is truthy and the element does not have a `class` value at the time of invocation.
   */
  HTMLElementPrototype.addClass = function(value) {
    if (value) {
      // Only need to determine which classes should be added if this element's className has a value
      if (this.className) {
        var newClasses = value.split(' ');
        var changed = 0;
        var i = 0;
        var clazz;

        value = this.className; // Reuse the value argument to build the new class name

        for (; i < newClasses.length; i++) {
          clazz = newClasses[i];
          if (clazz && !this.hasClass(clazz)) {
            value += ' ' + clazz;
            changed = 1;
          }
        }

        if (!changed) { // Avoid DOM manipulation if the class name will not be changed
          return this;
        }
      }

      // Set the new value
      this.className = value;
    }

    return this;
  };

  /**
   * Determines if the element's class list has the specified class name.
   * 
   * @function HTMLElement#hasClass
   * @param {String} className - A string containing a single class name.
   * @returns {Boolean} `true` if the class name is in the element's class list; else `false`.
   */
  HTMLElementPrototype.hasClass = iframe.classList ?
    function(className) {
      return this.classList.contains(className);
    }
    : function(className) { // A function for browsers that don't support the `classList` property
      return new RegExp('(?:^|\\s)' + className + '(?:\\s|$)').test(this.className);
    };

  /**
   * Gets the element's current coordinates relative to the document.
   * 
   * @example
   * // HTML
   * // <body style="margin: 0">
   * //   <div id="mydiv" style="position: absolute; margin: 10px; left: 10px"></div>
   * // </body>
   * 
   * $$('mydiv').offset();  // -> Object {top: 10, left: 20}
   * 
   * @function HTMLElement#offset
   * @returns {{top: Number, left: Number}} An object containing the coordinates detailing the element's
   *     distance from the top and left of the document.
   */
  /**
   * Sets the element's coordinates relative to the document.
   * 
   * @function HTMLElement#offset
   * @param {{top: Number, left: Number}} coordinates - An object containing the properties `top` and `left`,
   *     which are numbers indicating the new top and left coordinates for the element.
   */
  HTMLElementPrototype.offset = function getOffset(coordinates) {
    var offset = {
      left: 0,
      top: 0
    };

    // Set
    if (coordinates) {
      // First check if the element has absolute or fixed positioning.
      // If it doesn't, extra measures need to be taken to set its coordinates.
      var position = getComputedStyle(this).position;

      if (position[0] !== 'a' && position[0] !== 'f') {
        // Reset the element's top and left values so relative coordinates can be calculated
        this.style.left = 0;
        this.style.top = 0;

        offset = getOffset.call(this);

        // Give the element relative positioning
        this.style.position = 'relative';
      }

      // Set the element's coordinates
      this.style.left = coordinates.left - offset.left + 'px';
      this.style.top = coordinates.top - offset.top + 'px';

      return this;
    }

    // Get
    var el = this;
    do {
      offset.left += el.offsetLeft;
      offset.top += el.offsetTop;
    } while (el = el.offsetParent);

    return offset;
  };

  /**
   * Removes the specified class(es) or all classes from the element.
   * 
   * @function HTMLElement#removeClass
   * @param {String} [className] - One or more classes separated by a single space
   *     to be removed from the element's class attribute.
   */
  HTMLElementPrototype.removeClass = function(value) {
    if (this.className) { // Can only remove classes if there are classes to remove
      if (value === UNDEFINED) {
        this.className = ''; // Remove all classes
      } else {
        var remClasses = value.split(' ');
        var curClasses = this.className.split(rgxSpaceChars);
        var classesLeft = 0;
        var i = 0;

        value = '';
        for (; i < curClasses.length; i++) {
          if (remClasses.indexOf(curClasses[i]) < 0) {
            value += (value ? ' ' : '') + curClasses[i];
            ++classesLeft;
          }
        }

        if (classesLeft < curClasses.length) { // Only manipulate the DOM if the class name will be changed
          this.className = value;
        }
      }
    }

    return this;
  };

  /**
   * @summary Add or remove one or more classes from the element depending on the class's presence (or lack thereof).
   * 
   * @description
   * __Note:__ Functionality is undefined if the input class names are not unique.
   * 
   * @function HTMLElement#toggleClass
   * @param {String} [className] - One or more classes separated by a single space to be toggled.
   *     If left empty, the element's current class is toggled.
   * @param {Boolean} [addOrRemove] - Indicates whether to add or remove the class (`true` => add, `false` => remove).
   */
  HTMLElementPrototype.toggleClass = function(value, addOrRemove) {
    if (addOrRemove === true) {
      return this.addClass(value);
    }
    if (addOrRemove === false) {
      return this.removeClass(value);
    }

    var className = this.className;

    if (className && value !== true) {
      if (value) {
        var curClasses = className.split(rgxSpaceChars);
        var togClasses = value.split(' ');
        var i = 0;
        var j;

        // Find the symmetric difference between the current class names and the names to toggle
        value = '';
        for (; i < togClasses.length; i++) {
          className = togClasses[i];
          for (j = 0; j < curClasses.length; j++) {
            if (curClasses[j] === className) {
              togClasses[i] = curClasses[j] = null;
            }
          }
          if (className = togClasses[i]) {
            value += (value ? ' ' : '') + className;
          }
        }
        for (i = 0; i < curClasses.length; i++) {
          if (className = curClasses[i]) {
            value += (value ? ' ' : '') + className;
          }
        }
      } else {
        this._$TC_ = className; // Save the element's current class name
        value = ''; // Set to an empty string so the class name will be cleared
      }
    } else if (!value || value === true) {
      // Retrieve the saved class name or an empty string if there is no saved class name
      value = value !== false && this._$TC_ || (value ? className : '');
    }

    this.className = value; // Set the new value

    return this;
  };

  //#endregion HTMLElement


  //#region ============================= Node =================================

  /**
   * @class Node
   * @classdesc
   * The {@link https://developer.mozilla.org/en-US/docs/Web/API/Node|DOM Node interface}.
   * 
   * It should be noted that all functions that do not have a specified return value,
   * return the calling object, allowing for function chaining.
   * @augments Object
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Node|Node - Web API Interfaces | MDN}
   */

  /**
   * Given two Nodes who are clones of each other, this function copies data and events from node A to node B.
   * This function will run recursively on the children of the nodes unless `doNotCopyChildNodes` is `true`.
   * 
   * @private
   * @param {Node} nodeA - The node being copied.
   * @param {Node} nodeB - The node that will receive nodeA's data and events.
   * @param {!Boolean} doNotCopyChildNodes - Inidicates if data and events for child notes should not be copied.
   */
  function copyDataAndEvents(nodeA, nodeB, doNotCopyChildNodes) {
    var data = nodeA[Firebolt.expando];
    var events = nodeA._$E_;

    // Data
    if (data) {
      // Use Firebolt.data in case the node was created in a different window
      extend(true, Firebolt.data(nodeB), data);
    }

    /* From this point on, the `data` variable is reused as the counter (or property name) in loops */

    // Events
    if (events) {
      // Copy event data and set the handler for each type of event
      nodeB._$E_ = extend(true, {}, events);
      for (data in events) {
        /* global nodeEventHandler */ // Requires the event module (this code won't be reached if it is not required)
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

  /**
   * Returns the function body for Node#[appendTo, putAfter, putBefore, prependTo, replaceAll]
   * 
   * @private
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

  /**
   * Returns the function body for Node#[afterPut, appendWith, beforePut, prependWith, replaceWith]
   * 
   * @private
   * @param {Function} inserter(newNode, refNode) - The function that performs the insertion.
   */
  function getNodePutOrWithFunction(inserter) {
    return function() {
      inserter(createFragment.apply(this, arguments), this);

      return this;
    };
  }

  /**
   * Inserts content after the node.
   * 
   * @function Node#afterPut
   * @param {...(String|Node|NodeCollection)} content - One or more HTML strings, nodes, or
   *     collections of nodes to insert.
   * @throws {TypeError|NoModificationAllowedError} The subject node must have a {@link ParentNode}.
   */
  NodePrototype.afterPut = getNodePutOrWithFunction(insertAfter);

  /**
   * Appends this node to the end of the target element(s).
   * 
   * @function Node#appendTo
   * @param {String|ParentNode|NodeCollection} target - A specific node, collection of nodes, or a selector to find
   *     a set of nodes to which this node will be appended.
   * @throws {HierarchyRequestError} The target(s) must implement the {@link ParentNode} interface.
   */
  NodePrototype.appendTo = getNodeInsertingFunction(append);

  /**
   * Appends content to the end of the node.
   * 
   * @function Node#appendWith
   * @param {...(String|Node|NodeCollection)} content - One or more HTML strings, nodes, or
   *     collections of nodes to insert.
   * @throws {HierarchyRequestError} This node must implement the {@link ParentNode} interface.
   */
  NodePrototype.appendWith = getNodePutOrWithFunction(append);

  /**
   * Inserts content before the node.
   * 
   * @function Node#beforePut
   * @param {...(String|Node|NodeCollection)} content - One or more HTML strings, nodes, or
   *     collections of nodes to insert.
   * @throws {TypeError|NoModificationAllowedError} The subject node must have a {@link ParentNode}.
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

    var nc = new NodeCollection();
    for (var i = 0; i < children.length; i++) {
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
   * @param {Boolean} [withDataAndEvents=false] - A boolean indicating if the node's data and events should be
   *     copied over to the clone.
   * @param {Boolean} [deepWithDataAndEvents=value of withDataAndEvents] - If `false`, data and events for the
   *     descendants of the cloned node will not be copied over. If cloning with data and events and you know
   *     the descendants do not have any data or events that should be copied, using this variable (by setting
   *     it to `false`) will improve performance.
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
   * @summary
   * Gets the first node that matches the selector by testing the node itself
   * and traversing up through its ancestors in the DOM tree.
   * 
   * @description
   * __Note:__ Unlike jQuery, there is no version of this function where you can provide a "context" element,
   * whose children that match the input CSS selector will be searched for a match. This is because it is very
   * easy to get the matching children of an element yourself using {@linkcode Element#QSA|Element#QSA()} or
   * {@linkcode Element#find|Element#find()} and you may find that one of these functions suits your needs
   * better than the other.
   * 
   * @function Node#closest
   * @param {String|Node|Node[]} selector - A CSS selector, a node, or a collection of nodes
   *     used to match the node and its parents against.
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
      node = isNodeElement(node) ? node : getParentElement(node);

      // Search the node's parent elements until one matches the selector or there are no more parents
      while (node && !node.matches(selector)) {
        node = node.parentElement;
      }
    } else {
      // Search the node's parent nodes until one is found in the collection or there are no more parents
      while (node && selector.indexOf(node) < 0) {
        node = node.parentNode;
      }
    }

    return node;
  };

  /**
   * @summary Gets the child nodes of the element as a {@link NodeCollection}.
   * 
   * @description
   * This method can also be used to get the content document of an iframe,
   * if the iframe has permission to access its content document.
   * 
   * __ProTip:__ If you don't need the child nodes in a NodeCollection, you should access them using the native
   * `childNodes` property (which is a {@link NodeList}).
   * 
   * @function Node#contents
   * @returns {NodeCollection}
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Node.childNodes|Node.childNodes - Web API Interfaces | MDN}
   */
  NodePrototype.contents = function(/*INTERNAL*/ nc) {
    var node = this.firstChild || this.contentDocument;
    nc = nc || new NodeCollection();

    while (node) {
      push1(nc, node);
      node = node.nextSibling;
    }

    return nc;
  };

  /**
   * Get the node's immediately following sibling element. If a selector is provided,
   * it retrieves the next sibling only if it matches that selector.
   * 
   * @function Node#next
   * @param {String} [selector] - A CSS selector to match the next sibling against.
   * @returns {?Element}
   */
  NodePrototype.next = getNextOrPrevFunc(getNextElementSibling, 1);

  /**
   * Gets all following siblings of the node, optionally filtered by a selector.
   * 
   * @function Node#nextAll
   * @param {String} [selector] - A CSS selector used to filter the returned set of elements.
   * @returns {NodeCollection} The set of following sibling elements in order beginning with the closest sibling.
   */
  NodePrototype.nextAll = getGetDirElementsFunc(getNextElementSibling);

  /**
   * Gets the node's following siblings, up to but not including the element matched by the selector, DOM node,
   * or node in a collection.
   * 
   * @function Node#nextUntil
   * @param {String|Element|Node[]} [selector] - A CSS selector, an element, or a collection of nodes used to indicate
   *     where to stop matching following sibling elements.
   * @param {String} [filter] - A CSS selector used to filter the returned set of elements.
   * @returns {NodeCollection} - The set of following sibling elements in order beginning with the closest sibling.
   */
  NodePrototype.nextUntil = getGetDirElementsFunc(getNextElementSibling, 0);

  /**
   * Gets the node's ancestors, optionally filtered by a selector.
   * 
   * @function Node#parents
   * @param {String} [selector] - A CSS selector used to filter the returned set of elements.
   * @returns {NodeCollection} - The set of the node's ancestors, ordered from the immediate parent on up.
   */
  NodePrototype.parents = getGetDirElementsFunc(getParentElement);

  /**
   * Gets the node's ancestors, up to but not including the element matched by the selector, DOM node,
   * or node in a collection.
   * 
   * @function Node#parentsUntil
   * @param {String|Element|Node[]} [selector] - A CSS selector, an element, or a collection of nodes used to indicate
   *     where to stop matching ancestor elements.
   * @param {String} [filter] - A CSS selector used to filter the returned set of elements.
   * @returns {NodeCollection} - The set of the node's ancestors, ordered from the immediate parent on up.
   */
  NodePrototype.parentsUntil = getGetDirElementsFunc(getParentElement, 0);

  /**
   * Prepends content to the beginning of the node.
   * 
   * @function Node#prependWith
   * @param {...(String|Node|NodeCollection)} content - One or more HTML strings, nodes, or
   *     collections of nodes to insert.
   * @throws {HierarchyRequestError} This node must implement the {@link ParentNode} interface.
   */
  NodePrototype.prependWith = getNodePutOrWithFunction(prepend);

  /**
   * Prepends this node to the beginning of the target element(s).
   * 
   * @function Node#prependTo
   * @param {String|ParentNode|NodeCollection} target - A specific node, collection of nodes, or a selector to find
   *     a set of nodes to which this node will be prepended.
   * @throws {HierarchyRequestError} The target(s) must implement the {@link ParentNode} interface.
   */
  NodePrototype.prependTo = getNodeInsertingFunction(prepend);

  /**
   * Get the node's immediately preceeding sibling element. If a selector is provided,
   * it retrieves the previous sibling only if it matches that selector.
   * 
   * @function Node#prev
   * @param {String} [selector] - A CSS selector to match the previous sibling against.
   * @returns {?Element}
   */
  NodePrototype.prev = getNextOrPrevFunc(getPreviousElementSibling, 1);

  /**
   * Gets all preceeding siblings of the node, optionally filtered by a selector.
   * 
   * @function Node#prevAll
   * @param {String} [selector] - A CSS selector used to filter the returned set of elements.
   * @returns {NodeCollection} The set of preceeding sibling elements in order beginning with the closest sibling.
   */
  NodePrototype.prevAll = getGetDirElementsFunc(getPreviousElementSibling);

  /**
   * Gets the node's preceeding siblings, up to but not including the element matched by the selector, DOM node,
   * or node in a collection.
   * 
   * @function Node#prevUntil
   * @param {String|Element|Node[]} [selector] - A CSS selector, an element, or a collection of nodes used to indicate
   *     where to stop matching preceeding sibling elements.
   * @param {String} [filter] - A CSS selector used to filter the returned set of elements.
   * @returns {NodeCollection} - The set of preceeding sibling elements in order beginning with the closest sibling.
   */
  NodePrototype.prevUntil = getGetDirElementsFunc(getPreviousElementSibling, 0);

  /**
   * Inserts this node directly after the specified target(s).
   * 
   * @function Node#putAfter
   * @param {String|Node|NodeCollection} target - A specific node, collection of nodes, or a selector to find
   *     a set of nodes after which this node will be inserted.
   * @throws {TypeError} The target node(s) must have a {@link ParentNode}.
   */
  NodePrototype.putAfter = getNodeInsertingFunction(insertAfter);

  /**
   * Inserts this node directly before the specified target(s).
   * 
   * @function Node#putBefore
   * @param {String|Node|NodeCollection} target - A specific node, collection of nodes, or a selector to find
   *     a set of nodes after which this node will be inserted.
   * @throws {TypeError} The target node(s) must have a {@link ParentNode}.
   */
  NodePrototype.putBefore = getNodeInsertingFunction(insertBefore);

  /**
   * Replace the target with this node.
   * 
   * @function Node#replaceAll
   * @param {String|Node|NodeCollection} target - A specific node, collection of nodes, or a selector to find
   *     a set of nodes to be replaced by this node.
   * @throws {TypeError} The target node(s) must have a {@link ParentNode}.
   */
  NodePrototype.replaceAll = getNodeInsertingFunction(replaceWith);

  /**
   * Replace the node with some other content.
   * 
   * @function Node#replaceWith
   * @param {...(String|Node|NodeCollection)} content - A specific node, a collection of nodes,
   *     or some HTML to replace the subject node.
   * @throws {TypeError} The subject node must have a {@link ParentNode}.
   */
  NodePrototype.replaceWith = getNodePutOrWithFunction(replaceWith);

  /**
   * Removes this node from the DOM.
   * 
   * @function Node#remove
   * @returns `undefined`
   */
  NodePrototype.remove = function() {
    var parent = this.parentNode;
    if (parent) {
      parent.removeChild(this);
    }
  };

  /**
   * Gets the node's siblings, optionally filtered by a selector.
   * 
   * @function Node#siblings
   * @param {String} [selector] - A CSS selector used to filter the returned set of elements.
   * @returns {NodeCollection} - The set of the node's ancestors, ordered from the immediate parent on up.
   * @throws {TypeError} The subject node must have a {@link ParentNode}.
   */
  NodePrototype.siblings = function(selector) {
    return NodePrototype.childElements.call(this.parentNode, selector).remove(this);
  };

  /**
   * Gets this node's text content.
   * 
   * __Note:__ Consider using the native `textContent` property instead of this function.
   * 
   * __Warning #1:__ There is a known bug where `<body>` elements will have an empty string as the `text` property
   * instead of this function due to browsers continuing to implement a deprecated API on the HTMLBodyElement prototype.
   * Please use the native `textContent` property to get and set the text content of `<body>` elements instead of
   * attempting to use this function.
   * 
   * __Warning #2:__ `<script>` elements have a `text` property with the exact same functionality as the `textContent`
   * property that cannot be overwritten. Please use the native `text` property or the `textContent` property to get
   * and set the text content of `<script>` elements instead of attempting to use this function.
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
   * __Warning #1:__ There is a known bug where `<body>` elements will have an empty string as the `text` property
   * instead of this function due to browsers continuing to implement a deprecated API on the HTMLBodyElement prototype.
   * Please use the native `textContent` property to get and set the text content of `<body>` elements instead of
   * attempting to use this function.
   * 
   * __Warning #2:__ `<script>` elements have a `text` property with the exact same functionality as the `textContent`
   * property that cannot be overwritten. Please use the native `text` property or the `textContent` property to get
   * and set the text content of `<script>` elements instead of attempting to use this function.
   * 
   * @function Node#text
   * @param {String} text - The text or content that will be converted to a string to be set as the node's text content.
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Node.textContent|Node.textContent - Web API Interfaces | MDN}
   */
  NodePrototype.text = function(text) {
    if (text === UNDEFINED) {
      return this.textContent; // Get
    }

    this.textContent = text; // Set

    return this;
  };

  /**
   * Remove the node's parent from the DOM, leaving the node in its place.
   * 
   * @function Node#unwrap
   * @throws {TypeError} The subject node must have a {@link ParentNode}, which in turn must also have a ParentNode.
   */
  NodePrototype.unwrap = function() {
    var parent = this.parentNode;
    var grandparent = parent.parentNode;

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
   * @classdesc
   * Interface implemented by {@link https://developer.mozilla.org/en-US/docs/Web/API/Element|Element},
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/Document|Document}, and
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment|DocumentFragment} objects.
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/ParentNode|ParentNode - Web API Interfaces | MDN}
   */

  //#endregion Node


  //#region ======================== NodeCollection ============================

  /**
   * Returns a function that calls the passed in function on each element in a NodeCollection unless the callback
   * returns true, in which case the result of calling the function on the first element is returned.
   * 
   * @private
   * @param {Function} fn - The function to use as the getter or setter.
   * @param {Function} isSetter(numArgs, firstArg) - Function to determine if the value of the first
   *     element should be returned.
   */
  function getFirstSetEachElement(fn, isSetter) {
    return function(firstArg) {
      var items = this;
      var len = items.length;
      var i = 0;

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
   * Returns the function body for NodeCollection#[afterPut, appendWith, beforePut, prependWith, replaceWith]
   * 
   * @param {Function} inserter(newNode, refNode) - The function that performs the insertion.
   */
  function getNodeCollectionPutOrWithFunction(inserter) {
    return function(nc, addClones) {
      // Determine if this function was called by a function created with `getNodeCollectionPutToOrReplaceAllFunction()`
      addClones = addClones === 0;

      var len = this.length;
      var i = 1;
      var fragment;
      var clone;

      // Only create the DocumentFragment and do insertions if this NodeCollection isn't empty
      if (len) {
        fragment = addClones ? createFragment(nc) : createFragment.apply(this, arguments);
        for (; i < len; i++) {
          clone = fragment.cloneNode(true);
          if (addClones) {
            array_push.apply(nc, clone.childNodes);
          }
          inserter(clone, this[i]);
        }
        inserter(fragment, this[0]); // The first node always gets the original fragment
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
        Firebolt(target)[funcName](copy, 0); // Pass in 0 to tell the function to add clones to the copy
      } else {
        NodeInserter.call(target, copy);
      }

      return copy;
    };
  }

  /* Used for sorting nodes in a NodeCollection in document-order */
  function sortDocOrder(a, b) {
    b = a.compareDocumentPosition(b);
    return b & 4 ? -1 // Node a should come first
         : b & 1 ? 0  // Nodes are in different documents
         : 1;         // Else node b should come first
  }

  /* Used for sorting nodes in a NodeCollection in reverse document-order */
  function sortRevDocOrder(a, b) {
    b = a.compareDocumentPosition(b);
    return b & 2 ? -1 // Node b should come first
         : b & 1 ? 0  // Nodes are in different documents
         : 1;         // Else node a should come first
  }

  /**
   * Same constructor as {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array|Array}.
   * 
   * @class NodeCollection
   * @augments Array
   * @classdesc
   * A mutable collection of DOM nodes. It subclasses the native {@link Array} class (but take note that the `.clone()`,
   * `.remove()`, and `.filter()` functions have been overridden), and has all of the main DOM-manipulating functions.
   * `NodeCollection` can also be reference by its shorter alias: `NC`.
   * 
   * __Note:__ Since it is nearly impossible to fully subclass the Array class in JavaScript, there is one minor hiccup
   * with the way NodeCollection subclasses Array. The `instanceof` operator will not report that NodeCollection is an
   * instance of anything other than a NodeCollection. It also will not report that `NodeCollection` is a function.
   * This is demonstrated in the following code:
   * ```js
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
   * allowing for function chaining.<br />
   * <br />
   */
  var NodeCollection = window.NodeCollection = window.NC =
    document.head.appendChild(iframe).contentWindow.Array; // <iframe> Array subclassing

  // Extend NodeCollection's prototype with the Array functions and save a reference to it
  var NodeCollectionPrototype = Firebolt.fn =
    extend(NodeCollection[prototype], prototypeExtensions, getTypedArrayFunctions(NodeCollection));

  // Polyfill NodeCollection.from() and .of() and get the custom version of .from()
  var ncFrom = setArrayStaticsAndGetFromFunction(NodeCollection);

  var ncFilter = NodeCollectionPrototype.filter;

  iframe.remove(); // Remove the iframe that was used to subclass Array

  // Add a bunch of functions by calling the HTMLElement version on each element in the collection
  (// NCFUNCS
   'addClass blur click empty focus removeAttr removeClass removeProp toggleClass')
    .split(' ')
    .each(function(fnName) {
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
   * @summary
   * Adds the queried elements to a copy of the existing collection (if they are not already in the collection)
   * and returns the result.
   * 
   * @description
   * Do not assume that this method appends the nodes to the existing collection in the order they are passed to the
   * method (that's what `concat` is for). When all nodes are members of the same document, the resulting collection
   * will be sorted in document order; that is, in order of each node's appearance in the document. If the collection
   * consists of nodes from different documents or ones not in any document, the sort order is undefined (but nodes in
   * the collection that are in the same document will still be in document order).
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
   * @summary
   * Adds the node to a copy of the existing collection (if it is not already in the collection) and returns the result.
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
   * Do not assume that this method appends the nodes to the existing collection in the order they are passed to the
   * method (that's what `concat` is for). When all nodes are members of the same document, the resulting collection
   * will be sorted in document order; that is, in order of each node's appearance in the document. If the collection
   * consists of nodes from different documents or ones not in any document, the sort order is undefined (but nodes
   * in the collection that are in the same document will still be in document order).
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
   * Inserts content after each node in the collection.
   * 
   * @function NodeCollection#afterPut
   * @param {...(String|Node|NodeCollection)} content - One or more HTML strings, nodes, or
   *     collections of nodes to insert.
   * @throws {TypeError|NoModificationAllowedError} The subject collection of nodes must only contain nodes that have a
   *     {@link https://developer.mozilla.org/en-US/docs/Web/API/Node.parentNode|ParentNode}.
   */
  NodeCollectionPrototype.afterPut = getNodeCollectionPutOrWithFunction(insertAfter);

  /**
   * Appends each node in this collection to the end of the specified target(s).
   * 
   * @function NodeCollection#appendTo
   * @param {String|ParentNode|NodeCollection} target - A specific node, collection of nodes,
   *     or a selector to find a set of nodes to which each node will be appended.
   * @throws {HierarchyRequestError} The target(s) must implement the {@link ParentNode} interface.
   */
  NodeCollectionPrototype.appendTo = getNodeCollectionPutToOrReplaceAllFunction('appendWith');

  /**
   * Appends content to the end of each element in the collection.
   * 
   * @function NodeCollection#appendWith
   * @param {...(String|Node|NodeCollection)} content - One or more HTML strings, nodes, or
   *     collections of nodes to insert.
   * @throws {HierarchyRequestError} The nodes in the collection must implement the {@link ParentNode} interface.
   */
  NodeCollectionPrototype.appendWith = getNodeCollectionPutOrWithFunction(append);

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
   * Inserts content before each node in the collection.
   * 
   * @function NodeCollection#beforePut
   * @param {...(String|Node|NodeCollection)} content - One or more HTML strings, nodes, or
   *     collections of nodes to insert.
   * @throws {TypeError|NoModificationAllowedError} The subject collection of nodes must only contain nodes that have a
   *     {@link https://developer.mozilla.org/en-US/docs/Web/API/Node.parentNode|ParentNode}.
   */
  NodeCollectionPrototype.beforePut = getNodeCollectionPutOrWithFunction(insertBefore);

  /**
   * Calls {@linkcode https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement.blur|HTMLElement#blur()}
   * on each element in the collection.
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
  NodeCollectionPrototype.childElements =

  /**
   * Alias for {@linkcode NodeCollection#childElements|NodeCollection#childElements()}.
   * 
   * @function NodeCollection#children
   * @param {String} [selector] - A CSS selector used to filter the returned set of elements.
   * @returns {NodeCollection} The set of children, sorted in document order.
   */
  NodeCollectionPrototype.children = getGetDirElementsFunc(HTMLElementPrototype.childElements, sortDocOrder);

  /**
   * Calls {@linkcode https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement.click|HTMLElement#click()}
   * on each element in the collection.
   * 
   * @function NodeCollection#click
   */

  /**
   * Create a deep copy of the collection of nodes.
   * 
   * __ProTip:__ If you want a shallow copy of the collection, use `.toNC()` (even though
   * that's mainly a NodeList function, NodeCollections also have it in their prototype)
   * or pass the collection into `NodeCollection.from()`.
   * 
   * @function NodeCollection#clone
   * @param {Boolean} [withDataAndEvents=false] - A boolean indicating if each node's data and events
   *     should be copied over to its clone.
   * @param {Boolean} [deepWithDataAndEvents=value of withDataAndEvents] - If `false`, data and events
   *     for the descendants of the cloned nodes will not be copied over. If cloning with data and events
   *     and you know the descendants do not have any data or events that should be copied, using this
   *     variable (by setting it to `false`) will improve performance.
   * @returns {NodeCollection}
   */
  NodeCollectionPrototype.clone = function(withDataAndEvents, deepWithDataAndEvents) {
    var len = this.length;
    var clone = new NodeCollection(len);

    for (var i = 0; i < len; i++) {
      clone[i] = this[i].clone(withDataAndEvents, deepWithDataAndEvents);
    }

    return clone;
  };

  /**
   * @summary For each node in the collection, gets the first node that matches the selector by testing the node itself
   * and traversing up through its ancestors in the DOM tree.
   * 
   * @description
   * __Note:__ Unlike jQuery, there is no version of this function where you can provide a "context" element
   * whose children that match the input CSS selector will be searched for a match. This is because it is very
   * easy to get the matching children of an element yourself using {@linkcode Element#QSA|Element#QSA()} or
   * {@linkcode Element#find|Element#find()} and you may find that one of these functions suits your needs
   * better than the other.
   * 
   * @function NodeCollection#closest
   * @param {String|Node|Node[]} selector - A CSS selector, a node, or a collection of nodes used to match
   *     the node and its parents against.
   * @returns {Node[]} - A collection of "closest" nodes.
   */
  NodeCollectionPrototype.closest = function(selector) {
    var nc = new NodeCollection();

    for (var i = 0, node; i < this.length; i++) {
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
    var nc = new NodeCollection();

    for (var i = 0; i < this.length; i++) {
      // Call Node#contents() on the current node, passing in the
      // NodeCollection so the nodes are added directly to it
      NodePrototype.contents.call(this[i], nc);
    }

    return nc;
  };

  /**
   * Removes all child nodes from each element in the list.
   * 
   * @function NodeCollection#empty
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
   * @param {Function} function(value,index,collection) - A function used as a test for each element in the collection.
   * @returns {NodeCollection}
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter|Array#filter() - JavaScript | MDN}
   */
  NodeCollectionPrototype.filter = function(selector) {
    return ncFilter.call(this,
      typeofString(selector)
        ? function(node) { return isNodeElement(node) && node.matches(selector); } // Use CSS string filter
        : selector // Use given filter function
    );
  };

  /**
   * Gets the descendants of each element in the collection, filtered by a selector, collection of elements,
   * or a single element.
   * 
   * @function NodeCollection#find
   * @param {String|Element|Element[]} selector - A CSS selector, a collection of elements, or a single element
   *     used to match descendant elements against.
   * @returns {NodeList|NodeCollection}
   * @throws {TypeError} This error is thrown when the collection contains elements that do not have a
   *     `querySelectorAll()` function.
   */
  NodeCollectionPrototype.find = getGetDirElementsFunc(ElementPrototype.find, sortDocOrder);

  /**
   * Calls {@linkcode https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement.focus|HTMLElement#focus()}
   * on each element in the collection.
   * 
   * @function NodeCollection#focus
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
   * Returns the `index`th item in the collection. If `index` is greater than or
   * equal to the number of nodes in the list, this returns `null`.
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
   * Get the each node's immediately following sibling element. If a selector is provided,
   * it retrieves the next sibling only if it matches that selector.
   * 
   * @function NodeCollection#next
   * @param {String} [selector] - A CSS selector to match the next sibling against.
   * @returns {NodeCollection} The collection of sibling elements.
   */
  NodeCollectionPrototype.next = getNextOrPrevFunc(getNextElementSibling);

  /**
   * Gets all following siblings of each node in the collection, optionally filtered by a selector.
   * 
   * @function NodeCollection#nextAll
   * @param {String} [selector] - A CSS selector used to filter the returned set of elements.
   * @returns {NodeCollection} The set of following sibling elements in order beginning with the closest sibling.
   */
  NodeCollectionPrototype.nextAll = getGetDirElementsFunc(HTMLElementPrototype.nextAll, sortDocOrder);

  /**
   * Gets the following siblings of each node in the collection, up to but not including the elements matched by the
   * selector, DOM node, or node in a collection.
   * 
   * @function NodeCollection#nextUntil
   * @param {String|Element|Node[]} [selector] - A CSS selector, an element, or a collection of nodes used to indicate
   * where to stop matching following sibling elements.
   * @param {String} [filter] - A CSS selector used to filter the returned set of elements.
   * @returns {NodeCollection} - The set of following sibling elements in order beginning with the closest sibling.
   */
  NodeCollectionPrototype.nextUntil = getGetDirElementsFunc(HTMLElementPrototype.nextUntil, sortDocOrder);

  /**
   * Gets the current coordinates of the first element in the collection relative to the document.
   * 
   * @function NodeCollection#offset
   * @returns {{top: Number, left: Number}} An object containing the coordinates detailing the element's
   *     distance from the top and left of the document.
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
   * Gets the parent of each node in the collection, optionally filtered by a selector.
   * 
   * @function NodeCollection#parent
   * @param {String} [selector] - A CSS selector used to filter the returned set of elements.
   * @returns {NodeCollection} - The set of parents. Unlike the `.parents()` function, this
   *     set may include Document and DocumentFragment nodes.
   */
  NodeCollectionPrototype.parent = function(selector) {
    var nc = new NodeCollection();

    for (var i = 0, parent; i < this.length; i++) {
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
   *     where to stop matching ancestor elements.
   * @param {String} [filter] - A CSS selector used to filter the returned set of elements.
   * @returns {NodeCollection} - The set of ancestors, sorted in reverse document order.
   */
  NodeCollectionPrototype.parentsUntil = getGetDirElementsFunc(HTMLElementPrototype.parentsUntil, sortRevDocOrder);

  /**
   * Prepends content to the beginning of each element in the collection.
   * 
   * @function NodeCollection#prependWith
   * @param {...(String|Node|NodeCollection)} content - One or more HTML strings, nodes, or
   *     collections of nodes to insert.
   * @throws {HierarchyRequestError} The nodes in the collection must implement the {@link ParentNoded} interface.
   */
  NodeCollectionPrototype.prependWith = getNodeCollectionPutOrWithFunction(prepend);

  /**
   * Prepends each node in this collection to the beginning of the specified target(s).
   * 
   * @function NodeCollection#prependTo
   * @param {String|ParentNode|NodeCollection} target - A specific node, collection of nodes, or a selector to find
   *     a set of nodes to which each node will be prepended.
   * @throws {HierarchyRequestError} The target(s) must implement the {@link ParentNode} interface.
   */
  NodeCollectionPrototype.prependTo = getNodeCollectionPutToOrReplaceAllFunction('prependWith');

  /**
   * Get the each node's immediately preceeding sibling element. If a selector is provided,
   * it retrieves the previous sibling only if it matches that selector.
   * 
   * @function NodeCollection#prev
   * @param {String} [selector] - A CSS selector to match the previous sibling against.
   * @returns {NodeCollection} The collection of sibling elements.
   */
  NodeCollectionPrototype.prev = getNextOrPrevFunc(getPreviousElementSibling);

  /**
   * Gets all preceeding siblings of each node in the collection, optionally filtered by a selector.
   * 
   * @function NodeCollection#prevAll
   * @param {String} [selector] - A CSS selector used to filter the returned set of elements.
   * @returns {NodeCollection} The set of preceeding sibling elements in order beginning with the closest sibling.
   */
  NodeCollectionPrototype.prevAll = getGetDirElementsFunc(HTMLElementPrototype.prevAll, sortRevDocOrder);

  /**
   * Gets the preceeding siblings of each node in the collection, up to but not including
   * the elements matched by the selector, DOM node, or node in a collection.
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
   * @param {String|Node|NodeCollection} target - A specific node, collection of nodes, or a selector to find
   *     a set of nodes after which each node will be inserted.
   * @throws {TypeError} The target node(s) must have a {@link ParentNode}.
   */
  NodeCollectionPrototype.putAfter = getNodeCollectionPutToOrReplaceAllFunction('afterPut');

  /**
   * Inserts each node in this collection directly before the specified target(s).
   * 
   * @function NodeCollection#putBefore
   * @param {String|Node|NodeCollection} target - A specific node, collection of nodes, or a selector to find
   *     a set of nodes before which each node will be inserted.
   * @throws {TypeError} The target node(s) must have a {@link ParentNode}.
   */
  NodeCollectionPrototype.putBefore = getNodeCollectionPutToOrReplaceAllFunction('beforePut');

  /**
   * Removes nodes in the collection from the DOM tree.
   * 
   * @function NodeCollection#remove
   * @param {String} [selector] - A selector that filters the set of elements to be removed.
   */
  NodeCollectionPrototype.remove = function(selector) {
    var nodes = selector ? this.filter(selector) : this;
    for (var i = 0; i < nodes.length; i++) {
      NodePrototype.remove.call(nodes[i]);
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
   * Removes the specified property from each element in the list.
   * 
   * @function NodeCollection#removeProp
   * @param {String} property - The name of the property to remove.
   */

  /**
   * Replace the target with the nodes in this collection.
   * 
   * @function NodeCollection#replaceAll
   * @param {String|Node|NodeCollection} target - A specific node, collection of nodes, or a selector to find
   *     a set of nodes to be replaced by the nodes in this collection.
   * @throws {TypeError} The target node(s) must have a {@link ParentNode}.
   */
  NodeCollectionPrototype.replaceAll = getNodeCollectionPutToOrReplaceAllFunction('replaceWith');

  /**
   * Replace each node in the collection with some other content.
   * 
   * @function NodeCollection#replaceWith
   * @param {...(String|Node|NodeCollection)} content - A specific node, a collection of nodes,
   *     or some HTML to replace each node in the collection.
   * @throws {TypeError|NoModificationAllowedError} The subject collection of nodes must only contain nodes
   *     that have a {@link ParentNode}.
   */
  NodeCollectionPrototype.replaceWith = getNodeCollectionPutOrWithFunction(replaceWith);

  /**
   * Gets the sibling elements of each node in the collection, optionally filtered by a selector.
   * 
   * @function NodeCollection#siblings
   * @param {String} [selector] - A CSS selector used to filter the returned set of elements.
   * @returns {NodeCollection} The set of siblings, sorted in document order.
   * @throws {TypeError} The target node(s) must have a {@link ParentNode}.
   */
  NodeCollectionPrototype.siblings = getGetDirElementsFunc(HTMLElementPrototype.siblings, sortDocOrder);

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
   * @param {String|*} text - The text or content that will be converted to a
   *     string to be set as each nodes' text content.
   */
  NodeCollectionPrototype.text = function(text) {
    var len = this.length;
    var i = 0;

    // Get
    if (text === UNDEFINED) {
      for (text = ''; i < len; i++) {
        text += this[i].textContent;
      }
      return text;
    }
    // Set
    for (; i < len; i++) {
      this[i].textContent = text;
    }

    return this;
  };

  /**
   * Toggles the input class name for all elements in the list.
   * 
   * @function NodeCollection#toggleClass
   * @param {String} className - The class to be toggled for each element in the collection.
   * @param {Boolean} [addOrRemove] - Indicates whether to add or remove the class (`true` => add, `false` => remove).
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
   * 
   * This is mainly just so it can be inherited by {@link NodeList}, but can also be used like {@linkcode Array#clone}.
   * 
   * @function NodeCollection#toNC
   * @returns {NodeCollection}
   */
  NodeCollectionPrototype.toNC = function() {
    return ncFrom(this);
  };

  /**
   * Remove the each node's parent from the DOM, leaving the node in its place.
   * 
   * @function NodeCollection#unwrap
   * @throws {TypeError} Each node must have a {@link ParentNode}, which in turn must also have a ParentNode.
   */
  NodeCollectionPrototype.unwrap = function() {
    var parents = NodeCollectionPrototype.parent.call(this);
    for (var i = 0; i < parents.length; i++) {
      NodePrototype.unwrap.call(parents[i].firstChild);
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
        NodePrototype.wrapInner.call(this[i], wrappingElement);
      }
    }

    return this;
  };

  /**
   * Wrap an HTML structure around each node in the collection.
   * 
   * @function NodeCollection#wrapWith
   * @param {String|Element|Element[]) wrappingElement - CSS selector&mdash;to select wrapping element(s)&mdash;,
   *     HTML string&mdash;to create wrapping element(s)&mdash;, element, or collection of elements used to
   *     specify the wrapping structure.
   * @throws {TypeError} The target node(s) must have a {@link ParentNode}.
   */
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
   * NodeLists have <u>almost</u> the exact same API as {@link NodeCollection},
   * so there are a few caveats to take note of:
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
   * + afterPut
   * + appendWith
   * + appendTo
   * + beforePut
   * + copyWithin (ES6 browsers only)
   * + each
   * + fill (ES6 browsers only)
   * + putAfter
   * + putBefore
   * + prependWith
   * + prependTo
   * + remove
   * + removeClass
   * + replaceAll
   * + replaceWith
   * + reverse
   * + sort
   * + toggleClass
   * + unwrap
   * + wrapWith
   * + wrapInner
   * 
   * This is because these functions will or may alter live NodeLists, as seen in this example:
   * 
   * ```javascript
   * var blueThings = $CLS('blue');  // ($CLS is Firebolt's alias for document.getElementsByClassName)
   * console.log(blueThings.length); // -> 10 (for example)
   * 
   * var ncBlueThings = blueThings.removeClass('blue');
   * blueThings.length === 0;   // -> true (since now there are no elements with the 'blue' class)
   * ncBlueThing.length === 10; // -> true (since `removeClass` returned the NodeList as a NodeCollection)
   * ```
   * 
   * Returning a NodeCollection guarantees predictable functionality when chaining calls originally
   * made on a NodeList. When working with a live NodeList saved as a variable, be aware that it
   * may be altered by these functions.
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
   * Passing a NodeList (or HTMLCollection) as a parameter to the `NodeCollection#concat()` function will add
   * the NodeList itself to the collection instead of merging in its elements. This is because NodeLists and
   * HTMLCollections don't directly inherit from NodeCollection/Array (they are merely given some of their
   * functions), so they are treated as objects instead of arrays. A simple way to fix this is to call
   * `.toNC()` on the NodeList/HTMLCollection when passing it as a parameter to `concat` like so:
   * 
   * ```javascript
   * var nodes = $QSA('div.special');                    // `nodes` is a NodeList
   * var moreNodes = $TAG('p');                          // `moreNodes` is a HTMLCollection
   * var concatenation = nodes.concat(moreNodes.toNC()); // `concatenation` is a NodeCollection
   * ```
   * <br />
   * 
   * @class NodeList
   * @see NodeCollection
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/NodeList|NodeList - Web API Interfaces | MDN}
   */

  /* Give NodeLists and HTMLCollections many of the same prototype functions as NodeCollections */
  Object.getOwnPropertyNames(NodeCollectionPrototype)
    .diff('clear length pop push shift splice unshift'.split(' ')) // These properties should not be added
    .each(function(methodName) {
      if (!NodeListPrototype[methodName]) {
        var method = NodeCollectionPrototype[methodName];

        HTMLCollectionPrototype[methodName] = NodeListPrototype[methodName] =
        rgxDifferentNL.test(methodName) ? function() {
          return method.apply(ncFrom(this), arguments); // Convert to a NodeCollection, then apply the method
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
  NodeListPrototype.namedItem =
    NodeCollectionPrototype.namedItem = function(name) {
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
  // This function was added to the NodeList prototype in the loop above
  // (because NodeCollection has this function too)

  /*
   * NodeLists/HTMLCollections always contain unique elements, so theses are equivalent to calling
   * NodeCollection#toNC() on the NodeList/HTMLCollection.
   */
  NodeListPrototype.uniq = HTMLCollectionPrototype.uniq = NodeCollectionPrototype.toNC;

  //#endregion NodeList


  //#region ============================ Object ================================

  /**
   * @class Object
   * @classdesc The native JavaScript Object class.
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
   * @summary Gets an object's JavaScript [[class]].
   * 
   * @description
   * __Note:__ For certain objects, the [[class]] name may be inconsistent between
   * browsers (mainly just the `window` and `document` objects). The only objects
   * that are guaranteed to produce consistent results are those that are defined
   * in the ECMAScript specification, but modern browsers are consistent enough
   * that this function will produce consistent output for most inputs. Also,
   * getting the class of `null` or `undefined` does not work on browsers that
   * do not support strict mode.
   * 
   * @example
   * Object.getClassOf([]);       // -> "Array"
   * Object.getClassOf({});       // -> "Object"
   * Object.getClassOf('string'); // -> "String"
   * Object.getClassOf(/^.+reg/); // -> "RegExp"
   * Object.getClassOf(window);   // -> "Window" or "global"
   * Object.getClassOf(document.body.childNodes); // -> "NodeList"
   * 
   * @function Object.getClassOf
   * @param {*} obj - Any object/value.
   * @returns {String} The passed in object's [[class]] name.
   */
  function getClassOf(obj) {
    return Object.prototype.toString.call(obj).slice(8, -1);
  }
  Object.getClassOf = getClassOf;

  //#endregion Object


  //#region MODULES
  //#endregion MODULES
})(
  self, // (window)
  document,
  Object,
  Array
  // CLOSURE_GLOBALS
);
