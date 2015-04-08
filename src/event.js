/**
 * Provides event delegation functionality.
 * 
 * @module event
 * @requires core
 * @requires private/keys
 */

/* global keys */

'use strict';


//#region VARS

var EventPrototype = Event[prototype];
var EventTarget = window.EventTarget;
var EventTargetPrototype = EventTarget ? EventTarget[prototype] : NodePrototype;
var stopPropagation = EventPrototype.stopPropagation;

//#endregion VARS


/**
 * @class EventTarget
 * @classdesc
 * The EventTarget interface. If a browser does not support the EventTarget interface,
 * only `Node.prototype` and `window` will be extended.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/EventTarget|EventTarget - Web API Interfaces | MDN}
 */

/*
 * Calls the passed in function on each item in the enumerable.
 * 
 * @param {Function} fn - The function to call on each item.
 * @returns {Enumerable} `this`
 * @this An enumerable object such as Array or NodeList.
 */
function callOnEach(fn) {
  return function() {
    for (var i = 0, len = this.length; i < len; i++) {
      fn.apply(this[i], arguments);
    }
    return this;
  };
}

/*
 * Takes a string indicating an event type and returns an Event object that bubbles and is cancelable.
 * 
 * @param {String} eventType - The name of the type of event (such as "click").
 */
function createEventObject(eventType, event) { // Declaring `event` in the parameters to save a var declaration
  if (Event.length) { // Use the modern Event constructor
    event = new Event(eventType, {
      bubbles: true,
      cancelable: true
    });
  } else { // Use the deprecated document.createEvent() + event.initEvent() method
    event = document.createEvent('Event');
    event.initEvent(eventType, true, true);
  }

  return event;
}

/*
 * Simply returns `false`. For use in EventTarget#on/off
 */
function returnFalse() {
  return false;
}

/* This is the function that will be invoked for each event type when a handler is set with EventTarget#on() */
function nodeEventHandler(eventObject, extraParameters) {
  var _this = this;
  var target = eventObject.target;
  var eType = eventObject.type;
  var selectorHandlers = _this._$E_[eType];
  var selectorHandlersCopy = {};
  var selectors = keys(selectorHandlers).remove(''); // Don't want the selector for non-delegated handlers
  var numSelectors = selectors.length;
  var i = 0;
  var selector;
  var result;

  // If the extra parameters are not defined (by `.triggerHandler()`), perhaps they were defined by `.trigger()`
  if (extraParameters === UNDEFINED) {
    extraParameters = eventObject._$P_;
  }

  /*
   * @param {{f: function, d: *, o: boolean}} handlerObject - The object containing the handler data
   *     that was set in `.on()`
   */
  function callHandlerOnTarget(handlerObject) {
    eventObject.data = handlerObject.d; // Set data in the event object before calling the handler

    result = handlerObject.f.call(target, eventObject, extraParameters); // Call the handler and store the result

    if (result === false) {
      eventObject.stopPropagation();
      eventObject.preventDefault();
    }

    // Remove the handler if it should only occur once
    if (handlerObject.o) {
      EventTargetPrototype.off.call(_this, eType, selector, handlerObject.f);
      handlerObject.o = 0; // Make the "one" specifier falsy so this if statement won't try to remove it again
    }
  }

  // Only do delegated events if there are selectors that can be used to delegate events and if the target
  // was not this element (since if it was this element there would be nothing to bubble up from)
  if (numSelectors && target !== _this) {
    // Build a copy of the selector handlers so they won't be altered if `.off()` is ever called
    for (; i < numSelectors; i++) {
      selectorHandlersCopy[selectors[i]] = arrayFrom(selectorHandlers[selectors[i]]);
    }

    // Call the handlers for each selector on each matching element
    // up to the current element or until propagation is stopped
    do {
      if (isNodeElement(target)) {
        for (i = 0; i < numSelectors; i++) {
          if (target.matches(selector = selectors[i])) {
            selectorHandlersCopy[selector].each(callHandlerOnTarget);
          }
        }
      }
    } while ((target = target.parentNode) !== _this && !eventObject.propagationStopped);
  }

  // If there are non-delegated handlers and propagation has not been stopped,
  // call the handlers on the current element
  selectorHandlers = selectorHandlers[selector = ''];
  if (selectorHandlers && !eventObject.propagationStopped) {
    target = _this;
    // Use a clone so the handlers array won't be altered if `off()` is ever called
    arrayFrom(selectorHandlers).each(callHandlerOnTarget);
  }

  return result;
}

/* 
 * Used by EventTarget#off
 * Removes the passed in handler from the array of handlers or removes all handlers if handler is undefined.
 * Deletes the array of handlers if it is empty after handlers have been removed.
 */
