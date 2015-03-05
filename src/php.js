/**
 * Adds some PHP-like functionality to Firebolt.
 * 
 * @module php
 * @requires core
 */

'use strict';


//#region VARS

var getCache = {
  raw: UNDEFINED,
  map: UNDEFINED
};
var cookieCache = {
  raw: UNDEFINED,
  map: UNDEFINED
};

//#endregion VARS


/**
 * Parses an array of key-value parameters into a key-value object map.
 * 
 * @private
 * @param {String} value - The value to parse into a key-value map.
 * @param {Object} cache - The cache containing the last raw value and current map.
 * @param {String|RegExp} split - A parameter used to split the value into parts when parsing.
 */
function getCachedOrParse(value, cache, split) {
  if (value !== cache.raw) {
    cache.raw = value;
    cache.map = {};

    var params = value.split(split);
    var param, eqIndex;

    for (var i = 0; i < params.length; i++) {
      if (param = params[i]) {
        eqIndex = param.indexOf('=');
        cache.map[decodeURIComponent(eqIndex < 0 ? param : param.slice(0, eqIndex))] =
          eqIndex < 0 ? '' : decodeURIComponent(param.slice(eqIndex + 1));
      }
    }
  }
  
  return cache.map;
}

/**
 * Returns a PHP-style Object of URL parameters.
 * 
 * @function Firebolt._GET
 * @returns {Object.<String, String>}
 * @see {@link http://www.php.net/manual/en/reserved.variables.get.php|PHP: $_GET - Manual}
 */
Firebolt._GET = function() {
  return getCachedOrParse(location.search.slice(1), getCache, '&');
};

/**
 * Returns a PHP-style Object of the cookies that can be accessed with JavaScript.
 * 
 * @function Firebolt._COOKIE
 * @returns {Object.<String, String>}
 * @see {@link http://php.net/manual/en/reserved.variables.cookies.php|PHP: $_COOKIE - Manual}
 */
Firebolt._COOKIE = function() {
  return getCachedOrParse(document.cookie, cookieCache, '; ');
};

/**
 * Sets a cookie (or removes one, depending on the passed arguments).
 * 
 * @function Firebolt.setcookie
 * @param {String} name - The name of the cookie. This can not be:
 *     `expires`, `max-age`, `path`, `domain`, or `secure`.
 * @param {String} value - The value of the cookie.
 * @param {Number|String|Date} [expire] - The time the cookie expires. This can be a Unix
 *     timestamp integer, a date string, or a Date object. Pass in `Infinity` to set the
 *     longest possible expirey time. By default, to cookie is set to expire at the end
 *     of the user's current session. Setting this to a date/time in the past will remove
 *     the cookie (can do this by passing in a negative number).
 * @param {String} [path] - The path on the server in which the cookie will be available on.
 *     Defaults to the current URL path.
 * @param {String} [domain] - The domain that the cookie is available to. Setting the domain
 *     to 'www.example.com' will make the cookie available in the www subdomain and higher
 *     subdomains. Cookies available to a lower domain, such as 'example.com' will be available
 *     to higher subdomains, such as 'www.example.com'. Defaults to the value of `document.domain`.
 * @param {Boolean} [secure=false] - Indicates that the cookie should only be transmitted over
 *     a secure HTTPS connection.
 * @see {@link http://php.net/manual/en/function.setcookie.php|PHP: setcookie - Manual}
 * 
 * @description
 * Once a cookie has been set, it can be accessed immediately by {Firebolt._COOKIE}.
 */
Firebolt.setcookie = function(name, value, expire, path, domain, secure) {
  document.cookie =
    encodeURIComponent(name) + '=' + encodeURIComponent(value) +
    (expire ?
      typeof expire == 'number'
        ? expire === Infinity ? ';expires=Fri, 31 Dec 9999 23:59:59 GMT' : ';max-age=' + expire
        : ';expires=' + (expire instanceof Date ? expire.toUTCString() : expire)
     : '') +
    (domain ? ';domain=' + domain : '') + (path ? ';path=' + path : '') + (secure ? ';secure' : '');
};
