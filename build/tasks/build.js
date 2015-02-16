module.exports = function (grunt) {
  'use strict';

  grunt.registerTask('tasks.cleandist', 'Deletes the contents of the dist folder', function() {
    var fs = require('fs');

    // Nothing to do if the folder doesn't exist
    if (!fs.existsSync('dist')) {
      grunt.log.ok('Nothing to do.');
      return;
    }

    // Delete all files in the dist folder
    fs.readdirSync('dist').forEach(function(file) {
      fs.unlinkSync('dist/' + file);
    });

    grunt.log.ok('Cleaned dist folder.');
  });


  grunt.registerTask('tasks.build', 'Builds Firebolt from the source files', function() {
    var fs = require('fs');

    var EOL = '\n';
    var EOLx2 = EOL + EOL;

    var rgxVarsAndMain = /^(?:\s*\/\/#region VARS\s*([\S\s]*?)\s*\/\/#endregion VARS)?\s*([\S\s]*?)\s*$/;
    var config = JSON.parse(
      fs.readFileSync('build/config.all.json', {encoding: 'utf8'})
    );
    var modules = [];
    var moduleCode = Object.create(null);
    var moduleNCFuncs = Object.create(null);
    var i;

    function readModuleFileSync(module) {
      return fs.readFileSync('src/' + module + '.js', {encoding: 'utf8'});
    }

    function getDependencies(module) {
      var code = readModuleFileSync(module);
      var parts = code.split('\'use strict\';');

      moduleCode[module] = parts[1];

      // Parse dependencies
      var deps = parts[0].match(/@requires [\w\/]+/g) || [];
      for (var i = 0; i < deps.length; i++) {
        deps[i] = deps[i].slice(10); // Slice off '@requires'
      }

      // Parse NodeCollection function names
      var ncfuncsMatch = /@ncfuncs\s+(.*?)\s*$/m.exec(parts[0]);
      if (ncfuncsMatch) {
        moduleNCFuncs[module] = '\'' + ncfuncsMatch[1].replace(/,/g, '') + ' \' +';
      }

      return deps;
    }

    for (var module in config) {
      if (module === 'core' || config[module] !== true || modules.indexOf(module) >= 0)
        continue;

      // Get everything the module depends on
      var deps = [module]; // Module depends on itself
      for (i = 0; i < deps.length; i++) {
        var innerDeps = getDependencies(deps[i]);
        for (var j = 0; j < innerDeps.length; j++) {
          var dep = innerDeps[j];
          if (dep !== 'core' && deps.indexOf(dep) < 0) {
            deps.push(dep);
          }
        }
      }

      // Add the dependency modules to the set of modules (most depended on modules first)
      for (i = deps.length - 1; i >= 0; i--) {
        if (modules.indexOf(deps[i]) < 0) {
          modules.push(deps[i]);
        }
      }
    }

    if (modules.indexOf('ajax/advanced') >= 0) {
      var basicIndex = modules.indexOf('ajax/basic');
      if (basicIndex >= 0) {
        modules.splice(basicIndex, 1);
      }
    }

    grunt.log.writeln('Building Firebolt with modules:', '[\n  ' + modules.join(',\n  ') + '\n]');

    var vars = [];
    var mains = [];
    var ncfuncs = [];
    for (i = 0; i < modules.length; i++) {
      var moduleName = modules[i];
      var parts = rgxVarsAndMain.exec(moduleCode[moduleName]);
      var varCode = parts[1];
      var mainCode = parts[2];

      if (varCode) {
        vars.push('/* ' + moduleName + ' */' + EOL + varCode);
      }

      mains.push(
        '//#region ' + moduleName + EOLx2 +
        mainCode + EOLx2 +
        '//#endregion ' + moduleName
      );

      if (moduleName in moduleNCFuncs) {
        ncfuncs.push(moduleNCFuncs[moduleName]);
      }
    }

    function indent(text) {
      return text.replace(/^.+/gm, '  $&');
    }

    var code =
      readModuleFileSync('core')
        .replace(
          '//#region MODULE_VARS',
          // Use a function to create the replacement string so that `$*` special
          // replacement patterns in the code aren't accidentally used
          function() {
            return '//#region MODULE_VARS' + EOLx2 + vars.map(indent).join(EOLx2) + EOL;
          }
        )
        .replace('// NCFUNCS', ncfuncs.join(EOL + '   '))
        .replace(
          '//#region MODULES',
          // Use a function to create the replacement string so that `$*` special
          // replacement patterns in the code aren't accidentally used
          function() {
            return '//#region MODULES' + EOLx2 + mains.map(indent).join(EOLx2 + EOL) + EOL;
          }
        )
        .replace(/\r/g, ''); // Force Unix line endings

    if (!fs.existsSync('dist')) {
      fs.mkdirSync('dist');
    }
    fs.writeFileSync('dist/firebolt.js', code);

    grunt.log.ok('Done building Firebolt');
  });

};
