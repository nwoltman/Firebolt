/**
 * Unit tests for NodeList.prototype
 */

// References for Resharper
/// <reference path="../qunit/qunit.js"/>
/// <reference path="../../src/firebolt.js"/>

module('NodeList.prototype');

test('has correct functions', function() {
	var differentFuncs = [
			'after', 'afterPut',
			'append', 'appendWith',
			'appendTo',
			'before', 'beforePut',
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
			'wrap',
			'wrapInner'
		];

	Object.keys(NodeList.prototype)
		.remove('item', 'uniq', 'length', '@@iterator')
		.forEach(function(methodName) {
			if (differentFuncs.contains(methodName)) {
				ok(NodeList.prototype[methodName] !== NodeCollection.prototype[methodName],
					'NodeList.prototype.' + methodName + ' !== NodeCollection.prototype.' + methodName);
			} else {
				ok(NodeList.prototype[methodName] === NodeCollection.prototype[methodName],
					'NodeList.prototype.' + methodName + ' === NodeCollection.prototype.' + methodName);
			}
		});
	ok(NodeList.prototype.uniq === NodeCollection.prototype.toNC,
		'NodeList.prototype.uniq === NodeCollection.prototype.toNC');
});
