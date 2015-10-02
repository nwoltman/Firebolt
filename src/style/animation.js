/**
 * Animate elements with CSS transitions.
 * 
 * @module animation
 * @requires core
 * @requires event
 * @requires style/css
 * @requires style/easing/basic
 * @requires private/keys
 *
 * @closure_globals parseFloat
 * @ncfuncs animate, fadeIn, fadeOut, fadeToggle, finish, slideDown, slideToggle, slideUp, stop
 */

/* global isDisplayNone */
/* global sanitizeCssPropName */
/* global keys */

'use strict';


//#region VARS

var ANIMATION_DEFAULT_DURATION = 400;
var ANIMATION_DEFAULT_EASING = 'swing';
var TOGGLE = 'toggle';

var CSS_TRANSITION_KEY = sanitizeCssPropName('transition');
var NO_CSS_TRANSITION_SUPPORT = iframe.style[CSS_TRANSITION_KEY] === UNDEFINED;
var TRANSITION_END = CSS_TRANSITION_KEY[0] === 'W' ? 'webkitTransitionEnd' : 'transitionend';

var rgxDasherizables = /[A-Z]/g; // Matches capitol letters in a camel case string

var rgxUpToUnits = /.*\d/; // Matches a CSS string value up to the units (i.e. to the last number before 'px' or '%')

//#endregion VARS


/*
 * Computes a new CSS value when doing += or -= for some value type.
 * For this to work, the current value (in px) must be converted to
 * the value type that is being changed.
 * 
 * @param {Number} curVal - The current CSS value in pixels.
 * @param {Number} changeVal - The amount the current value should change.
 *     The value type is indicated by the `type` parameter.
 * @param {String} type - "px", "em", "pt", "%", or "" (empty string, for things like opacity)
 * @param {Element} element - The element who's CSS property is to be changed.
 * @param {String} property - The name of the CSS property being changed.
 */
function cssMath(curVal, changeVal, type, element, property) {
  if (type == 'em') {
    curVal /= parseFloat(getComputedStyle(element).fontSize);
  } else if (type == 'pt') {
    curVal *= 0.75; // Close enough (who uses pt anyway?)
  } else if (type == '%') {
    curVal *= 100 / parseFloat(getComputedStyle(element.parentNode)[property]);
  }

  curVal += changeVal; // Add the change value (which may be negative)

  // Convert invalid negative values to 0
  if (curVal < 0 && /^height|width|padding|opacity/.test(property)) {
    curVal = 0;
  }

  return curVal + type; // i.e. 1.5 + "em" -> "1.5em"
}

// Returns a dasherized version of a camel case string
function dasherize(str) {
  return str.replace(rgxDasherizables, '-$&').toLowerCase();
}

// A special version of debounce just for .animate()
function debounce(fn) {
  var timer;

  return function(e) {
    if (!e || !e.propertyName) { // Called by .finish() or .stop()
      return fn(e);
    }
    // Only call setTimeout the first time
    timer = timer || setTimeout(fn.bind(UNDEFINED, e), 0);
  };
}

/**
 * @summary Performs a custom animation of a set of CSS properties.
 * 
 * @description
 * Just like HTMLElement#css, CSS properties must be specified the same way they would be in a
 * style sheet since Firebolt does not append "px" to input numeric values (i.e. 1 != 1px).
 * 
 * Unlike jQuery, an object that specifies different easing types for different properties is not supported.
 * (Should it be supported? [Tell me why](https://github.com/woollybogger/Firebolt/issues).)
 * However, relative properties (indicated with `+=` or `-=`) and the `toggle` indicator are supported.
 * 
 * Also, Firebolt allows `"auto"` to be a viable target value for CSS properties where that is a valid value.
 * 
 * For more `easing` options, use Firebolt's
 * [easing extension](https://github.com/woollybogger/firebolt-extensions/tree/master/easing)
 * (or just grab some functions from it and use them as the `easing` parameter).
 * 
 * __Note:__ In IE 9, the easing for all animations will be linear.
 * 
 * @function HTMLElement#animate
 * @param {Object} properties - An object of CSS properties and values that the animation will move toward.
 * @param {Number} [duration=400] - A number of milliseconds that specifies how long the animation will run.
 * @param {String} [easing="swing"] - Indicates which easing function to use for the transition. The string can be any
 *     [CSS transition timing function](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function)
 *     or "swing".
 * @param {Function} [complete()] - A function to call once the animation is complete.
 *     Inside the function, `this` will refer to the element that was animated.
 * @see {@link http://api.jquery.com/animate/|.animate() | jQuery API Documentation}
 */
