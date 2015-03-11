QUnit.module('core/NodeList_HTMLCollection');

QUnit.test('has correct functions', function(assert) {
  var differentFuncs = [
    'afterPut',
    'appendWith',
    'appendTo',
    'beforePut',
    'concat',
    'copyWithin',
    'each',
    'fill',
    'prependWith',
    'prependTo',
    'putAfter',
    'putBefore',
    'remove',
    'removeClass',
    'replaceAll',
    'replaceWith',
    'reverse',
    'sort',
    'toggleClass',
    'unwrap',
    'wrapInner',
    'wrapWith',
  ];

  Object.keys(NodeList.prototype)
    .diff(['item', 'namedItem', 'uniq', 'length', '@@iterator'])
    .forEach(function(methodName) {
      if (differentFuncs.indexOf(methodName) >= 0) {
        assert.notEqual(NodeList.prototype[methodName], NodeCollection.prototype[methodName],
          'NodeList.prototype.' + methodName + ' != NodeCollection.prototype.' + methodName);
      } else {
        assert.equal(NodeList.prototype[methodName], NodeCollection.prototype[methodName],
          'NodeList.prototype.' + methodName + ' == NodeCollection.prototype.' + methodName);
      }

      assert.equal(HTMLCollection.prototype[methodName], NodeList.prototype[methodName],
        'HTMLCollection.prototype.' + methodName + ' == NodeList.prototype.' + methodName);
    });

  assert.equal(NodeList.prototype.namedItem, NodeCollection.prototype.namedItem,
    'NodeList.prototype.namedItem == NodeCollection.prototype.namedItem');

  assert.notEqual(HTMLCollection.prototype.namedItem, NodeList.prototype.namedItem,
    'HTMLCollection.prototype.namedItem != NodeList.prototype.namedItem');

  assert.equal(NodeList.prototype.uniq, NodeCollection.prototype.toNC,
    'NodeList.prototype.uniq == NodeCollection.prototype.toNC');
});
