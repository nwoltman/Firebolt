/**
 * Provides the Firebolt function for making basic AJAX calls.
 * 
 * @module ajax/basic
 * @requires core
 */

/* global Firebolt */
/* global _undefined */
/* global timestamp */
/* global isArray */
/* global isPlainObject */
/* global typeofString */
/* global createElement */
/* global extend */
/* global serialize */

'use strict';


//#region VARS

var ajaxSettings = {
  async: true,
  isLocal: /^(?:file|.*-extension|widget):/.test(location.href),
  type: 'GET',
  url: location.href
};

var rgxDataType = /\b(?:xml|json)\b|script\b/; // Matches a data type in a Content-Type header

//#endregion VARS


function noop() { }

/**
 * @summary Perform an asynchronous HTTP (AJAX) request.
 * @description For more information on the `settings` parameter, see the next `$.ajax` section.
 * 
 * @function Firebolt.ajax
 * @variation 1
 * @param {String} url - A string containing the URL to which the request will be sent.
 * @param {Object} [settings] - A set of key-value pairs that configure the Ajax request. All settings are optional.
 * @returns {XMLHttpRequest} The XMLHttpRequest object this request is using
 *     (returns a mock XMLHttpRequest object when the `dataType` is `"script"`).
 */
/**
 * @summary Perform an asynchronous HTTP (AJAX) request.
 * 
 * @description
 * The `settings` object can be used to configure the AJAX request beyond the default functionality.
 * Details for the settings provided by Firebolt's basic AJAX module are as follows:
 * <hr>
 * <dl id="ajax-settings">
 *   <dt>
 *     async <span><code>true</code></span>
 *   </dt>
 *   <dd>
 *     Type: Boolean<br>
 *     By default, all requests are sent asynchronously. If you need synchronous requests, set this option to `false`.
 *     Cross-domain requests requests do not support synchronous operation. Note that synchronous requests may
 *     temporarily lock the browser, disabling any actions while the request is active.
 *     <hr>
 *   </dd>
 *   <dt>beforeSend</dt>
 *   <dd>
 *     Type: {@link Function}(XMLHttpRequest xhr, {@link Object} settings)<br>
 *     A pre-request callback function that can be used to modify the XMLHttpRequest object before it is sent.
 *     Use this to set custom headers, etc. The XMLHttpRequest and settings objects are passed as arguments.
 *     Returning `false` in the `beforeSend` function will cancel the request.
 *     <hr>
 *   </dd>
 *   <dt>
 *     cache <span><code>true</code>, <code>false</code> for dataType 'script'</span>
 *   </dt>
 *   <dd>
 *     Type: Boolean<br>
 *     If set to `false`, it will force requested pages not to be cached by the browser. __Note:__ Setting `cache`
 *     to `false` will only work correctly with HEAD and GET requests. It works by appending "&#95;=[TIMESTAMP]"
 *     to the GET parameters. The parameter is not needed for other types of requests.
 *     <hr>
 *   </dd>
 *   <dt>complete</dt>
 *   <dd>
 *     Type: {@link Function}(XMLHttpRequest xhr, {@link String} textStatus)<br>
 *     A function to be called when the request finishes (after `success` and `error` callbacks are executed).
 *     The function gets passed two arguments: The XMLHttpRequest object and a string categorizing the status
 *     of the request (`"success"`, `"nocontent"`, `"error"`, `"timeout"`, `"abort"`, or `"parsererror"`).
 *     <hr>
 *   </dd>
 *   <dt>
 *     contentType <span>'application/x-www-form-urlencoded; charset=UTF-8'</span>
 *   </dt>
 *   <dd>
 *     Type: {@link String}<br>
 *     When sending data to the server, use this content type. If you explicitly pass in a content-type to
 *     `$.ajax()`, then it is always sent to the server (even if no data is sent). The W3C XMLHttpRequest
 *     specification dictates that the charset is always UTF-8; specifying another charset will not force
 *     the browser to change the encoding. __Note:__ For cross-domain requests, setting the content type to
 *     anything other than `"application/x-www-form-urlencoded"`, `"multipart/form-data"`, or `"text/plain"`
 *     will trigger the browser to send a preflight OPTIONS request to the server.
 *     <hr>
 *   </dd>
 *   <dt>
 *     crossDomain
 *     <span><code>false</code> for same-domain requests, <code>true</code> for cross-domain requests</span>
 *   </dt>
 *   <dd>
 *     Type: Boolean<br>
 *     If you wish to force a cross-domain request on the same domain, set the value of `crossDomain` to
 *     `true`. This allows, for example, server-side redirection to another domain. __Note:__ this setting
 *     essentially does nothing if `dataType` is anything other than "script".
 *     <hr>
 *   </dd>
 *   <dt>data</dt>
 *   <dd>
 *     Type: {@link String}, {@link Object}, or {@link Array}<br>
 *     Data to be sent to the server. It is appended to the URL for all non-POST requests and sent in
 *     the body of the request for POST requests. If it is a plain object or array, it is converted to
 *     a query string. How Firebolt serializes data to a query string is determined by the `traditional`
 *     setting (described below). __Note:__ only plain objects and true arrays are serialized. Firebolt
 *     will attempt to send any other object (e.g. `FormData`) as-is.
 *     <hr>
 *   </dd>
 *   <dt>
 *     dataType <span>Intelligent Guess (xml, json, script, or html)</span>
 *   </dt>
 *   <dd>
 *     Type: {@link String}<br>
 *     The type of data that you're expecting back from the server. If none is specified, Firebolt will try
 *     to infer it based on the MIME type of the response (an XML MIME type will yield XML, JSON will yield
 *     a JavaScript object, script will execute the script, and anything else will be returned as a string).
 *     The available types (and the result passed as the first argument to the `success` callback) are:
 *     <ul>
 *       <li>"xml": Returns an XML document.</li>
 *       <li>"html": Returns HTML as plain text.</li>
 *       <li>
 *         "script": Evaluates the response as JavaScript and returns it as plain text. Disables caching by
 *         appending a query string parameter, "&#95;=[TIMESTAMP]", to the URL unless the `cache` option is
 *         set to `true`. __Note:__ This will turn all request types into GETs for cross-domain requests.
 *       </li>
 *       <li>
 *         "json": Evaluates the response as JSON and returns a JavaScript object. The JSON data is parsed in
 *         a strict manner; any malformed JSON is rejected and a parse error is thrown. For example, an empty
 *         response will cause an error; the server should return a response of `null` or `{}` instead.
 *       </li>
 *       <li>"text": A plain text string.</li>
 *     </ul>
 *     <hr>
 *   </dd>
 *   <dt>error</dt>
 *   <dd>
 *     Type: {@link Function}(XMLHttpRequest xhr, {@link String} textStatus[, {@link Exception} error])<br>
 *     A function to be called if the request fails. The function receives three arguments: The XMLHttpRequest
 *     object, a string describing the type of error that occurred, and an optional exception object, if one
 *     occurred. Possible values for the second argument are "timeout", "error", "abort", and "parsererror".
 *     <hr>
 *   </dd>
 *   <dt>
 *     headers <span>{}</span>
 *   </dt>
 *   <dd>
 *     Type: {@link Object}<br>
 *     An object of header key-value pairs to send along with requests using the XMLHttpRequest transport.
 *     <hr>
 *   </dd>
 *   <dt>
 *     isLocal <span>depends on current location protocol</span>
 *   </dt>
 *   <dd>
 *     Type: Boolean<br>
 *     Allow the current environment to be recognized as "local," (e.g. the filesystem), even if Firebolt
 *     does not recognize it as such by default. The following protocols are currently recognized as local:
 *     `file`, `*-extension`, and `widget`. If the `isLocal` setting needs modification, it is recommended
 *     to do so once in the `$.ajaxSetup()` method.
 *     <hr>
 *   </dd>
 *   <dt>mimeType</dt>
 *   <dd>
 *     Type: {@link String}<br>
 *     A mime type to override the XMLHttpRequest mime type.
 *     <hr>
 *   </dd>
 *   <dt>password</dt>
 *   <dd>
 *     Type: {@link String}<br>
 *     A password to be sent with the XMLHttpRequest in response to a HTTP access authentication request.
 *     <hr>
 *   </dd>
 *   <dt>scriptCharset</dt>
 *   <dd>
 *     Type: {@link String}<br>
 *     Only applies when the "script" transport is used (e.g., cross-domain requests with "script" dataType
 *     and "GET" type). Sets the `charset` attribute on the script tag used in the request. Used when the
 *     character set on the local page is not the same as the one on the remote script.
 *     <hr>
 *   </dd>
 *   <dt>success</dt>
 *   <dd>
 *     Type: {@link Function}(&#42; data, {@link String} textStatus, XMLHttpRequest xhr)<br>
 *     A function to be called if the request succeeds. The function gets passed three arguments: The data
 *     returned from the server, a string describing the status, and the XMLHttpRequest object. Possible
 *     values for the second argument are "success", and "nocontent".
 *     <hr>
 *   </dd>
 *   <dt>timeout</dt>
 *   <dd>
 *     Type: {@link Number}<br>
 *     Set a timeout (in milliseconds) for the request. This will override any global timeout set with
 *     `$.ajaxSetup()`. The timeout period starts at the point the `$.ajax()` call is made; if several
 *     other requests are in progress and the browser has no connections available, it is possible for a
 *     request to time out before it can be sent. The XMLHttpRequest object will be in an invalid state if
 *     the request times out; accessing any object members may throw an exception. __Note:__, cross-domain
 *     "script" requests cannot be cancelled by a timeout; the script will run even if it arrives after
 *     the timeout period.
 *     <hr>
 *   </dd>
 *   <dt>
 *     traditional <span><code>false</code></span>
 *   </dt>
 *   <dd>
 *     Type: Boolean<br>
 *     Set this to `true` if you wish to use the traditional style of {@link Firebolt.param|param serialization}.
 *     <hr>
 *   </dd>
 *   <dt>
 *     type <span>'GET'</span>
 *   </dt>
 *   <dd>
 *     Type: {@link String}<br>
 *     The type of request to make (e.g. "POST", "GET", "PUT", "HEAD", "DELETE"). The string should be in ALL CAPS.
 *     <hr>
 *   </dd>
 *   <dt>
 *     url <span>the current page</span>
 *   </dt>
 *   <dd>
 *     Type: {@link String}<br>
 *     A string containing the URL to which the request is sent.
 *     <hr>
 *   </dd>
 *   <dt>username</dt>
 *   <dd>
 *     Type: {@link String}<br>
 *     A username to be sent with the XMLHttpRequest in response to a HTTP access authentication request.
 *     <hr>
 *   </dd>
 *   <dt>xhrFields</dt>
 *   <dd>
 *     Type: {@link Object}<br>
 *     An object of fieldName-fieldValue pairs to set on the XMLHttpRequest object. For example, you can
 *     use it to set `withCredentials` to `true` for cross-domain requests if needed.
 * ```javascript
 * $.ajax({
 *   url: a_cross_domain_url,
 *   xhrFields: {
 *     withCredentials: true
 *   }
 * });
 * ```
 *     <hr>
 *   </dd>
 * </dl>
 * 
 * To get even more AJAX features (such as JSONP support), use the
 * [Firebolt AJAX extension](https://github.com/woollybogger/firebolt-extensions/tree/master/ajax).
 * 
 * @function Firebolt.ajax
 * @variation 2
 * @param {Object} [settings] - A set of key-value pairs that configure the Ajax request. All settings are optional.
 * @returns {XMLHttpRequest} The XMLHttpRequest object this request is using
 *     (returns a mock XMLHttpRequest object when the `dataType` is `"script"`).
 */
