module.exports = function (grunt) {
  'use strict';

  var fs = require('fs');

  function clean() {
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
  }

  grunt.registerTask('clean', 'Deletes the contents of the dist folder', clean);

  grunt.registerTask('build', 'Builds Firebolt from the source files', function(target) {
    grunt.config.requires(this.name);

    target = target || 'default';

    var config = grunt.config(this.name);
    var configModules;

    if (target in config) { // Configuration build
      var configPath = [this.name, target, 'modules'];
      grunt.config.requires(configPath);
      configModules = grunt.config(configPath);
    } else {                // Custom build
      configModules = target.split(',');
      grunt.task.run('uglify', 'package_release');
    }

    var EOL = '\n';
    var EOLx2 = EOL + EOL;

    var rgxVarsAndMain = /^(?:\s*\/\/#region VARS\s*([\S\s]*?)\s*\/\/#endregion VARS)?\s*([\S\s]*?)\s*$/;
    var modules = ['core']; // Core is required
    var moduleCode = Object.create(null);
    var moduleNCFuncs = Object.create(null);
    var moduleOverrides = Object.create(null);

    function readModuleFileSync(module) {
      return fs.readFileSync('src/' + module + '.js', {encoding: 'utf8'});
    }

    function getDependencies(module) {
      var code = readModuleFileSync(module);
      var parts = code.split('\'use strict\';');
      var header = parts[0];

      moduleCode[module] = parts[1];

      // Parse dependencies
      var deps = header.match(/@requires [\w\/]+/g) || [];
      for (var i = 0; i < deps.length; i++) {
        deps[i] = deps[i].slice(10); // Slice off '@requires'
      }

      // Parse NodeCollection function names
      var ncfuncsMatch = /@ncfuncs\s+(.*?)\s*$/m.exec(header);
      if (ncfuncsMatch) {
        moduleNCFuncs[module] = '\'' + ncfuncsMatch[1].replace(/,/g, '') + ' \' +';
      }

      // Parse override
      var override = /@overrides ([\w\/]+)/.exec(header);
      if (override) {
        moduleOverrides[module] = override[1];
      }

      return deps;
    }

    var i, j, k;
    for (i = 0; i < configModules.length; i++) {
      var module = configModules[i];
      if (modules.indexOf(module) >= 0)
        continue;

      // Get everything the module depends on
      var deps = [module]; // Module depends on itself
      for (j = 0; j < deps.length; j++) {
        var innerDeps = getDependencies(deps[j]);
        for (var k = 0; k < innerDeps.length; k++) {
          var dep = innerDeps[k];
          if (deps.indexOf(dep) < 0 && modules.indexOf(dep) < 0) {
            deps.push(dep);
          }
        }
      }

      // Add the dependency modules to the set of modules (most depended on modules first)
      for (j = deps.length - 1; j >= 0; j--) {
        modules.push(deps[j]);
      }
    }

    // Replace overridden modules with their overrider
    for (var overrider in moduleOverrides) {
      var overridee = moduleOverrides[overrider];
      var overrideeIndex = modules.indexOf(overridee);
      if (overrideeIndex < 0) continue;
      modules[overrideeIndex] = overrider;
      modules.splice(modules.indexOf(overrider), 1);
    }

    grunt.log.writeln('Building Firebolt with modules:', '[\n  ' + modules.join(',\n  ') + '\n]');

    modules.shift(); // Remove "core"

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

    if (fs.existsSync('dist')) {
      clean();
    } else {
      fs.mkdirSync('dist');
    }
    fs.writeFileSync('dist/firebolt.js', code);

    grunt.log.ok('Done building Firebolt');
  });

};
