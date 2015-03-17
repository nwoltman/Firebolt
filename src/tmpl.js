/**
 * Provides Firebolt's templating engine.
 * 
 * @module tmpl
 * @requires core
 * @requires string/extras
 */

'use strict';


//#region VARS

var rgxTmpl = /([\r\n'\\])(?=(?:(?!%>)[\s\S])*(?:<%|$))|<%(=|-)([\s\S]*?)%>|(<%)|%>/g;

//#endregion VARS


function tmplFormat(s, p1, p2, p3, p4) {
  if (p1) { // Escape newline characters, single quotes, and backslashes in the HTML context
    return (
      p1 === '\n' ? '\\n' :
      p1 === '\r' ? '' :
      '\\' + p1
    );
  }
  if (p2) { // Output escaped (<%= %>) or plain (<%- %>) text
    return '\'+__t(' + p3 + ')' + (p2 === '=' ? '.escapeHTML()' : '') + '+\'';
  }
  if (p4) { // JS evaluation start tag (<%)
    return '\';';
  }
  // JS evaluation end tag (%>)
  return '__s+=\'';
}

/**
 * @summary Creates a compiled template function.
 * 
 * @function Firebolt.tmpl
 * @param {String|HTMLScriptElement} template - The template string or `<script>` element
 *     that contains the template string.
 * @param {String} [dataIdentifier='o'] - An identifer to be used in the template to access
 *     the data passed into the compiled template function.
 * @returns {Function} The compiled template function.
 * 
 * @description
 * The compiled function that this function returns can execute JavaScript in "evaluate"
 * delimiters (`<% %>`), interpolate data properties in "interpolate" delimiters (`<%- %>`),
 * and HTML-escape interpolated data properties in "escape" delimiters (`<%= %>`). Data
 * passed into the compiled function can be accessed by the special variable `o` or an
 * identifier specified as the second parameter to the `$.tmpl()` function.
 * 
 * When compiling the template, you can either provide the template string directly
 * (usually either defined in your JavaScript or retrieved with an AJAX call) or
 * provide a `<script>` element that contains the template string. An example
 * template `<script>` could be the following:
 * 
 * ```html
 * <script id="tmpl-example" type="text/x-fb-tmpl">
 * <h3><%= o.title %></h3>
 * <p>
 *   Released under the
 *   <a href="<%= o.license.url %>"><%= o.license.name %></a>.
 * </p>
 * <h4>Features</h4>
 * <ul>
 * <% for (var i = 0; i  <o.features.length; i++) { %>
 *   <li><%= o.features[i] %></li>
 * <% } %>
 * </ul>
 * </script>
 * ```
 * 
 * Note that the script element's `type` must be something like `text/x-*` otherwise
 * the script will be evaluated by the browser like any other script element.
 * 
 * To compile this particular template:
 * 
 * ```js
 * var exampleTemplate = $.tmpl($$('tmpl-example'));
 * ```
 * 
 * Then to render the template with some data:
 * 
 * ```js
 * var data = {
 *   "title": "My Cool Project",
 *   "license": {
 *     "name": "MIT",
 *     "url": "http://www.opensource.org/licenses/MIT"
 *   },
 *   "features": [
 *     "New",
 *     "Powerful",
 *     "Easy to use"
 *   ]
 * };
 * 
 * var rendered = exampleTemplate(data);
 * ```
 * 
 * The `rendered` variable would then be the following string:
 * 
 * ```html
 * <h3>My Cool Project</h3>
 * <p>
 *   Released under the
 *   <a href="http://www.opensource.org/licenses/MIT">MIT</a>.
 * </p>
 * <h4>Features</h4>
 * <ul>
 *   <li>New</li>
 *   <li>Powerful</li>
 *   <li>Easy to use</li>
 * </ul>
 * ```
 * 
 * You can then do anything you want with the rendered string, such as add it to the page:
 * 
 * ```js
 * $1('.project-container').innerHTML = rendered;
 * ```
 * 
 * @example <caption>Access data with a custom variable name</caption>
 * var compiled = $.tmpl('<strong><%= data.value %></strong>', 'data');
 * compiled({value: 'Hello!'});
 * // -> '<strong>Hello!</strong>'
 * 
 * @example <caption>Interpolate data without HTML-escaping it</caption>
 * var compiled = $.tmpl('<li><%- data.value %></li>', 'data');
 * compiled({value: '<span class="my-span">Some info<span>'});
 * // -> '<li><span class="my-span">Some info<span></li>'
 * 
 * @example <caption>HTML-escape interpolated data</caption>
 * var compiled = $.tmpl('<li><%= data.value %></li>', 'data');
 * compiled({value: '<span class="my-span">Some info<span>'});
 * // -> '<li>&lt;span class=&quot;my-span&quot;&gt;Some info&lt;span&gt;</li>'
 */
Firebolt.tmpl = function(value, dataIdentifier) {
  /* jslint evil: true */
  return Function(
    dataIdentifier || 'o',
    'function __t(v){return v==null?\'\':\'\'+v}' +
      'var __s=\'' +
      (typeofString(value) ? value : value.text).replace(rgxTmpl, tmplFormat) +
      '\';return __s'
  );
};