HTMLElementPrototype.animate = function(properties, duration, easing, complete) {
  /* jshint expr:true */

  // Massage arguments into their proper places
  if (duration === UNDEFINED || typeof duration == 'function') {
    complete = duration;
    duration = ANIMATION_DEFAULT_DURATION;
    easing = ANIMATION_DEFAULT_EASING;
  } else if (typeofString(duration)) {
    complete = easing;
    easing = duration;
    duration = ANIMATION_DEFAULT_DURATION;
  } else if (!typeofString(easing)) {
    complete = easing;
    easing = ANIMATION_DEFAULT_EASING;
  }

  var _this = this;
  var i = 0;
  var propertyNames = keys(properties);
  var numProperties = propertyNames.length;
  var inlineStyle = _this.style;
  var currentStyle = getComputedStyle(_this);
  var isCurrentDisplayNone = isDisplayNone(0, currentStyle);
  var initialProps = {};
  var dasherizedProps = '';
  var valsToRestore = {};
  var cssIncrementProps;
  var framesLeft;
  var hideOnComplete;
  var sanitaryProp;
  var prop;
  var val;
  var temp;

  // Only perform the animation if there are properties to animate
  if (numProperties) {
    // The original transition style should be restored after the animation completes
    valsToRestore[CSS_TRANSITION_KEY] = inlineStyle[CSS_TRANSITION_KEY];

    if (NO_CSS_TRANSITION_SUPPORT) {
      framesLeft = parseInt(duration / 25); // Total animation frames = duration / frame period
      cssIncrementProps = {};
    }

    // Parse properties
    for (; i < numProperties; i++) {
      sanitaryProp = sanitizeCssPropName(prop = propertyNames[i]);
      val = properties[prop];
      initialProps[sanitaryProp] = currentStyle[sanitaryProp];
      dasherizedProps += (dasherizedProps ? ',' : '') + dasherize(sanitaryProp);

      // Should set overflow to "hidden" when animating height or width properties
      if ((prop == 'height' || prop == 'width') && valsToRestore.overflow === UNDEFINED) {
        valsToRestore.overflow = inlineStyle.overflow;
        initialProps.overflow = 'hidden';
      }

      if (val == TOGGLE) {
        if (isCurrentDisplayNone) {
          if (isDisplayNone(0, currentStyle)) {
            _this.show();
          }
          val = currentStyle[sanitaryProp];
          valsToRestore[sanitaryProp] = inlineStyle[sanitaryProp];
          initialProps[sanitaryProp] = 0;
        } else {
          val = 0;
          valsToRestore[sanitaryProp] = inlineStyle[sanitaryProp];
          hideOnComplete = 1;
        }
      } else if (val == 'auto') {
        valsToRestore[sanitaryProp] = val; // Save value to be set on the element at the end of the transition
        temp = inlineStyle[sanitaryProp];  // Save the current inline value of the property
        inlineStyle[sanitaryProp] = val;   // Set the style to the input value ('auto')
        val = _this.css(sanitaryProp);     // Get the computed style that will be used as the target value
                                           // (use .css() in case the element is hidden)
        inlineStyle[sanitaryProp] = temp;  // Restore the current inline value of the property
      } else if (val[1] === '=') { // "+=value" or "-=value"
        val = cssMath(
          parseFloat(currentStyle[sanitaryProp]),
          parseFloat(val.replace('=', '')),
          val.replace(rgxUpToUnits, ''),
          _this,
          sanitaryProp
        );
      }

      properties[prop] = val; // Set the value back into the object of properties in case it changed

      if (NO_CSS_TRANSITION_SUPPORT) {
        // The amount of linear change per frame = total change amount / num frames
        // Where
        // num frames = (newValue - currentValue) * framesLeft
        // And
        // currentValue = cssMath(currentValue + 0)
        cssIncrementProps[sanitaryProp] = (
          parseFloat(val) - parseFloat(
                              cssMath(parseFloat(currentStyle[sanitaryProp]),
                                      0,
                                      (val + '').replace(rgxUpToUnits, ''),
                                      _this,
                                      sanitaryProp)
                            )
        ) / framesLeft;
      }
    }

    // Prevent starting the transtion early in case the element already has a transition style
    inlineStyle[CSS_TRANSITION_KEY] = 'none';

    // Inline the element's current CSS styles because they need to be changed to trigger the animation
    for (sanitaryProp in initialProps) {
      inlineStyle[sanitaryProp] = initialProps[sanitaryProp];
    }

    _this.offsetWidth; // Trigger reflow

    // Set the CSS transition style
    inlineStyle[CSS_TRANSITION_KEY] = duration + 'ms ' + (Firebolt.easing[easing] || easing);
    inlineStyle[CSS_TRANSITION_KEY + 'Property'] = dasherizedProps;

    // Start the transition
    if (NO_CSS_TRANSITION_SUPPORT) {
      // Increment the CSS properties by their respective amounts each frame period
      // until all frames have been rendered
      (function renderFrame() {
        for (prop in cssIncrementProps) {
          inlineStyle[prop] = parseFloat(inlineStyle[prop]) + cssIncrementProps[prop] +
                              inlineStyle[prop].replace(rgxUpToUnits, '');
        }

        if (--framesLeft) {
          temp = setTimeout(renderFrame, 25);
        } else {
          _this.trigger(TRANSITION_END);
        }
      })();
    } else {
      _this.css(properties); // Setting the CSS values starts the transition
    }

    // Set an event that cleans up the animation and calls the complete callback after the transition is done
    _this.addEventListener(TRANSITION_END, _this._$A_ = debounce(function(animationCompleted) {
      // Immediately remove the event listener and delete its saved reference
      _this.removeEventListener(TRANSITION_END, _this._$A_);
      _this._$A_ = UNDEFINED;

      if (!animationCompleted) {
        // Get the current values of the CSS properties being animated
        properties = _this.css(propertyNames);
      }

      if (NO_CSS_TRANSITION_SUPPORT) {
        // End the frame rendering and set all the final CSS values
        clearTimeout(temp);
        _this.css(properties);
      }

      // Restore any CSS properties that need to be restored
      _this.css(valsToRestore);

      if (!animationCompleted) {
        _this.css(properties); // Set all of the current CSS property values
      } else {
        if (hideOnComplete) {
          _this.hide();
        }
        if (complete) {
          complete.call(_this);
        }
      }
    }));
  }

  return _this;
};

