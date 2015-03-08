/**
 * Extends String.prototype with extra functionality.
 * 
 * @module string/extras
 * @requires core
 */

/* exported camelize */

'use strict';


//#region VARS

var rgxHtmlEnc = /[<>&"'\x00]/g;

//#endregion VARS


/**
  * @class String
  * @classdesc The native JavaScript String class.
  * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String|String - JavaScript | MDN}
  */

/**
 * Returns a camelCase version of a string.
 * 
 * @private
 * @param {String} str
 * @returns {String}
 * @see String#toCamelCase
 */
function camelize(str) {
  var parts = str.split('-');
  var res = parts[0];
  var part;

  for (var i = 1; i < parts.length; i++) {
    part = parts[i];
    res += part[0].toUpperCase() + part.slice(1);
  }

  return res;
}

/**
 * Returns the HTML-encoding of certain characters.
 * 
 * @private
 * @param {String} c - The character to encode.
 * @returns {String}
 * @see String#escapeHTML
 */
function encodeChar(c) {
  return c == '<' ? '&lt;' :
         c == '>' ? '&gt;' :
         c == '&' ? '&amp;' :
         c == '"' ? '&quot;' :
         c == "'" ? '&#39;' : // jshint ignore:line
         '';
}

definePrototypeExtensionsOn(String[prototype], {
  /**
   * Appends query string parameters to a URL.
   *
   * @function String#appendParams
   * @param {String} params - Query string parameters.
   * @returns {String} A reference to the string (chainable).
   * @example
   * var url = "www.google.com";
   * url = url.appendParams('lang=en'); // -> "www.google.com?lang=en"
   * url = url.appendParams('a=1&b=2'); // -> "www.google.com?lang=en&a=1&b=2"
   */
  appendParams: function(params) {
    return this + (this.indexOf('?') >= 0 ? '&' : '?') + params;
  },

  /**
   * HTML-encodes the string by converting special characters to their
   * HTML entity equivalent and returns the result.
   * 
   * Specifically, the following encodings occur:
   * 
   * + `<` -> `&lt;`
   * + `>` -> `&gt;`
   * + `&` -> `&amp;`
   * + `"` -> `&quot;`
   * + `'` -> `&#39;`
   * 
   * @example
   * '<img src="//somesite.com" />'.escapeHTML();
   * // -> '&lt;img src=&quote;//somesite.com&quote; /&gt;'
   * 
   * @function String#escapeHTML
   * @returns {String} The HTML-escaped text.
   */
  escapeHTML: function() {
    return this.replace(rgxHtmlEnc, encodeChar);
  },

  /**
   * Converts a [kebab-case](http://c2.com/cgi/wiki?KebabCase) string to camelCase.
   * 
   * @function String#toCamelCase
   * @returns {String}
   * 
   * @description
   * __Note:__ This is not a gerneral purpose functions like [lodash's](https://lodash.com/docs#camelCase)
   * version. This function is designed to convert CSS property names to their IDL attribute equivalent.
   * @see http://www.w3.org/TR/cssom/#css-property-to-idl-attribute 
   * 
   * @example
   * 'margin-top'.toCamelCase();
   * // -> 'marginTop'
   * 
   * '-moz-binding'.toCamelCase();
   * // -> 'MozBinding'
   */
  toCamelCase: function() {
    return camelize(this);
  },

  /**
   * Returns the string split into an array of substrings (tokens) that were separated by white-space.
   *
   * @function String#tokenize
   * @returns {String[]} An array of tokens.
   * @example
   * var str = "The boy who lived.";
   * str.tokenize(); // -> ["The", "boy", "who", "lived."]
   */
  tokenize: function() {
    return this.match(/\S+/g) || [];
  },

  /**
   * HTML-decodes the string by converting HTML entities of special
   * characters to their normal form and returns the result.
   * 
   * @example
   * '&lt;img src=&quote;//somesite.com&quote; /&gt;'.unescapeHTML();
   * // -> '<img src="//somesite.com" />'
   * 
   * @function String#unescapeHTML
   * @returns {String} The HTML-unescaped text.
   */
  unescapeHTML: function() {
    return createElement('div').html(this).textContent;
  }
});
