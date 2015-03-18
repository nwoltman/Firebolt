/**
 * Provides the ability to store arbitrary data on objects and elements.
 * 
 * @module data
 * @requires core
 * @requires string/extras
 * @requires private/keys
 * @ncfuncs removeData
 */

/* global camelize */
/* global keys */

'use strict';


//#region VARS

// Matches strings that look like numbers but should remain as strings
var rgxNoParse = /^\d+(?:[^\d.]|\..*\D|\..*0$)/;

//#endregion VARS


/*
 * Tries to parse a JSON string into an object and return the result.
 * Returns the string if parsing results in an error.
 */
function tryParseJson(json) {
  try {
    return JSON.parse(json);
  }
  catch (e) {
    return json;
  }
}

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
 * __Note:__ When setting data properties, Firebolt will camelize dashed key names. For example, when setting data
 * with the key `foo-bar`, Firebolt will add the data to the element's stored data object with the key `fooBar`.
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
 * __Note:__ When setting data properties, Firebolt will camelize dashed key names. For example, when setting data
 * with the key `foo-bar`, Firebolt will add the data to the element's stored data object with the key `fooBar`.
 * 
 * @function Firebolt.data
 * @param {Object} object - An object. This can be anything that has Object in its prototype chain.
 * @param {Object} data - An object of key-value pairs to add to the object's stored data.
 * @returns {Object} The passed in object.
 */
Firebolt.data = function(object, key, value, isElement) {
  var expando = Firebolt.expando;
  var dataStore = object[expando];

  if (!dataStore) {
    // Define the data store object at a non-enumerable property
    defineProperty(object, expando, {
      value: dataStore = {}
    });

    // If the object is an Element, try loading "data-*" attributes
    if (isElement) {
      var attributes = object.attributes;
      var dataAttributes = {};
      var i = 0;
      var attrib;
      var val;

      for (; i < attributes.length; i++) {
        attrib = attributes[i];
        if (attrib.name.startsWith('data-')) {
          if (!rgxNoParse.test(val = attrib.value)) {
            val = tryParseJson(val); // Try to parse the string into a native object
          }
          // Set the value in the data attributes object and data store
          attrib = camelize(attrib.name.slice(5));
          dataStore[attrib] = dataAttributes[attrib] = val;
        }
      }

      // Save the data attributes if there are any
      if (!isEmptyObject(dataAttributes)) {
        object._$DA_ = dataAttributes;
      }
    }
  }

  if (value === UNDEFINED) {
    if (typeof key == 'object') {
      extend(dataStore, key); // Set multiple
    } else {
      if (key === UNDEFINED) {
        return dataStore; // Get the data store object
      }

      // Get the data at the specified name
      if ((value = dataStore[key = camelize(key)]) === UNDEFINED && object._$DA_) {
        // Save the data-* attribute value to the data store and return it
        return dataStore[key] = object._$DA_[key];
      }

      return value;
    }
  } else {
    dataStore[camelize(key)] = value; // Set value
  }

  return object;
};

/**
 * Determines if the object has any Firebolt data associated with it.
 * 
 * @function Firebolt.hasData
 * @param {Object} object - An object. This can be anything that has Object in its prototype chain.
 * @returns {Boolean} `true` if the object has stored Firebolt data; else `false`.
 */
Firebolt.hasData = function(object) {
  return !isEmptyObject(object[Firebolt.expando]);
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
  var dataStore = object[Firebolt.expando];
  var i = 0;

  // First make sure the data store object exists
  if (dataStore) {
    if (typeofString(list)) {
      list = list.split(' ');
    } else if (!list) {
      list = keys(dataStore); // Select all items for removal
    }

    for (; i < list.length; i++) {
      delete dataStore[camelize(list[i])];
    }
  }
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
 * @summary
 * Get the value at the named data store for the element as set by `.data(key, value)` or by an HTML5 data-* attribute.
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
  return Firebolt.data(this, key, value, 1); // Pass in 1 to tell the generic function the object is an element
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
 * Gets the first element's stored data object.
 * 
 * @function NodeCollection#data
 * @returns {Object} The element's stored data object.
 */
/**
 * Get the value at the named data store for the first element as set by
 * `.data(key, value)` or by an HTML5 data-* attribute.
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