/**
 * Displays the element by fading it to opaque.
 * 
 * @function HTMLElement#fadeIn
 * @param {Number} [duration=400] - A number of milliseconds that specifies how long the animation will run.
 * @param {String} [easing="swing"] - Indicates which easing function to use for the transition. The string can be any
 *     [CSS transition timing function](http://www.w3schools.com/cssref/css3_pr_transition-timing-function.asp)
 *     or "swing".
 * @param {Function} [complete()] - A function to call once the animation is complete. Inside the function, `this` will
 *     refer to the element that was animated.
 */
HTMLElementPrototype.fadeIn = function(duration, easing, complete) {
  return isDisplayNone(this) ? this.fadeToggle(duration, easing, complete) : this;
};

/**
 * Hides the element by fading it to transparent.
 * 
 * @function HTMLElement#fadeOut
 * @param {Number} [duration=400] - A number of milliseconds that specifies how long the animation will run.
 * @param {String} [easing="swing"] - Indicates which easing function to use for the transition. The string can be any
 *     [CSS transition timing function](http://www.w3schools.com/cssref/css3_pr_transition-timing-function.asp)
 *     or "swing".
 * @param {Function} [complete()] - A function to call once the animation is complete. Inside the function, `this` will
 *     refer to the element that was animated.
 */
HTMLElementPrototype.fadeOut = function(duration, easing, complete) {
  return isDisplayNone(this) ? this : this.fadeToggle(duration, easing, complete);
};

/**
 * Displays or hides the element by animating its opacity.
 * 
 * @function HTMLElement#fadeToggle
 * @param {Number} [duration=400] - A number of milliseconds that specifies how long the animation will run.
 * @param {String} [easing="swing"] - Indicates which easing function to use for the transition. The string can be any
 *     [CSS transition timing function](http://www.w3schools.com/cssref/css3_pr_transition-timing-function.asp)
 *     or "swing".
 * @param {Function} [complete()] - A function to call once the animation is complete. Inside the function, `this` will
 *     refer to the element that was animated.
 */
HTMLElementPrototype.fadeToggle = function(duration, easing, complete) {
  return this.animate({opacity: TOGGLE}, duration, easing, complete);
};

/**
 * @summary Immediately completes the element's currently running animation.
 * 
 * @description
 * Unlike when {@linkcode HTMLElement#stop|HTMLElement#stop()} is called with a truthy `jumpToEnd` parameter,
 * this function will also trigger a `transitionend` event in addition to immediately finishing the element's
 * running animation. The event will not be triggered however, if the element is not running an animation.
 * 
 * @function HTMLElement#finish
 */
