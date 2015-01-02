/**
 * Unit tests for NodeList.prototype
 */

// References for Resharper
/// <reference path="../qunit/qunit.js"/>
/// <reference path="../../src/firebolt.js"/>

QUnit.module('NodeList.prototype');

QUnit.test('has correct functions', function(assert) {
	var differentFuncs = [
			'afterPut', 'after',
			'appendWith', 'append',
			'appendTo',
			'beforePut', 'before',
			'concat',
			'copyWithin',
			'each',
			'fill',
			'prependWith', 'prepend',
			'prependTo',
			'putAfter', 'insertAfter',
			'putBefore', 'insertBefore',
			'remove',
			'removeClass',
			'replaceAll',
			'replaceWith',
			'reverse',
			'sort',
			'toggleClass',
			'unwrap',
			'wrapInner',
			'wrapWith', 'wrap'
		];

	Object.keys(NodeList.prototype)
		.remove('item', 'uniq', 'length', '@@iterator')
		.forEach(function(methodName) {
			if (differentFuncs.contains(methodName)) {
				assert.ok(NodeList.prototype[methodName] !== NodeCollection.prototype[methodName],
					'NodeList.prototype.' + methodName + ' !== NodeCollection.prototype.' + methodName);
			} else {
				assert.ok(NodeList.prototype[methodName] === NodeCollection.prototype[methodName],
					'NodeList.prototype.' + methodName + ' === NodeCollection.prototype.' + methodName);
			}
		});
	assert.ok(NodeList.prototype.uniq === NodeCollection.prototype.toNC,
		'NodeList.prototype.uniq === NodeCollection.prototype.toNC');
});
