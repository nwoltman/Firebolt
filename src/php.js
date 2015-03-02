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
