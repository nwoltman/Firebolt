/**
 * Extends Number.prototype with extra functionality.
 * 
 * @module number
 * @requires core
 */

'use strict';


/**
 * @class Number
 * @classdesc The native JavaScript Number object.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number|Number - JavaScript | MDN}
 */

/**
 * Returns a string representation of the number padded with leading 0s so
 * that the string's length is at least equal to `length`.
 * 
 * @function Number#toPaddedString
 * @param {Number} length - The minimum length for the resulting string.
 * @param {Number} [radix=10] - Defines which base to use for representing the numeric value.
 *     Must be an integer between 2 and 36.
 * 
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
