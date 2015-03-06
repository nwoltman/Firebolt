/**
 * Extends String.prototype with extra functionality.
 * 
 * @module string/extras
 * @requires core
 */

'use strict';


/**
  * @class String
  * @classdesc The native JavaScript String class.
  * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String|String - JavaScript | MDN}
  */

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
   * HTML-encodes the string by converting HTML special characters to their
   * entity equivalents and returns the result.
   * 
   * @example
   * '<img src="//somesite.com" />'.escapeHTML();  // -> '&lt;img src="//somesite.com" /&gt;'
   * 
   * @function String#escapeHTML
   * @returns {String} The HTML-escaped text.
   */
  escapeHTML: function() {
    return createElement('div').text(this).innerHTML;
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
   * HTML-decodes the string by converting entities of HTML special
   * characters to their normal form and returns the result.
   * 
   * @example
   * '&lt;img src="//somesite.com" /&gt;'.unescapeHTML();  // -> '<img src="//somesite.com" />'
   * 
   * @function String#unescapeHTML
   * @returns {String} The HTML-unescaped text.
   */
  unescapeHTML: function() {
    return createElement('div').html(this).textContent;
  }
});
