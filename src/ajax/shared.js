/**
 * Convenient shorthand AJAX methods.
 * 
 * @module ajax/shared
 * @requires core
 * @requiredBy ajax/basic, ajax/extended
 * 
 * @closure_globals encodeURIComponent
 */

/* global ajaxSettings */

'use strict';


/**
 * Sets default values for future Ajax requests. Use of this function is not recommended.
 * 
 * @function Firebolt.ajaxSetup
 * @param {Object} options - A set of key-value pairs that configure the default Ajax settings.
 *     All options are optional.
 */
Firebolt.ajaxSetup = function(options) {
  return extend(true, ajaxSettings, options);
};

/**
 * Load data from the server using a HTTP GET request.
 * 
 * @function Firebolt.get
 * @param {String} url - A string containing the URL to which the request will be sent.
 * @param {String|Object} [data] - A string or object that is sent to the server with the request as a query string.
 * @param {Function} [success(data, textStatus, xhr)] - A callback function that is executed if the request succeeds.
 *     Required if dataType is provided, but can be `null` in that case.
 * @param {String} [dataType] - The type of data expected from the server.
 *     Default: Intelligent Guess (xml, json, script, or html).
 */
Firebolt.get = function(url, data, success, dataType) {
  // Organize arguments into their proper places
  if (typeof data == 'function') {
    dataType = dataType || success; // Using || because when getJSON is called dataType will have a value
    success = data;
    data = '';
  } else if (typeofString(success)) {
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
 * @function Firebolt.getJSON
 * @param {String} url - A string containing the URL to which the request will be sent.
 * @param {String|Object} [data] - A string or object that is sent to the server with the request as a query string.
 * @param {Function} [success(data, textStatus, xhr)] - A callback function that is executed if the request succeeds.
 */
Firebolt.getJSON = function(url, data, success) {
  return Firebolt.get(url, data, success, 'json');
};

/**
 * Load a JavaScript file from the server using a HTTP GET request, then execute it.
 * 
 * @function Firebolt.getScript
 * @param {String} url - A string containing the URL to which the request will be sent.
 * @param {Function} [success(data, textStatus, xhr)] - A callback function that is executed if the request succeeds.
 */
Firebolt.getScript = function(url, success) {
  return Firebolt.get(url, '', success, 'script');
};

/**
 * Creates a serialized representation of an array or object, suitable for
 * use in a URL query string or AJAX request.
 * 
 * @function Firebolt.param
 * @param {Array|Object} obj - An array or object to serialize.
 * @param {Boolean} traditional - A Boolean indicating whether to perform a traditional "shallow" serialization.
 * @returns {String} The serialized string representation of the array or object.
 */
Firebolt.param = function serialize(obj, traditional, /*INTERNAL*/ prefix) {
  var queryString = '';
  var key, value, i, cur, valueIsObject;

  for (key in obj) {
    value = obj[key];
    if (typeof value == 'function') {
      value = value();
    }
    if (value == UNDEFINED) {
      value = '';
    }

    if (traditional) {
      // Add the key
      queryString += (queryString ? '&' : '') + encodeURIComponent(key);

      // Add the value
      if (isArray(value)) {
        for (i = 0; i < value.length; i++) {
          // Add key again for multiple array values
          queryString += (i ? '&' + encodeURIComponent(key) : '') +
                         '=' + encodeURIComponent(value[i] == UNDEFINED ? '' : value[i]);
        }
      } else {
        queryString += '=' + encodeURIComponent(value);
      }
    } else if (!(valueIsObject = isArray(value) || getClassOf(value) == 'Object') || !isEmptyObject(value)) {
      /* Inspired by: http://stackoverflow.com/questions/1714786/querystring-encoding-of-a-javascript-object */
      cur = prefix ? prefix + '[' + key + ']' : key;
      queryString += (queryString ? '&' : '') +
                     (valueIsObject ? serialize(value, traditional, cur)
                                    : encodeURIComponent(cur) + '=' + encodeURIComponent(value));
    }
  }

  return queryString;
};

/**
 * Load data from the server using a HTTP POST request.
 * 
 * @function Firebolt.post
 * @param {String} url - A string containing the URL to which the request will be sent.
 * @param {String|Object} [data] - A string or object that is sent to the server with the request.
 * @param {Function} [success(data, textStatus, xhr)] - A callback function that is executed if the request succeeds.
 *     Required if dataType is provided, but can be `null` in that case.
 * @param {String} [dataType] - The type of data expected from the server.
 *     Default: Intelligent Guess (xml, json, script, or html).
 */
Firebolt.post = function(url, data, success, dataType) {
  // Organize arguments into their proper places
  if (typeof data == 'function') {
    dataType = success;
    success = data;
    data = '';
  } else if (typeofString(success)) {
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
