/**
 * Adds some ES6 functionality to native strings.
 * 
 * @module string/es6
 * @requires core
 */

'use strict';


//#region VARS

var StringPrototype = String[prototype];

//#endregion VARS


prototypeExtensions = {};

if (!StringPrototype.endsWith) {
  /**
   * Determines if a string ends with the characters of another string.
   *
   * @function String#endsWith
   * @param {String} searchString - The characters to be searched for at the end of this string.
   * @param {Number} [position=this.length] - Search within this string as if this string were only this long;
   * clamped within the range established by this string's length.
   * @returns {Boolean} `true` if this string ends with `searchString`; else `false`.
   * @example
   * var str = "Who am I, Gamling?";
   * alert( str.endsWith("Gamling?") );  // true
   * alert( str.endsWith("am I") );      // false
   * alert( str.endsWith("am I", 8) );   // true
   */
  prototypeExtensions.endsWith = function(searchString, position) {
    var str = this.toString(),
      strLen = str.length;
    position = (position < strLen ? position : strLen) - searchString.length;
    return position >= 0 && str.indexOf(searchString, position) === position;
  };
}

if (!StringPrototype.includes) {
  /**
   * Determines whether the passed in string is in the current string.
   *
   * @function String#includes
   * @param {String} searchString - The string to be searched for.
   * @param {Number} [position=0] - The position in this string at which to begin the search.
   * @returns {Boolean} `true` if this string contains the search string, `false` otherwise.
   * 
   * @example
   * var str = "Winter is coming.";
   * str.includes(" is ")  ; // -> true
   * str.includes("summer"); // -> false
   */
  prototypeExtensions.includes = function() {
    return StringPrototype.indexOf.apply(this, arguments) >= 0;
  };
}

if (!StringPrototype.repeat) {
  /**
   * Copies the current string a given number of times and returns the new string.
   *
   * @function String#repeat
   * @param {Number} count - An integer between 0 and +∞ : [0, +∞).
   * @returns {String}
   * @throws {RangeError} The repeat count must be positive and less than infinity.
   * 
   * @example
   * "abc".repeat(0)   // ""
   * "abc".repeat(1)   // "abc"
   * "abc".repeat(2)   // "abcabc"
   * "abc".repeat(3.5) // "abcabcabc" (count will be converted to integer)
   * "0".repeat(5)     // "00000"
   */
  prototypeExtensions.repeat = function(count) {
    count = Math.floor(count) || 0;
    if (!isFinite(count) || count < 0) {
      throw new RangeError('Invalid count value');
    }

    var str = this.toString();
    var retStr = '';
    for (;;) {
      if (count & 1) retStr += str;
      count >>= 1;
      if (count === 0) return retStr;
      str += str;
    }
  };
}

if (!StringPrototype.startsWith) {
  /**
   * Determines whether a string starts with the characters of another string.
   *
   * @function String#startsWith
   * @param {String} searchString - The characters to be searched for at the start of this string.
   * @param {Number} [position=0] - The position in this string at which to begin searching for `searchString`.
   * @returns {Boolean} `true` if this string starts with the search string; else `false`.
   * 
   * @example
   * var str = "Who am I, Gamling?";
   * str.endsWith("Who");     // -> true
   * str.endsWith("am I");    // -> false
   * str.endsWith("am I", 4); // -> true
   */
  prototypeExtensions.startsWith = function(searchString, position) {
    return this.toString().lastIndexOf(searchString, position = position || 0) === position;
  };
}

// Define the prototype properties on String.prototype
definePrototypeExtensionsOn(StringPrototype, prototypeExtensions);
