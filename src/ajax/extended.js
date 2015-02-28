/**
 * Provides the Firebolt function for making AJAX calls with extended functionality.
 * 
 * @module ajax/extended
 * @overrides ajax/basic
 * @requires core
 */

/* global createElement, extend, isPlainObject */

'use strict';


//#region VARS

var ajaxSettings = {
  accepts: {
    '*': '*/*',
    html: 'text/html',
    json: 'application/json, text/javascript',
    script: 'text/javascript, application/javascript, application/ecmascript, application/x-ecmascript',
    text: 'text/plain',
    xml: 'application/xml, text/xml'
  },
  async: true,
  headers: {'X-Requested-With': 'XMLHttpRequest'},
  isLocal: /^(?:file|.*-extension|widget):/.test(location.href),
  jsonp: 'callback',
  jsonpCallback: function() {
    var callback = oldCallbacks.pop() || Firebolt.expando + '_' + (timestamp++);
    this[callback] = true;
    return callback;
  },
  type: 'GET',
  url: location.href,
  xhr: XMLHttpRequest
};

var rgxDataType = /\b(?:xml|json)\b|script\b/; // Matches a data type in a Content-Type header

var oldCallbacks = [];
var lastModifiedValues = {};

//#endregion VARS


/*
 * Returns the status text string for AJAX requests.
 */
function getAjaxErrorStatus(xhr) {
  return xhr.readyState ? xhr.statusText.replace(xhr.status + ' ', '') : '';
}

