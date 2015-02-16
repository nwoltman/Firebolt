/**
 * Provides Firebolt with a basic set of easing functions (just "swing").
 * 
 * @module style/easing/basic
 * @requires core
 */

/* global Firebolt */

'use strict';


/**
 * A map of easing types to CSS transition functions.
 * 
 * @memberOf Firebolt
 * @type {Object}
 */
Firebolt.easing = {
  swing: 'cubic-bezier(.36,0,.64,1)'
};
