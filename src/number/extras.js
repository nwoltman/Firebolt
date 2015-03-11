/**
 * Extends Number.prototype with extra functionality.
 * 
 * @module number/extras
 * @requires core
 */

'use strict';


/**
 * @class Number
 * @classdesc The native JavaScript Number object.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number|Number - JavaScript | MDN}
 */

definePrototypeExtensionsOn(Number[prototype], {
  /**
   * Checks if the number is between `start` and up to, but not including, `end`.
   * If `end` is not specified, it is set to `start` with `start` then set to `0`.
   * 
   * @function Number#isInRange
   * @param {Number} [start=0] - The start of the range (inclusive).
   * @param {Number} end - The end of the range (exclusive).
   * @returns {Boolean} `true` if this number is in the range, `false` otherwise.
   * 
   * @example
   * (3).isInRange(2, 4);
   * // -> true
   * 
   * (4).isInRange(8);
   * // -> true
   * 
   * (4).isInRange(2);
   * // -> false
   * 
   * (2).isInRange(2);
   * // -> false
   * 
   * (1.2).isInRange(2);
   * // -> true
   * 
   * (0).isInRange(-1, 1);
   * // -> true
   */
  isInRange: function(start, end) {
    if (end === UNDEFINED) {
      end = start;
      start = 0;
    }

    return (start || 0) <= this && this < (end || 0);
  },

  /**
   * Returns a string representation of the number padded with leading 0s so
   * that the string's length is at least equal to `length`.
   * 
   * @function Number#toPaddedString
   * @param {Number} length - The minimum length for the resulting string.
   * @param {Number} [radix=10] - Defines which base to use for representing the numeric value.
   *     Must be an integer between 2 and 36.
   * @returns {String}
   * 
   * @example
   * (255).toPaddedString(4);
   * // -> "0255"
   * 
   * (255).toPaddedString(4, 16);
   * // -> "00ff"
   * 
   * (25589).toPaddedString(4);
   * // -> "25589"
   * 
   * (3).toPaddedString(5, 2);
   * // -> "00011"
   * 
   * (-3).toPaddedString(5, 2);
   * // -> "-0011"
   */
  toPaddedString: function(length, radix) {
    var sNumber = this.toString(radix);
    if (length > sNumber.length) {
      sNumber = '0'.repeat(length - sNumber.length) + sNumber;
    }
    return this < 0 ? '-' + sNumber.replace('-', '') : sNumber;
  }
});