function removeSelectorHandler(selectorHandlers, selector, handler) {
  var handlers = selectorHandlers[selector];
  if (handlers) {
    if (handler) {
      for (var i = 0; i < handlers.length; i++) {
        if (handlers[i].f === handler) {
          handlers.splice(i--, 1); // Use i-- so i has the same value when the loop completes and i++ happens
        }
      }
    } else {
      handlers.clear();
    }

    if (!handlers.length) {
      // The array of handlers is now empty so it can be deleted
      delete selectorHandlers[selector];
    }
  }
}

/* Slightly alter the Event#stopPropagation() method for more convenient use in EventTarget#on() */
EventPrototype.stopPropagation = function() {
  this.propagationStopped = true;
  stopPropagation.call(this);
};
EventPrototype.propagationStopped = false; // Set the default value on the Event prototype

prototypeExtensions = {
  /**
   * Removes one or more event handlers set by `.on()` or `.one()`.
   * 
   * @function EventTarget#off
   * @param {String} events - One or more space-separated event types, such as "click" or "click keypress".
   * @param {String} [selector] - A selector which should match the one originally passed to `.on()`
   *     when attaching event handlers.
   * @param {Function} [handler] - A handler function previously attached for the event(s),
   *     or the special value `false` (see `EventTarget#on()`).
   * @see {@link http://api.jquery.com/off/#off-events-selector-handler|.off() | jQuery API Documentation}
   */
  /**
   * Removes one or more event handlers set by `.on()` or `.one()`.
   * 
   * @function EventTarget#off
   * @param {Object} events - An object where the string keys represent one or more space-separated event
   *     types and the values represent handler functions previously attached for the event(s).
   * @param {String} [selector] - A selector which should match the one originally passed to `.on()`
   *     when attaching event handlers.
   * @see {@link http://api.jquery.com/off/#off-events-selector|.off() | jQuery API Documentation}
   */
  /**
   * Removes all event handlers set by `.on()` or `.one()`.
   * 
   * @function EventTarget#off
   * @see {@link http://api.jquery.com/off/#off|.off() | jQuery API Documentation}
   */
  off: function off(events, selector, handler) {
    var eventHandlers = this._$E_;
    var eventType;
    var selectorHandlers;
    var sel;
    var i;

    // Don't bother doing anything if there haven't been any Firebolt handlers set
    if (eventHandlers) {
      if (typeof events == 'object') {
        // Call this function for each event and handler in the object
        for (i in events) {
          off.call(this, i, selector, events[i]);
        }
      } else {
        // If events was passed in, remove those events, else remove all events
        events = events ? events.split(' ') : keys(eventHandlers);

        if (selector !== UNDEFINED && !typeofString(selector)) {
          // The handler was in the selector argument and there is no real selector argument
          handler = selector;
          selector = UNDEFINED;
        }

        // If the handler is the value false, the handler should be a function that returns false
        if (handler === false) {
          handler = returnFalse;
        }

        for (i = 0; i < events.length; i++) {
          if (selectorHandlers = eventHandlers[eventType = events[i]]) {
            // If a selector was provided, remove handlers for that particular selector
            if (selector && selector !== '**') {
              removeSelectorHandler(selectorHandlers, selector, handler);
            } else {
              // Remove handlers for all selectors
              for (sel in selectorHandlers) {
                // If `sel` is the non-delegate selector (is falsy), only remove the handler if the input
                // selector does not exist (for if it did exist it would have to be '**', which is only
                // for removing delegated handlers)
                if (sel || !selector) {
                  removeSelectorHandler(selectorHandlers, sel, handler);
                }
              }
            }

            // If there are no more selectors left, the object for the current event can be deleted
            // and the event listener must be removed
            if (isEmptyObject(selectorHandlers)) {
              delete eventHandlers[eventType];
              this.removeEventListener(eventType, nodeEventHandler);
            }
          }
        }

        // If there are no handlers left for any events, delete the event handler store
        if (isEmptyObject(eventHandlers)) {
          this._$E_ = UNDEFINED;
        }
      }
    }

    return this;
  },

  /**
   * @summary Attaches an event handler function for one or more events to the node.
   *  
   * @description
   * Check out [jQuery's documentation](http://api.jquery.com/on/) for details.
   * There are only a couple minor differences:
   * 1. Firebolt does not offer event namespacing.
   * 2. The native [Event](https://developer.mozilla.org/en-US/docs/Web/API/Event) object is passed to the handler
   *    (with an added `data` property, and if propagation is stopped, there will be a `propagationStopped` property
   *    set to `true`).
   * 
   * @function EventTarget#on
   * @param {String} events - One or more space-separated event types, such as "click" or "click keypress".
   * @param {String} [selector] - A selector string to filter the descendants of the selected elements
   *     that trigger the event. If the selector is `null` or omitted, the event is always triggered
   *     when it reaches the selected element.
   * @param {*} [data] - Data to be passed to the handler in `eventObject.data` when an event is triggered.
   * @param {Function} handler(eventObject) - A function to execute when the event is triggered. Inside the
   *     function, `this` will refer to the node the event was triggered on. The value `false` is also
   *     allowed as a shorthand for a function that simply does `return false`.
   * @see {@link http://api.jquery.com/on/#on-events-selector-data-handler|.on() | jQuery API Documentation}
   */
  /**
   * @summary Attaches an event handler function for one or more events to the node.
   *  
   * @description
   * Check out [jQuery's documentation](http://api.jquery.com/on/) for details.
   * There are only a couple minor differences:
   * 1. Firebolt does not offer event namespacing.
   * 2. The native [Event](https://developer.mozilla.org/en-US/docs/Web/API/Event) object is passed to the handler
   *    (with an added `data` property, and if propagation is stopped, there will be a `propagationStopped`
   *    property set to `true`).
   * 
   * @function EventTarget#on
   * @param {Object} events - An object where the string keys represent one or more space-separated
   * event types and the values represent handler functions to be called for the event(s).
   * @param {String} [selector] - A selector string to filter the descendants of the selected elements
   *     that trigger the event. If the selector is `null` or omitted, the event is always triggered
   *     when it reaches the selected element.
   * @param {*} [data] - Data to be passed to the handler in `eventObject.data` when an event is triggered.
   * @see {@link http://api.jquery.com/on/#on-events-selector-data|.on() | jQuery API Documentation}
   */
  on: function on(events, selector, data, handler, /*INTERNAL*/ one) {
    var eventHandlers = this._$E_ || (this._$E_ = {});
    var selectorIsString = typeofString(selector);
    var selectorHandlers;
    var eventType;
    var i;

    if (typeof events == 'object') {
      // Call this function for each event and event handler in the object
      for (i in events) {
        on.call(this, i, selector, data, events[i], one);
      }
    } else {
      events = events.split(' ');

      // Organize arguments into their proper places
      if (handler === UNDEFINED) {
        if (data === UNDEFINED) {
          handler = selector; // The handler was in the selector argument
        } else {
          handler = data;     // The handler was in the data argument
          data = selectorIsString ? UNDEFINED : selector; // Data was undefined or was in the selector argument
        }
      }

      if (!selectorIsString) {
        selector = ''; // Make the selector an empty string to be used as an object key
      }

      // If the handler is the value false, the handler should be a function that returns false
      if (handler === false) {
        handler = returnFalse;
      }

      for (i = 0; i < events.length; i++) {
        if (eventType = events[i]) { // Sanity check
          selectorHandlers = eventHandlers[eventType]; // Get the selector handlers object for the event type

          // If the object for the event doesn't exist, create it and add Firebolt's event function as a listener
          if (!selectorHandlers) {
            selectorHandlers = eventHandlers[eventType] = {};
            this.addEventListener(eventType, nodeEventHandler);
          }

          // Get the array of handlers for the selector or create it if it doesn't exist
          selectorHandlers = selectorHandlers[selector] || (selectorHandlers[selector] = []);

          // Add the user-input handler and data to the array of handlers
          push1(selectorHandlers, { f: handler, d: data, o: one });
        }
      }
    }

    return this;
  },

  /**
   * Attaches a handler to an event for the node. The handler is executed at most once per event type.
   * 
   * This fuction is the same as `EventTarget#on()`, except the event handler is removed after it executes
   * for the first time.
   * 
   * @function EventTarget#one
   * @param {String} events
   * @param {String} [selector]
   * @param {*} [data]
   * @param {Function} handler(eventObject)
   * @see {@link http://api.jquery.com/one/#one-events-selector-data-handler|.one() | jQuery API Documentation}
   */
  /**
   * Attaches a handler to an event for the node. The handler is executed at most once per event type.
   * 
   * This function is the same as `EventTarget#on()`, except the event handler is removed after it executes
   * for the first time.
   * 
   * @function EventTarget#one
   * @param {Object} events
   * @param {String} [selector]
   * @param {*} [data]
   * @see {@link http://api.jquery.com/one/#one-events-selector-data|.one() | jQuery API Documentation}
   */
  one: function(events, selector, data, handler) {
    return EventTargetPrototype.on.call(this, events, selector, data, handler, 1);
  },

  /**
   * Triggers a real DOM event on the node for the given event type.
   * 
   * @function EventTarget#trigger
   * @param {String} eventType - A string containing a JavaScript event type, such as "click" or "submit".
   * @param {*} extraParameters - Additional parameters that will be passed as the second argument to the
   *     triggered event handler(s).
   */
  /**
   * Uses the input Event object to trigger the specified event on the node.
   * 
   * @function EventTarget#trigger
   * @param {Event} event - An {@link https://developer.mozilla.org/en-US/docs/Web/API/Event|Event} object.
   * @param {*} extraParameters - Additional parameters that will be passed as the second argument to the
   *     triggered event handler(s).
   */
  trigger: function(event, extraParameters) {
    if (typeofString(event)) {
      event = createEventObject(event);
    }

    event._$P_ = extraParameters;

    this.dispatchEvent(event);

    return this;
  },

  /**
   * @summary Executes all handlers attached to the node for an event type.
   * 
   * @description
   * The `.triggerHandler()` method behaves similarly to `.trigger()`, with the following exceptions:
   * 
   * + The `.triggerHandler()` method does not cause the default behavior of an event to occur
   *   (such as a form submission or button click).
   * + Events triggered with `.triggerHandler()` do not bubble up the DOM hierarchy;
   *   if they are not handled by the target node directly, they do nothing.
   * + Instead of returning the node, `.triggerHandler()` returns whatever value was returned by the
   *   last handler it caused to be executed. If no handlers are triggered, it returns `undefined`.
   * 
   * @function EventTarget#triggerHandler
   * @param {String} eventType - A string containing a JavaScript event type, such as "click" or "submit".
   * @param {*} extraParameters - Additional parameters that will be passed as the second argument to the
   *    triggered event handler(s).
   * @returns {?} The value returned by the event handler. If there is no handler for the specified
   *     event type, then `undefined` is returned.
   */
  triggerHandler: function(event, extraParameters) {
    // Only trigger handlers if there are event handlers saved to the node
    return (event in this._$E_) ? nodeEventHandler.call(this, createEventObject(event), extraParameters)
                                : UNDEFINED;
  }
};