HTMLElementPrototype.finish = function() {
  return this._$A_ ? this.trigger(TRANSITION_END) : this;
};

/**
 * Displays the element with a sliding motion.
 * 
 * @function HTMLElement#slideDown
 * @param {Number} [duration=400] - A number of milliseconds that specifies how long the animation will run.
 * @param {String} [easing="swing"] - Indicates which easing function to use for the transition. The string can be any
 *     [CSS transition timing function](http://www.w3schools.com/cssref/css3_pr_transition-timing-function.asp)
 *     or "swing".
 * @param {Function} [complete()] - A function to call once the animation is complete. Inside the function, `this` will
 *     refer to the element that was animated.
 */
HTMLElementPrototype.slideDown = function(duration, easing, complete) {
  return isDisplayNone(this) ? this.slideToggle(duration, easing, complete) : this;
};

/**
 * Displays or hides the element with a sliding motion.
 * 
 * @function HTMLElement#slideToggle
 * @param {Number} [duration=400] - A number of milliseconds that specifies how long the animation will run.
 * @param {String} [easing="swing"] - Indicates which easing function to use for the transition. The string can be any
 *     [CSS transition timing function](http://www.w3schools.com/cssref/css3_pr_transition-timing-function.asp)
 *     or "swing".
 * @param {Function} [complete()] - A function to call once the animation is complete. Inside the function, `this` will
 *     refer to the element that was animated.
 */
HTMLElementPrototype.slideToggle = function(duration, easing, complete) {
  return this.animate({
    height: TOGGLE,
    marginTop: TOGGLE,
    marginBottom: TOGGLE,
    paddingTop: TOGGLE,
    paddingBottom: TOGGLE
  }, duration, easing, complete);
};

/**
 * Hides the element with a sliding motion.
 * 
 * @function HTMLElement#slideUp
 * @param {Number} [duration=400] - A number of milliseconds that specifies how long the animation will run.
 * @param {String} [easing="swing"] - Indicates which easing function to use for the transition. The string can be any
 *     [CSS transition timing function](http://www.w3schools.com/cssref/css3_pr_transition-timing-function.asp)
 *     or "swing".
 * @param {Function} [complete()] - A function to call once the animation is complete. Inside the function, `this` will
 *     refer to the element that was animated.
 */
HTMLElementPrototype.slideUp = function(duration, easing, complete) {
  return isDisplayNone(this) ? this : this.slideToggle(duration, easing, complete);
};

/**
 * @summary Stops the animation currently running on the element.
 * 
 * @description
 * When `.stop()` is called on an element, the currently-running animation (if any) is immediately stopped.
 * If, for instance, an element is being hidden with `.slideUp()` when `.stop()` is called, the element will
 * now still be displayed, but will be a fraction of its previous height. Callback functions are not called.
 * 
 * If `jumptToEnd` is `true`, this is equivalent to calling {@linkcode HTMLElement#finish|HTMLElement#finish()},
 * except the `transitionend` event will not occur.
 * 
 * @function HTMLElement#stop
 * @param {Boolean} [jumpToEnd=false] - A Boolean indicating whether to complete the current animation immediately.
 */
HTMLElementPrototype.stop = function(jumpToEnd) {
  if (this._$A_) {
    this._$A_(jumpToEnd);
  }

  return this;
};

/**
 * @summary Performs a custom animation of a set of CSS properties.
 * 
 * @description
 * Just like NodeCollection#css, CSS properties must be specified the same way they would be in a style sheet
 * since Firebolt does not append "px" to input numeric values (i.e. 1 != 1px).
 * 
 * Unlike jQuery, an object that specifies different easing types for different properties is not supported.
 * (Should it be supported? [Tell me why](https://github.com/woollybogger/Firebolt/issues).)
 * However, relative properties (indicated with `+=` or `-=`) and the `toggle` indicator are supported.
 * 
 * For more `easing` options, use Firebolt's
 * [easing extension](https://github.com/woollybogger/firebolt-extensions/tree/master/easing)
 * (or just grab some functions from it and use them as the `easing` parameter).
 * 
 * @function NodeCollection#animate
 * @param {Object} properties - An object of CSS properties and values that the animation will move toward.
 * @param {Number} [duration=400] - A number of milliseconds that specifies how long the animation will run.
 * @param {String} [easing="swing"] - Indicates which easing function to use for the transition. The string can be any
 *     [CSS transition timing function](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function)
 *     or "swing".
 * @param {Function} [complete()] - A function to call once the animation is complete. Inside the function, `this` will
 *     refer to the element that was animated.
 * @see {@link http://api.jquery.com/animate/|.animate() | jQuery API Documentation}
 */

