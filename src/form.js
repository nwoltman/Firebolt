/**
 * Provides functionality for getting the value of form and
 * input elements and for serializing those elements.
 * 
 * @module form
 * @requires core
 * @requires ajax/basic
 */

'use strict';


/**
 * Encode a form element or form control element as a string for submission in an HTTP request.
 * 
 * __Note:__ Unlike jQuery, successful `<select>` controls that have the `multiple` attribute will be encoded
 * using {@linkcode Firebolt.param|Firebolt.param()} with the `traditional` parameter set to `false`, so its
 * array value will be preserved in the encoded string.
 * 
 * @function HTMLElement#serialize
 * @returns {String} A URL-encoded string of the form element's value or an empty string if the element is
 *     not a [successful control](http://www.w3.org/TR/html401/interact/forms.html#h-17.13.2).
 * @this HTMLFormElement|HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement
 */
HTMLElementPrototype.serialize = function() {
  var type = this.type;
  var name = this.name;
  var value = this.val();

  if (!name ||                                 // Doesn't have a name
      this.disabled ||                         // Is disabled
      value == UNDEFINED ||                    // Is a <select> element and has no value or is not a form control
      /button|file|reset|submit/.test(type) || // Is a form button (button|file|reset|submit)
      /checkbox|radio/.test(type) && !this.checked) { // Is a checkbox or radio button and is not checked
    return '';
  }

  // Check if the value is a string because <select> elements may return an array of selected options
  return typeofString(value) ? encodeURIComponent(name) + '=' + encodeURIComponent(value)
                             : Firebolt.param(HTMLElementPrototype.prop.call({}, name, value));
};

/* For form elements, return the serialization of its form controls */
HTMLFormElement[prototype].serialize = function() {
  return this.elements.serialize();
};

/**
 * @summary Encode a set of form elements or form control elements as a string for submission in a HTTP request.
 * 
 * @function NodeCollection#serialize
 * @returns {String} A URL-encoded string of the elements' serialized values or an empty string if no element
 *     could be successfully serialized.
 * @throws {TypeError} Each element in the collection must be an HTMLElement.
 * @see HTMLElement#serialize
 * @see {@link http://api.jquery.com/serialize/|.serialize() | jQuery API Documentation}
 * 
 * @description
 * Note that only [successful controls](http://www.w3.org/TR/html401/interact/forms.html#h-17.13.2) will
 * have their values added to the serialized string. All button elements (including file input buttons)
 * are also ignored.
 * 
 * __ProTip:__ The best way to serialize a single form is to select the form element and
 * call `.serialize()` directly on it (see {@link HTMLElement#serialize}).
 */
NodeCollectionPrototype.serialize = function() {
  var retStr = '';
  var val;

  for (var i = 0; i < this.length; i++) {
    if (val = this[i].serialize()) {
      retStr += (retStr ? '&' : '') + val;
    }
  }

  return retStr;
};

/**
 * Retrieves the element's current value. If the element is a `<select>` element,
 * `null` is returned if none of its options are selected and an array of selected
 * options is returned if the element's `multiple` attribute is present.
 * 
 * @function HTMLElement#val
 * @returns {String|Array|null} The element's value.
 */
/**
 * Sets the element's value.
 * 
 * @function HTMLElement#val
 * @param {String|Number} value - The value to give to the element.
 */
/**
 * @summary
 * Selects and deselects the element (or it's child `<option>` elements)
 * depending on if its value is in the input array.
 * 
 * @function HTMLElement#val
 * @param {String[]} values - The array of values used to determine if the element (or its options)
 *     should be checked (or selected).
 * 
 * @description
 * For checkbox and radio `<input>` elements, selects the element if its current value is in the
 * input array of values and deselects it otherwise.
 * 
 * If the element is a `<select>` element, all of its `<option>` elements with a value matching one
 * in the input array of values will be selected and all others deselected. If the select element
 * does not allow multiple selection, only the first matching element is selected.
 */
HTMLElementPrototype.val = function(value) {
  // If `value` is not an array with values to check
  if (!isArray(value)) {
    return this.prop('value', value);
  }

  // Check or uncheck this depending on if this element's value is in the array of values to check
  this.checked = value.indexOf(this.value) >= 0;

  return this;
};

HTMLSelectElement[prototype].val = function(value) {
  var multiple = this.multiple;
  var options = this.options;
  var i = 0;

  if (value === UNDEFINED) {
    // If multiple selection is allowed and there is at least one selected item, return an array of selected values
    if (multiple && this.selectedIndex >= 0) {
      value = [];
      for (; i < options.length; i++) {
        if (options[i].selected) {
          push1(value, options[i].value);
        }
      }
      return value;
    }

    // Else return the currently selected value or null
    // (If multiple is true, this.value will be an empty string so null will be returned)
    return this.value || null;
  }

  if (typeofString(value)) {
    this.value = value;
  } else {
    // Select or deselect each option depending on if its value is in the array of values to check.
    // Break once an option is selected if this select element does not allow multiple selection.
    for (; i < options.length; i++) {
      if ((options[i].selected = value.indexOf(options[i].value) >= 0) && !multiple) break;
    }
  }

  return this;
};

/**
 * Retrieves the current value of the first element in the collection. If the element is a
 * `<select>` element, `null` is returned if none of its options are selected, and an array
 * of selected options is returned if the element's `multiple` attribute is present.
 * 
 * @function NodeCollection#val
 * @returns {String|Array|null} The first element's value.
 */
/**
 * Sets the value of each element in the collection.
 * 
 * @function NodeCollection#val
 * @param {String|Number} value - The value to give to each element.
 */
/**
 * @summary
 * Selects and deselects the element (or it's child `<option>` elements)
 * depending on if its value is in the input array.
 * 
 * @function NodeCollection#val
 * @param {String[]} values - The array of values used to determine if each element (or its options)
 *     should be checked (or selected).
 * 
 * @description
 * For each checkbox and radio `<input>` element in the collection, selects it if its current value
 * is in the input array of values and deselects it otherwise.
 * 
 * For each `<select>` element in the collection, all of its options with a value matching one in
 * the input array of values will be selected and all others deselected. If the `<select>` element
 * does not allow multiple selection, only the first matching element is selected.
 */
NodeCollectionPrototype.val = function(value) {
  // Get first
  if (value === UNDEFINED) {
    return this[0].val();
  }

  // Set each
  for (var i = 0; i < this.length; i++) {
    this[i].val(value);
  }

  return this;
};
