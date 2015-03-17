QUnit.module('tmpl');

QUnit.test('Firebolt.tmpl', function(assert) {
  var compiled = Firebolt.tmpl('<p>hello</p>');
  assert.strictEqual(typeof compiled, 'function',
    'Returns a compiled template function when the first argument is a string.');

  compiled = Firebolt.tmpl(document.getElementById('tmpl-test'));
  assert.strictEqual(typeof compiled, 'function',
    'Returns a compiled template function when the first argument is a <script> element.');
});

QUnit.test('Firebolt.tmpl() - compiled function', function(assert) {
  var compiled = Firebolt.tmpl('<p>hello</p>');
  assert.strictEqual(compiled(), '<p>hello</p>', 'Can render a basic string.');

  compiled = Firebolt.tmpl('<%- o %>');
  assert.strictEqual(compiled('a'), 'a', 'Has access to the input data.');

  compiled = Firebolt.tmpl('\' \\ \n');
  assert.strictEqual(compiled(), '\' \\ \n', 'Properly renders special characters.');

  compiled = Firebolt.tmpl(document.getElementById('tmpl-test'));
  var data = {
    title: 'My Cool Project',
    license: {
      name: 'MIT',
      url: 'http://www.opensource.org/licenses/MIT'
    },
    features: [
      'New',
      'Powerful',
      'Easy to use'
    ]
  };
  var expected = '\n' +
  '  <h3>My Cool Project</h3>\n' +
  '  <p>\n' +
  '    Released under the\n' +
  '    <a href="http://www.opensource.org/licenses/MIT">MIT</a>.\n' +
  '  </p>\n' +
  '  <h4>Features</h4>\n' +
  '  <ul>\n' +
  '  \n' +
  '    <li>New</li>\n' +
  '  \n' +
  '    <li>Powerful</li>\n' +
  '  \n' +
  '    <li>Easy to use</li>\n' +
  '  \n' +
  '  </ul>\n';
  assert.strictEqual(compiled(data), expected, 'Compiles a complex string with data.');
});

QUnit.test('<% %>', function(assert) {
  var compiled = Firebolt.tmpl('<% for (var i = 0; i < 3; i++) { %>a<% } %>');
  assert.strictEqual(compiled(), 'aaa', 'Evaluates JavaScript.');
});

QUnit.test('<%= %>', function(assert) {
  var compiled = Firebolt.tmpl('<%= o %>');
  assert.strictEqual(
    compiled('<img src="site.com" data-a="a&b\'c" />'),
    '&lt;img src=&quot;site.com&quot; data-a=&quot;a&amp;b&#39;c&quot; /&gt;',
    'Renders data as HTML-escaped text.'
  );

  compiled = Firebolt.tmpl('<%= o.a %><%= o.b %>');
  assert.strictEqual(compiled({a: null}), '',
    'Renders an empty string when `null` or `undefined` are interpolated.');
});

QUnit.test('<%- %>', function(assert) {
  var compiled = Firebolt.tmpl('<%- o %>');
  assert.strictEqual(
    compiled('<img src="site.com" data-a="a&b\'c" />'),
    '<img src="site.com" data-a="a&b\'c" />',
    'Renders data as plain text.'
  );

  compiled = Firebolt.tmpl('<%- o.a %><%- o.b %>');
  assert.strictEqual(compiled({a: null}), '',
    'Renders an empty string when `null` or `undefined` are interpolated.');

  compiled = Firebolt.tmpl('<%- o %>');
  assert.strictEqual(compiled(1), '1',
    'Renders non-string data as a string.');
});

QUnit.test('dataIdentifier parameter', function(assert) {
  var compiled = Firebolt.tmpl('<%- data %>', 'data');
  assert.strictEqual(compiled('a'), 'a',
    'Changes the variable name used to access the input data.');
});
