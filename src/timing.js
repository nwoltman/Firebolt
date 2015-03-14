/**
 * Augments the Function prototype of provide setTimeout and setInterval functionality.
 * 
 * @module timing
 * @requires core
 *
 * @closure_globals setTimeout, clearTimeout
 */

'use strict';


/**
 * @class Function
 * @classdesc The native JavaScript Function object.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function|Function - JavaScript | MDN}
 */

/**
 * Delays a function call for the specified number of milliseconds.
 * 
 * @example <caption>Call a function at a later time:</caption>
 * window.alert.delay(2000, ['alert!']); // Waits 2 seconds, then opens an alert that says "alert!"
 * 
 * @example <caption>Set a timeout for a function but cancel it before it can be called:</caption>
 * var ref = window.alert.delay(2000, ['alert!']); // Sets the alert to be called in 2 seconds and
 *                                                 // saves a reference to the returned object
 * ref.fn === window.alert; // -> true (just to show what `fn` in the reference object is set to)
 * 
 * //----- Before 2 seconds ellapses -----
 * ref.cancel(); // Prevents the alert function from being called
 * 
 * @function Function#delay
 * @param {Number} delay - The number of milliseconds to wait before calling the functions.
 * @param {Array} [args] - An array containing the arguments the function will be called with.
 * @param {Object} [thisArg=returned callback object] - An object you want `this` to refer to inside
 *     the function. Defaults to the object returned by this function. If `thisArg` is an Array, `args`
 *     must be present (but may be `null`).
 * @returns {Object} An object with the following properties:
 *     <dl>
 *       <dt>fn</dt>
 *       <dd>
 *         Type: {@link Function}<br>
 *         The function on which this method was called.
 *       </dd>
 *       <dt>hasExecuted</dt>
 *       <dd>
 *         Type: Boolean<br>
 *         A Boolean, initialized to `false`, that is set to `true` when the delayed function executes.
 *       </dd>
 *       <dt>exec</dt>
 *       <dd>
 *         Type: {@link Function}(Boolean cancel)<br>
 *         A function that, when called, will execute the function immediately and cancel the timeout
 *         so it is not called again by the browser. To prevent the timeout from being cancelled,
 *         call this function with the parameter `false`.
 *       </dd>
 *       <dt>cancel</dt>
 *       <dd>
 *         Type: {@link Function}<br>
 *         A function that, when called, will cancel the timeout to prevent the function from
 *         being executed (if it hasn't been already).
 *       </dd>
 *     </dl>
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Window.setTimeout|window.setTimeout - Web API Interfaces | MDN}
 */

/**
 * Executes the function repeatedly, with a fixed time delay between each call to the function.
 * 
 * @example <caption>Set a function to repeat every 2 seconds and later stop it from continuing:</caption>
 * function logStuff() {
 *     console.log('stuff');
 * }
 * 
 * var ref = logStuff.every(2000); // Logs "stuff" to the console and every 2 seconds
 *                                 // and saves a reference to the returned object
 * ref.fn === logStuff; // -> true (just to show what `fn` in the reference object is set to)
 * 
 * //----- Later -----
 * ref.cancel(); // Stops the logging calls
 * 
 * @function Function#every
 * @param {Number} delay - The number of milliseconds to wait between function calls.
 * @param {Array} [args] - An array containing the arguments the function will be called with.
 * @param {Object} [thisArg=returned callback object] - An object you want `this` to refer to inside
 *     the function. Defaults to the object returned by this function. If `thisArg` is an Array, `args`
 *     must be present (but may be `null`).
 * @returns {Object} An object with the following properties:
 *     <dl>
 *       <dt>fn</dt>
 *       <dd>
 *         Type: {@link Function}<br>
 *         The function on which this method was called.
 *       </dd>
 *       <dt>hasExecuted</dt>
 *       <dd>
 *         Type: Boolean<br>
 *         A Boolean, inialized to `false`, that is set to `true` each time the function executes.
 *       </dd>
 *       <dt>exec</dt>
 *       <dd>
 *         Type: {@link Function}(Boolean cancel)<br>
 *         A function that, when called, will execute the function immediately and cancel the interval
 *         so the function will stop being called. To prevent the interval from being cancelled, call
 *         this function with the parameter `false`.
 *       </dd>
 *       <dt>cancel</dt>
 *       <dd>
 *         Type: {@link Function}<br>
 *         A function that, when called, will cancel the interval so the function will stop being called.
 *       </dd>
 *     </dl>
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Window.setInterval|window.setInterval - Web API Interfaces | MDN}
 */

function getTimingFunction(setTiming, clearTiming) {
  return function(delay, args, thisArg) {
    var fn = this;

    var callback = function() {
      fn.apply(thisArg, args);
      callbackObject.hasExecuted = true;
    };

    var clearRef = setTiming(callback, delay);

    var callbackObject = {
      fn: fn,
      hasExecuted: false,
      exec: function(cancel) {
        if (cancel !== false) {
          clearTiming(clearRef);
        }
        callback();
      },
      cancel: function() {
        clearTiming(clearRef);
      }
    };

    if (!thisArg) {
      if (isArray(args)) {
        thisArg = callbackObject;
      } else {
        thisArg = args;
        args = UNDEFINED;
      }
    }

    return callbackObject;
  };
}

// Define the delay and every functions on the Function prototype
definePrototypeExtensionsOn(Function[prototype], {
  delay: getTimingFunction(setTimeout, clearTimeout),
  every: getTimingFunction(setInterval, clearInterval)
});