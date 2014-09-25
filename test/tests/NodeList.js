/**
 * Unit tests for NodeList.prototype
 */

// References for Resharper
/// <reference path="../qunit/qunit.js"/>
/// <reference path="../../src/firebolt.js"/>

module('NodeList.prototype');

test('has correct functions', function() {
	var NodeCollection = $TAG('div').toNC(),
		differentFuncs = [
			'after', 'afterPut',
			'append', 'appendWith',
			'appendTo',
			'before', 'beforePut',
			'concat',
			'each',
			'prependWith', 'prepend',
			'prependTo',
			'putAfter', 'insertAfter',
			'putBefore', 'insertBefore',
			'remove',
			'removeClass',
			'replaceAll',
			'replaceWith',
			'sort',
			'toggleClass',
			'unwrap',
			'wrap',
			'wrapInner'
		],
		nodeListFuncs = Object.keys(NodeList.prototype).remove('item', 'uniq', 'length', '@@iterator');

	nodeListFuncs.forEach(function(methodName) {
		if (differentFuncs.contains(methodName)) {
			ok(NodeList.prototype[methodName] !== NodeCollection[methodName],
				'NodeList.prototype.' + methodName + ' !== NodeCollection.prototype.' + methodName);
		}
		else {
			ok(NodeList.prototype[methodName] === NodeCollection[methodName],
				'NodeList.prototype.' + methodName + ' === NodeCollection.prototype.' + methodName);
		}
	});
});