/**
 * Displays each element in the collection by fading it to opaque.
 * 
 * @function NodeCollection#fadeIn
 * @param {Number} [duration=400] - A number of milliseconds that specifies how long the animation will run.
 * @param {String} [easing="swing"] - Indicates which easing function to use for the transition. The string can be any
 *     [CSS transition timing function](http://www.w3schools.com/cssref/css3_pr_transition-timing-function.asp)
 *     or "swing".
 * @param {Function} [complete()] - A function to call once the animation is complete. Inside the function, `this` will
 *     refer to the element that was animated.
 */

/**
 * Hides each element in the collection by fading it to transparent.
 * 
 * @function NodeCollection#fadeOut
 * @param {Number} [duration=400] - A number of milliseconds that specifies how long the animation will run.
 * @param {String} [easing="swing"] - Indicates which easing function to use for the transition. The string can be any
 *     [CSS transition timing function](http://www.w3schools.com/cssref/css3_pr_transition-timing-function.asp)
 *     or "swing".
 * @param {Function} [complete()] - A function to call once the animation is complete. Inside the function, `this` will
 *     refer to the element that was animated.
 */

/**
 * Displays or hides each element in the collection by animating its opacity.
 * 
 * @function NodeCollection#fadeToggle
 * @param {Number} [duration=400] - A number of milliseconds that specifies how long the animation will run.
 * @param {String} [easing="swing"] - Indicates which easing function to use for the transition. The string can be any
 *     [CSS transition timing function](http://www.w3schools.com/cssref/css3_pr_transition-timing-function.asp)
 *     or "swing".
 * @param {Function} [complete()] - A function to call once the animation is complete. Inside the function, `this` will
 *     refer to the element that was animated.
 */

/**
 * Immediately completes the currently running animation for each element in the collection.
 * 
 * @function NodeCollection#finish
 */

/**
 * Displays each element in the collection with a sliding motion.
 * 
 * @function NodeCollection#slideDown
 * @param {Number} [duration=400] - A number of milliseconds that specifies how long the animation will run.
 * @param {String} [easing="swing"] - Indicates which easing function to use for the transition. The string can be any
 *     [CSS transition timing function](http://www.w3schools.com/cssref/css3_pr_transition-timing-function.asp)
 *     or "swing".
 * @param {Function} [complete()] - A function to call once the animation is complete. Inside the function, `this` will
 *     refer to the element that was animated.
 */

/**
 * Displays or hides each element in the collection with a sliding motion.
 * 
 * @function NodeCollection#slideToggle
 * @param {Number} [duration=400] - A number of milliseconds that specifies how long the animation will run.
 * @param {String} [easing="swing"] - Indicates which easing function to use for the transition. The string can be any
 *     [CSS transition timing function](http://www.w3schools.com/cssref/css3_pr_transition-timing-function.asp)
 *     or "swing".
 * @param {Function} [complete()] - A function to call once the animation is complete. Inside the function, `this` will
 *     refer to the element that was animated.
 */

/**
 * Hides each element in the collection with a sliding motion.
 * 
 * @function NodeCollection#slideUp
 * @param {Number} [duration=400] - A number of milliseconds that specifies how long the animation will run.
 * @param {String} [easing="swing"] - Indicates which easing function to use for the transition. The string can be any
 *     [CSS transition timing function](http://www.w3schools.com/cssref/css3_pr_transition-timing-function.asp)
 *     or "swing".
 * @param {Function} [complete()] - A function to call once the animation is complete. Inside the function, `this` will
 *     refer to the element that was animated.
 */

/**
 * @summary Stops the animation currently running on each element in the collection.
 * 
 * @description
 * When `.stop()` is called on an element, the currently-running animation (if any) is immediately stopped.
 * If, for instance, an element is being hidden with `.slideUp()` when `.stop()` is called, the element will
 * now still be displayed, but will be a fraction of its previous height. Callback functions are not called.
 * 
 * If `jumptToEnd` is `true`, this is equivalent to calling `NodeCollection#finish()`.
 * 
 * @function NodeCollection#stop
 * @param {Boolean} [jumpToEnd=false] - A Boolean indicating whether to complete the current animation immediately.
 */
