/**
 * Show/hide elements by changing their CSS display value.
 * 
 * @module display
 * @requires core
 * @ncfuncs hide, show, toggle
 */

/* exported isDisplayNone */

'use strict';


/*
 * Used to determine if the element's computed display style is "none".
 * To save time from getting the element's computed style object, a style object may be passed as the second parameter
 * (useful in places where the computed style object has already been retrieved).
 */
function isDisplayNone(element, styleObject) {
  return (styleObject || getComputedStyle(element)).display == 'none';
}

/**
 * Hides the element by setting its display style to 'none'.
 * 
 * @function HTMLElement#hide
 */
HTMLElementPrototype.hide = function() {
  this._$DS_ = this.style.display; // Save current display style
  this.style.display = 'none';     // Hide the element by setting its display style to "none"

  return this;
};

/**
 * Shows the element if it is hidden.
 *
 * __Note:__ If the element's default display style is 'none' (such as is the case with `<script>` elements),
 * it will not be shown. Also, this method will not show an element if its `visibility` is set to 'hidden' or
 * its `opacity` is `0`.
 * 
 * @function HTMLElement#show
 */
HTMLElementPrototype.show = function() {
  var inlineStyle = this.style;

  if (isDisplayNone(0, inlineStyle)) {
    inlineStyle.display = this._$DS_ || ''; // Use the saved display style or clear the display style
  }

  if (isDisplayNone(this)) {
    // Add an element of the same type as this element to the iframe's body
    // to figure out what the default display value should be
    inlineStyle.display = getComputedStyle(
      document.head.appendChild(iframe).contentDocument.body.appendChild(
        iframe.contentDocument.createElement(this.tagName)
      )
    ).display;
    iframe.remove(); // Remove the iframe from the document
  }

  return this;
};

/**
 * Shows the element if it is currently hidden or hides it if it is showing.
 * 
 * @function HTMLElement#toggle
 * @param {Boolean} [showOrHide] - Indicates whether to show or hide the element (`true` => show, `false` => hide).
 * @see HTMLElement#hide
 * @see HTMLElement#show
 */
HTMLElementPrototype.toggle = function(showOrHide) {
  if (showOrHide === true) {
    return this.show();
  }
  if (showOrHide === false) {
    return this.hide();
  }
  return isDisplayNone(this) ? this.show() : this.hide();
};

/**
 * Hides each element in the collection.
 * 
 * @function NodeCollection#hide
 * @see HTMLElement#hide
 */

/**
 * Shows each element in the collection. For specifics, see {@link HTMLElement#show}.
 * 
 * @function NodeCollection#show
 * @see HTMLElement#show
 */

/**
 * Shows each element in the collection if it is currently hidden or hides it if it is showing.
 * 
 * @function NodeCollection#toggle
 * @param {Boolean} [showOrHide] - Indicates whether to show or hide the elements (`true` => show, `false` => hide).
 * @see NodeCollection#hide
 * @see NodeCollection#show
 */