extend(EventTargetPrototype, prototypeExtensions);

// For browsers that don't have the EventTarget interface, extend the window with the event functions
if (!EventTarget) {
  extend(window, prototypeExtensions);
}


/**
 * Removes one or more event handlers set by `.on()` or `.one()`.
 * 
 * @function NodeCollection#off
 * @param {String} events - One or more space-separated event types, such as "click" or "click keypress".
 * @param {String} [selector] - A selector which should match the one originally passed to `.on()` when
 *     attaching event handlers.
 * @param {Function} [handler] - A handler function previously attached for the event(s), or the special
 *     value `false` (see `NodeCollection#on()`).
 * @see {@link http://api.jquery.com/off/#off-events-selector-handler|.off() | jQuery API Documentation}
 */
/**
 * Removes one or more event handlers set by `.on()` or `.one()`.
 * 
 * @function NodeCollection#off
 * @param {Object} events - An object where the string keys represent one or more space-separated event
 *     types and the values represent handler functions previously attached for the event(s).
 * @param {String} [selector] - A selector which should match the one originally passed to `.on()` when
 *     attaching event handlers.
 * @see {@link http://api.jquery.com/off/#off-events-selector|.off() | jQuery API Documentation}
 */
/**
 * Removes all event handlers set by `.on()` or `.one()`.
 * 
 * @function NodeCollection#off
 * @see {@link http://api.jquery.com/off/#off|.off() | jQuery API Documentation}
 */
