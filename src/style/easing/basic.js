/**
 * Provides Firebolt with a basic set of easing functions (just "swing").
 * 
 * @module style/easing/basic
 * @requires core
 */

'use strict';


/**
 * A map of easing types to CSS transition functions.
 * 
 * This is the basic version that only provides the `swing` easing function.
 * 
 * @memberOf Firebolt
 * @type {Object}
 * @variation 1
 */
Firebolt.easing = {
  swing: 'cubic-bezier(.36,0,.64,1)'
};
