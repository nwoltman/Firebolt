/**
 * Provides the camelize() function
 * @module private/camelize
 */

/* jshint unused:false */

'use strict';


/**
 * Returns a camelCase version of a string
 * 
 * @private
 * @param {String} str
 * @returns {String}
 */
function camelize(str) {
  var parts = str.split('-');
  var res = parts[0];
  var part;

  for (var i = 1; i < parts.length; i++) {
    if (part = parts[i]) {
      if (res) {
        res += part[0].toUpperCase() + part.slice(1);
      } else {
        res += part;
      }
    }
  }

  return res;
}