NodeCollectionPrototype.off = callOnEach(EventTargetPrototype.off);

/**
 * @summary Attaches an event handler function for one or more events to each node in the collection.
 *  
 * @description
 * Check out [jQuery's documentation](http://api.jquery.com/on/) for details.
 * There are only a couple minor differences:
 * 1. Firebolt does not offer event namespacing.
 * 2. The native [Event](https://developer.mozilla.org/en-US/docs/Web/API/Event) object is passed to
 *    the handler (with an added `data` property, and if propagation is stopped, there will be a
 *    `propagationStopped` property set to `true`).
 * 
 * @function NodeCollection#on
 * @param {String} events - One or more space-separated event types, such as "click" or "click keypress".
 * @param {String} [selector] - A selector string to filter the descendants of the selected elements that trigger the
 *     event. If the selector is `null` or omitted, the event is always triggered when it reaches the selected element.
 * @param {*} [data] - Data to be passed to the handler in `eventObject.data` when an event is triggered.
 * @param {Function} handler(eventObject) - A function to execute when the event is triggered.
 *     Inside the function, `this` will refer to the node the event was triggered on. The value
 *     `false` is also allowed as a shorthand for a function that simply does `return false`.
 * @see {@link http://api.jquery.com/on/#on-events-selector-data-handler|.on() | jQuery API Documentation}
 */