Firebolt.ajax = function(url, settings) {
  // Parameter processing
  if (typeofString(url)) {
    settings = settings || {};
    settings.url = url;
  } else {
    settings = url;
  }

  // Merge the passed in settings object with the default values
  settings = extend(true, {}, ajaxSettings, settings);

  url = settings.url;

  var beforeSend = settings.beforeSend;
  var complete = settings.complete || noop;
  var error = settings.error || noop;
  var success = settings.success || noop;
  var timeout = settings.timeout;
  var type = settings.type.toUpperCase();
  var dataType = settings.dataType;
  var data = settings.data;
  var textStatus, xhr;

  if (data) {
    // Process data if necessary
    if (isArray(data) || isPlainObject(data)) {
      data = serialize(data, 0, settings.traditional);
    }

    // If the request is not a POST request, append the data string to the URL
    if (type != 'POST') {
      url = url.appendParams(data);
      data = _undefined; // Clear the data so it is not sent later on
    }
  }

  if (dataType == 'script' &&
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
        if (timeout) {
          clearTimeout(timeout);
        }
        script.remove();
        success(data, textStatus = 'success', xhr);
        complete(xhr, textStatus);
      },
      onerror: function(e) {
        if (timeout) {
          clearTimeout(timeout);
        }
        script.remove();
        error(xhr, textStatus = textStatus || 'error', e);
        complete(xhr, textStatus);
      }
    });

    // Create a sort-of XHR object
    xhr = {
      send: function() {
        // Append the script to the head of the document to load it
        document.head.appendChild(script);
      },
      abort: function() {
        textStatus = 'abort';
        script.onerror();
      }
    };

  } else { // Set up a true XHR

    xhr = extend(new XMLHttpRequest(), settings.xhrFields); // Create the XHR and give it settings

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

    var headers = settings.headers || {};
    var contentType = settings.contentType;

    // Set the content type header if there is data to submit or the user has specifed a particular content type
    if (data || contentType) {
      headers['Content-Type'] = contentType || 'application/x-www-form-urlencoded; charset=UTF-8';
    }

    // Set the request headers in the XHR
    for (contentType in headers) { // Reuse the `contentType` variable
      xhr.setRequestHeader(contentType, headers[contentType]);
    }

    // The main XHR function for when the request has loaded
    xhr.onreadystatechange = function() {
      if (xhr.readyState < 4) {
        return;
      }

      if (timeout) {
        clearTimeout(timeout);
      }

      var statusCode = xhr.status;

      if (statusCode >= 200 && statusCode < 300 || statusCode === 304 ||
          settings.isLocal && xhr.responseText) { // Success

        if (statusCode === 204 || type == 'HEAD') { // If no content
          textStatus = 'nocontent';
        } else {
          textStatus = 'success';
        }

        try {
          // Only need to process data of there is content
          if (textStatus != 'nocontent') {
            // If the data type has not been set, try to figure it out
            if (!dataType) {
              if ((dataType = rgxDataType.exec(xhr.getResponseHeader('Content-Type')))) {
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

              if (dataType == 'script') {
                Firebolt.globalEval(data);
              }
            }
          } else {
            data = '';
          }

          success(data, textStatus, xhr); // Invoke the success callback
        }
        catch (e) {
          error(xhr, textStatus = 'parsererror', e);
        }
      } else { // Error
        if (textStatus != 'timeout') {
          textStatus = xhr.readyState < 3 ? 'abort' : 'error';
        }
        error(xhr, textStatus);
      }

      complete(xhr, textStatus); // Invoke the complete callback
    };
  }

  if (beforeSend && beforeSend(xhr, settings) === false) {
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