/**
 * @summary Perform an asynchronous HTTP (AJAX) request.
 * 
 * @description
 * This is the extended version of `$.ajax()`, and is closer to jQuery's version of `$.ajax()`.
 * 
 * For documentation, see {@link http://api.jquery.com/jQuery.ajax/|jQuery.ajax()}.
 * However, Firebolt AJAX requests differ from jQuery's in the following ways:
 * 
 * + Instead of passing a "jqXHR" to callbacks, the native XMLHttpRequest object is passed.
 * + The `contents` and `converters` settings are not supported.
 * + The `data` setting may be a string or a plain object or array to serialize and is appended
 *   to the URL as a string for any request that is not a POST request.
 * + The `processData` setting has been left out because Firebolt will automatically process only
 *   plain objects and arrays (so you wouldn't need to set it to `false` to send another type of
 *   data&emsp;such as a FormData object).
 * + The `global` setting and the global AJAX functions defined by jQuery are not supported.
 * 
 * @function Firebolt.ajax
 * @variation 3
 * @param {Object} [settings] - A set of key-value pairs that configure the Ajax request. All settings are optional.
 * @returns {XMLHttpRequest} The XMLHttpRequest object this request is using
 *     (returns a mock XMLHttpRequest object when the `dataType` is `"script"` or `"jsonp"`).
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

  // Merge the passed in settings object with the default values
  settings = extend(true, {}, ajaxSettings, settings);

  url = settings.url;

  var beforeSend = settings.beforeSend;
  var complete = settings.complete || [];
  var completes = isArray(complete) ? complete : [complete];
  var context = settings.context || settings;
  var dataType = settings.dataType;
  var dataTypeJSONP = dataType === 'jsonp';
  var error = settings.error || [];
  var errors = isArray(error) ? error : [error];
  var headers = settings.headers;
  var ifModified = settings.ifModified;
  var lastModifiedValue = ifModified && lastModifiedValues[url];
  var success = settings.success;
  var successes = isArray(success) ? success : [success];
  var timeout = settings.timeout;
  var type = settings.type.toUpperCase();
  var data = settings.data;
  var textStatus, statusCode, xhr, i;

  function callCompletes(errorThrown) {
    if (timeout) {
      clearTimeout(timeout);
    }

    // Execute the status code callback (if there is one that matches the status code)
    if (settings.statusCode) {
      var callback = settings.statusCode[statusCode];
      if (callback) {
        if (textStatus == 'success') {
          callback.call(context, data, textStatus, xhr);
        } else {
          callback.call(context, xhr, textStatus, errorThrown || getAjaxErrorStatus(xhr));
        }
      }
    }

    // Execute all the complete callbacks
    for (i = 0; i < completes.length; i++) {
      completes[i].call(context, xhr, textStatus);
    }
  }

  function callErrors(errorThrown) {
    // Execute all the error callbacks
    for (i = 0; i < errors.length; i++) {
      errors[i].call(context, xhr, textStatus, errorThrown || getAjaxErrorStatus(xhr));
    }
  }

  function callSuccesses() {
    // Handle last-minute JSONP
    if (dataTypeJSONP) {
      // Call errors and return if the JSONP function was not called
      if (!responseContainer) {
        textStatus = 'parsererror';
        return callErrors(jsonpCallback + ' was not called');
      }

      // Set the data to the first item in the response
      data = responseContainer[0];
    }

    if (success) {
      // Call the user-supplied data filter function if there is one
      if (settings.dataFilter) {
        data = settings.dataFilter(data, dataType);
      }
      // Execute all the success callbacks
      for (i = 0; i < successes.length; i++) {
        successes[i].call(context, data, textStatus, xhr);
      }
    }
  }

  if (data) {
    // Process data if necessary
    if (isArray(data) || isPlainObject(data)) {
      data = serialize(data, 0, settings.traditional);
    }

    // If the request is not a POST request, append the data string to the URL
    if (type != 'POST') {
      url = url.appendParams(data);
      data = null; // Clear the data so it is not sent later on
    }
  }

  if (dataTypeJSONP) {
    var jsonpCallback = settings.jsonpCallback;
    var responseContainer, overwritten;

    if (!typeof(jsonpCallback)) {
      jsonpCallback = settings.jsonpCallback();
    }

    // Append the callback name to the URL
    url = url.appendParams(settings.jsonp + '=' + jsonpCallback);

    // Install callback
    overwritten = window[jsonpCallback];
    window[jsonpCallback] = function() {
      responseContainer = arguments;
    };

    // Push JSONP cleanup onto complete callback array
    completes.push(function() {
      // Restore preexisting value
      window[jsonpCallback] = overwritten;

      if (settings[jsonpCallback]) {
        // Save the callback name for future use
        oldCallbacks.push(jsonpCallback);
      }

      // Call if `overwritten` was a function and there was a response
      if (responseContainer && typeof overwritten == 'function') {
        overwritten(responseContainer[0]);
      }

      responseContainer = overwritten = _undefined;
    });
  }

  if ((dataType === 'script' || dataTypeJSONP) &&
      (settings.crossDomain ||
       url.indexOf('//') >= 0 && url.indexOf('//' + document.domain) < 0 ||
       settings.isLocal)) { // Set up an HTML script loader

    // Prevent caching unless the user explicitly set cache to true
    if (settings.cache !== true) {
      url = url.appendParams('_=' + (timestamp++));
    }

    var script = createElement('script').prop({
      charset: settings.scriptCharset || '',
      src: url,
      onload: function() {
        textStatus = 'success';
        callSuccesses();
        callCompletes();
      },
      onerror: function(e) {
        textStatus = textStatus || 'error';
        callErrors(e && e.type);
        callCompletes(e ? e.type : textStatus);
      }
    });

    // Create a sort-of XHR object
    xhr = {
      send: function() {
        // Append the script to the head of the document to load it
        document.head.appendChild(script);
      },
      abort: function() {
        textStatus = textStatus || 'abort';
        script.onerror();
      }
    };

    // Always remove the script after the request is done
    completes.push(function fn() {
      script.remove();
      completes.remove(fn);
    });

  } else { // Set up a true XHR

    xhr = extend(new settings.xhr(), settings.xhrFields); // Create the XHR and give it settings

    // Override the requested MIME type in the XHR if there is one specified in the settings
    if (settings.mimeType) {
      xhr.overrideMimeType(settings.mimeType);
    }

    // Prevent caching if necessary
    if ((type == 'GET' || type == 'HEAD') && settings.cache === false) {
      url = url.appendParams('_=' + (timestamp++));
    }

    // Open the request
    xhr.open(type, url, settings.async, settings.username, settings.password);

    // Set the content type header if there is data to submit or the user has specifed a particular content type
    if (data || settings.contentType) {
      headers['Content-Type'] = settings.contentType || 'application/x-www-form-urlencoded; charset=UTF-8';
    }

    // If the data type has been set, set the accept header
    if (settings.dataType) {
      headers.Accept = settings.accept[settings.dataType] || settings.accept['*'];
    }

    // If there is a lastModifiedValue URL, set the 'If-Modified-Since' header
    if (lastModifiedValue) {
      headers['If-Modified-Since'] = lastModifiedValue;
    }

    // Set the request headers in the XHR
    for (i in headers) {
      xhr.setRequestHeader(i, headers[i]);
    }

    // The main XHR function for when the request has loaded (and track states in between for abort or timeout)
    xhr.onreadystatechange = function() {
      if (xhr.readyState < 4) {
        return;
      }

      statusCode = xhr.status;

      if (statusCode >= 200 && statusCode < 300 || statusCode === 304 ||
          settings.isLocal && xhr.responseText) { // Success

        if (statusCode === 204 || type == 'HEAD') {
          textStatus = 'nocontent';
        } else if (ifModified && url in lastModifiedValues && statusCode === 304) {
          textStatus = 'notmodified';
        } else {
          textStatus = 'success';
          if (ifModified) {
            lastModifiedValues[url] = xhr.getResponseHeader('Last-Modified');
          }
        }

        try {
          // Only need to process data of there is content
          if (textStatus != 'nocontent') {
            // If the data type has not been set, try to figure it out
            if (!dataType) {
              if (dataType = rgxDataType.exec(xhr.getResponseHeader('Content-Type'))) {
                dataType = dataType[0];
              }
            }

            // Set data based on the data type
            if (dataType == 'xml') {
              data = xhr.responseXML;
            } else if (dataType == 'json') {
              data = JSON.parse(xhr.responseText);
            } else {
              data = xhr.responseText;
              if (dataType == 'script' || dataTypeJSONP) {
                Firebolt.globalEval(data);
              }
            }
          } else {
            data = '';
          }

          callSuccesses();
        }
        catch (e) {
          textStatus = 'parsererror';
          callErrors();
        }
      } else { // Error
        textStatus = textStatus || (xhr.readyState < 3 ? 'abort' : 'error');
        callErrors();
      }

      callCompletes();
    };
  }

  if (beforeSend && beforeSend.call(context, xhr, settings) === false) {
    return false; // Do not send the request
  }

  // Set a timeout if there is one
  if (timeout > 0) {
    timeout = setTimeout(function() {
      textStatus = 'timeout';
      xhr.abort();
    }, timeout);
  }

  xhr.send(data); // Send the request

  return xhr;
};
