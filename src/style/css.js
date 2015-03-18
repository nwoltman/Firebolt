/**
 * Modify or retrieve elements' styles.
 * 
 * @module css
 * @requires core
 * @requires style/display
 * @requires string/extras
 */

/* global isDisplayNone */
/* global camelize */

/* exported sanitizeCssPropName */

'use strict';


//#region VARS

var cssVendorPrefix =
  usesWebkit ? 'webkit' :
  usesGecko ? 'Moz' :
  document.documentMode ? 'ms' :
  'O';

//#endregion VARS


// Camelizes the property name and adds the vendor prefix if necessary
function sanitizeCssPropName(name) {
  // Camelize the property name and check if it exists on the saved iframe's style object
  name = camelize(name);
  if (name in iframe.style) {
    return name;
  }

  // The camelized input property name is not supported, so make the vendor name
  return cssVendorPrefix + name[0].toUpperCase() + name.slice(1);
}

/**
 * Gets the value of the specified style property.
 * 
 * @function HTMLElement#css
 * @param {String} propertyName - The name of the style property who's value you want to retrieve.
 * @returns {String} The value of the specifed style property.
 */
/**
 * Gets an object of property-value pairs for the input array of CSS properties.
 * 
 * @function HTMLElement#css
 * @param {String[]} propertyNames - An array of one or more CSS property names.
 * @returns {Object.<String, String>} An object of property-value pairs where the values are
 *     the computed style values of the input properties.
 */
/**
 * Sets the specified style property.
 * 
 * __Note:__ Unlike jQuery, if the passed in value is a number, it will not be converted to a string with `'px'`
 * appended to it prior to setting the CSS value. This helps keep the library small and fast and will force
 * your code to be more obvious as to how it is changing the element's style (which is a good thing).
 * 
 * @function HTMLElement#css
 * @param {String} propertyName - The name of the style property to set.
 * @param {?String|Number} value - A value to set for the specified property.
 */
/**
 * Sets CSS style properties.
 * 
 * __Note:__ Just like the previous function, if a value in the object is a number, it will not be converted to a
 * string with `'px'` appended to it to it prior to setting the CSS value.
 * 
 * @function HTMLElement#css
 * @param {Object.<String, String|Number>} properties - An object of CSS property-values.
 */
HTMLElementPrototype.css = function(prop, value) {
  var _this = this; // Improves minification
  var computedStyle, mustHide, val;

  if (value === UNDEFINED) {
    // Temporarily use `val` to keep track if the input is an array
    // (it will get set to the correct return value when needed)
    if ((val = isArray(prop)) || typeofString(prop)) {
      computedStyle = getComputedStyle(_this);

      // If the element is not visible, it should be shown before reading its CSS values
      mustHide = isDisplayNone(0, computedStyle) && _this.show();

      if (val) { // isArray
        // Build an object with the values specified by the input array of properties
        val = {};
        for (value = 0; value < prop.length; value++) { // Reuse the value argument instead of a new var
          val[prop[value]] = computedStyle[sanitizeCssPropName(prop[value])];
        }
      } else {
        // Get the specified property
        val = computedStyle[sanitizeCssPropName(prop)];
      }

      if (mustHide) {
        _this.hide(); // Hide the element since it was shown temporarily to obtain style values
      }

      return val;
    }

    // Set all specifed properties
    for (val in prop) {
      _this.style[sanitizeCssPropName(val)] = prop[val];
    }
  } else {
    // Set the specified property
    _this.style[sanitizeCssPropName(prop)] = value;
  }

  return _this;
};

/**
 * Gets the value of the specified style property of the first element in the collection.
 * 
 * @function NodeCollection#css
 * @param {String} propertyName - The name of the style property who's value you want to retrieve.
 * @returns {String} The value of the specifed style property.
 */
/**
 * Gets an object of property-value pairs for the input array of CSS properties
 * for the first element in the collection.
 * 
 * @function NodeCollection#css
 * @param {String[]} propertyNames - An array of one or more CSS property names.
 * @returns {Object.<String, String>} An object of property-value pairs where the values are
 *     the computed style values of the input properties.
 */
/**
 * Sets the specified style property for each element in the collection.
 * 
 * __Note:__ Unlike jQuery, if the passed in value is a number, it will not be converted to a string with `'px'`
 * appended to it prior to setting the CSS value. This helps keep the library small and fast and will force
 * your code to be more obvious as to how it is changing the element's style (which is a good thing).
 * 
 * @function NodeCollection#css
 * @param {String} propertyName - The name of the style property to set.
 * @param {String|Number} value - A value to set for the specified property.
 */
/**
 * Sets CSS style properties for each element in the collection.
 * 
 * __Note:__ Just like the previous function, if a value in the object is a number, it will not be converted to a
 * string with `'px'` appended to it to it prior to setting the CSS value.
 * 
 * @function NodeCollection#css
 * @param {Object.<String, String|Number>} properties - An object of CSS property-values.
 */
NodeCollectionPrototype.css = getFirstSetEachElement(HTMLElementPrototype.css, function(numArgs, firstArg) {
  return isArray(firstArg) || numArgs < 2 && typeofString(firstArg);
});
