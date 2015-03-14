/**
 * Extends the Number class with ES6 functionality.
 * 
 * @module number/es6
 * @requires core
 * 
 * @closure_globals Number
 */

'use strict';


if (!Number.EPSILON) {
  /**
   * The difference between 1 and the smallest value greater than 1
   * that can be represented as a {@link Number}.
   * 
   * @memberOf Number
   */
  Number.EPSILON = 2.220446049250313e-16;
}

if (!Number.MAX_SAFE_INTEGER) {
  /**
   * The maximum safe integer in JavaScript (`2<sup>53</sup> - 1`).
   * 
   * @memberOf Number
   */
  Number.MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;
}

if (!Number.MIN_SAFE_INTEGER) {
  /**
   * The minimum safe integer in JavaScript (`-(2<sup>53</sup> - 1)`).
   * 
   * @memberOf Number
   */
  Number.MIN_SAFE_INTEGER = -Number.MAX_SAFE_INTEGER;
}

/**
 * Determines if the passed value is a finite number.
 * 
 * @function Number.isFinite
 * @param {*} value - The value to be tested for finiteness.
 * @returns {Boolean} `true` if the value is finite, `false` otherwise.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isFinite|Number.isFinite() - JavaScript | MDN}
 */
Number.isFinite = Number.isFinite || function(value) {
  return typeof value == 'number' && isFinite(value);
};

/**
 * Determines if the passed value is an integer.
 * 
 * @function Number.isInteger
 * @param {*} value - The value to be tested for being an integer.
 * @returns {Boolean} `true` if the value is an integer, `false` otherwise.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger|Number.isInteger() - JavaScript | MDN}
 */
Number.isInteger = Number.isInteger || function(value) {
  return Number.isFinite(value) && Math.floor(value) === value;
};

/**
 * Determines if the passed value is NaN (not a number).
 * 
 * @function Number.isNaN
 * @param {*} value - The value to be tested for NaN.
 * @returns {Boolean} `true` if the value is NaN, `false` otherwise.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN|Number.isNaN() - JavaScript | MDN}
 */
Number.isNaN = Number.isNaN || function(value) {
  return typeof value == 'number' && value !== value;
};

/**
 * Determines if the passed value is a safe integer.
 * 
 * @function Number.isSafeInteger
 * @param {*} value - The value to be tested for being a safe integer.
 * @returns {Boolean} `true` if the value is a safe integer, `false` otherwise.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isSafeInteger|Number.isSafeInteger() - JavaScript | MDN}
 */
Number.isSafeInteger = Number.isSafeInteger || function(value) {
  return Number.isInteger(value) && Number.MIN_SAFE_INTEGER <= value && value <= Number.MAX_SAFE_INTEGER;
};

/**
 * Parses a string argument and returns a floating point number.
 * 
 * @function Number.parseFloat
 * @param {*} value - A string that represents the value you want to parse.
 * @returns {Number}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/parseFloat|Number.parseFloat() - JavaScript | MDN}
 */
Number.parseFloat = parseFloat;

/**
 * Parses a string argument and returns an integer of the specified radix or base.
 * 
 * @function Number.parseFloat
 * @param {*} value - A string that represents the value you want to parse.
 * @param {Number} [radix=10] - An integer between 2 and 36 that represents the radix
 *     (the base in mathematical numeral systems) of the above mentioned string.
 * @returns {Number}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/parseInt|Number.parseInt() - JavaScript | MDN}
 */
Number.parseInt = parseInt;