/**
 * @summary Attaches an event handler function for one or more events to each node in the collection.
 *  
 * @description
 * Check out [jQuery's documentation](http://api.jquery.com/on/) for details.
 * There are only a couple minor differences:
 * 1. Firebolt does not offer event namespacing.
 * 2. The native [Event](https://developer.mozilla.org/en-US/docs/Web/API/Event) object is passed to
 *    the handler (with an added `data` property, and if propagation is stopped, there will be a
 *    `propagationStopped` property set to `true`).
 * 
 * @function NodeCollection#on
 * @param {Object} events - An object where the string keys represent one or more space-separated event types and the
 *     values represent handler functions to be called for the event(s).
 * @param {String} [selector] - A selector string to filter the descendants of the selected elements that trigger the
 *     event. If the selector is `null` or omitted, the event is always triggered when it reaches the selected element.
 * @param {*} [data] - Data to be passed to the handler in `eventObject.data` when an event is triggered.
 * @see {@link http://api.jquery.com/on/#on-events-selector-data|.on() | jQuery API Documentation}
 */
NodeCollectionPrototype.on = callOnEach(EventTargetPrototype.on);

/**
 * Attaches a handler to an event for each node in the collection.
 * The handler is executed at most once per node, per event type.
 * 
 * This function is the same as `NodeCollection#on()`, except the
 * event handler is removed after it executes for the first time.
 * 
 * @function NodeCollection#one
 * @param {String} events
 * @param {String} [selector]
 * @param {*} [data]
 * @param {Function} handler(eventObject)
 * @see {@link http://api.jquery.com/one/#one-events-selector-data-handler|.one() | jQuery API Documentation}
 */
/**
 * Attaches a handler to an event for each node in the collection.
 * The handler is executed at most once per node, per event type.
 * 
 * This function is the same as `NodeCollection#on()`, except the
 * event handler is removed after it executes for the first time.
 * 
 * @function NodeCollection#one
 * @param {Object} events
 * @param {String} [selector]
 * @param {*} [data]
 * @see {@link http://api.jquery.com/one/#one-events-selector-data|.one() | jQuery API Documentation}
 */
NodeCollectionPrototype.one = callOnEach(EventTargetPrototype.one);

/**
 * Triggers a real DOM event on each node in the collection for the given event type.
 * 
 * @function NodeCollection#trigger
 * @variation 1
 * @param {String} eventType - A string containing a JavaScript event type, such as "click" or "submit".
 * @param {*} extraParameters - Additional parameters that will be passed as the second argument to the
 *     triggered event handler(s).
 */
/**
 * Uses the input Event object to trigger the specified event on each node in the collection.
 * 
 * @function NodeCollection#trigger
 * @variation 2
 * @param {Event} event - An {@link https://developer.mozilla.org/en-US/docs/Web/API/Event | Event} object.
 * @param {*} extraParameters - Additional parameters that will be passed as the second argument to the
 *     triggered event handler(s).
 */
NodeCollectionPrototype.trigger = callOnEach(EventTargetPrototype.trigger);

/**
 * @summary Executes all handlers attached to the node for an event type.
 * 
 * @description
 * The `.triggerHandler()` method behaves similarly to `.trigger()`, with the following exceptions:
 * 
 * + The `.triggerHandler()` method does not cause the default behavior of an event to occur
 *   (such as a form submission or button click).
 * + While `.trigger()` will operate on all nodes in the collection, `.triggerHandler()` only affects the first node.
 * + Events triggered with `.triggerHandler()` do not bubble up the DOM hierarchy;
 *   if they are not handled by the target node directly, they do nothing.
 * + Instead of returning the node, `.triggerHandler()` returns whatever value was returned by the
 *   last handler it caused to be executed. If no handlers are triggered, it returns `undefined`.
 * 
 * @function NodeCollection#triggerHandler
 * @param {String} eventType - A string containing a JavaScript event type, such as "click" or "submit".
 * @param {*} extraParameters - Additional parameters that will be passed as the second argument to the
 *     triggered event handler(s).
 * @returns {?} The value returned by the event handler. If there is no handler for the specified
 *     event type or the NodeCollection is empty, then `undefined` is returned.
 */
NodeCollectionPrototype.triggerHandler = function() {
  return this[0] && EventTargetPrototype.triggerHandler.apply(this[0], arguments);
};
