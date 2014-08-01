/**
 * Unit tests for the Firebolt function and namespace
 */

// References for Resharper
/// <reference path="../qunit/qunit.js"/>
/// <reference path="../../src/firebolt.js"/>

module('Firebolt');

test('parseHTML', function() {
	var iframe = document.createElement('iframe'),
		element;

	element = Firebolt.parseHTML('<div/>')[0];
	ok(element && element.tagName.toLowerCase() === 'div', 'Can make a simple, single element.');

	ok(element && element.ownerDocument === document, 'By default, creates elements in the context of the current document.');

	document.head.appendChild(iframe);
	element = Firebolt.parseHTML('<div/>', iframe.contentDocument)[0];
	ok(element && element.ownerDocument === iframe.contentDocument, 'Can create elements in the context of another document.');
	iframe.remove();

	'option optgroup thead tbody tfoot colgroup caption tr col td th script link legend'.split(' ').forEach(function(tagName) {
		element = Firebolt.parseHTML('<' + tagName + ' class="test" />')[0];
		ok(element && element.tagName.toLowerCase() === tagName && element.className === 'test',
			'Can make special element: <' + tagName + '>.');
	});

	ok(Firebolt.parseHTML('<p>para</p><br/>').length === 2, 'Can make multiple elements.');

	document.body.appendChild(Firebolt.parseHTML('<script>window.whoa=9</script>')[0]);
	ok(window.whoa != 9, 'Created scripts are not evaluated.');
});