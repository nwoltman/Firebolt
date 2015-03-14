'use strict';

var fs = require('fs');

var EOL = '\n';
var EOLx2 = EOL + EOL;


function FireboltBuilder(src, dest) {
  if (!this) {
    return new FireboltBuilder(src, dest);
  }

  this.src = src;
  this.dest = dest;
}


//#region =============================== build ================================

/**
 * Builds Firebolt, configured with specific modules.
 *
 * @param configModules {String[]} - An array of module names to include in the build.
 */
FireboltBuilder.prototype.buildSync = function(configModules) {
  var src = this.src;
  var rgxVarsAndMain = /^(?:\s*\/\/#region VARS\s*([\S\s]*?)\s*\/\/#endregion VARS)?\s*([\S\s]*?)\s*$/;
  var modules = ['core']; // Core is required
  var moduleCode = {};
  var moduleNCFuncs = {};
  var moduleOverrides = {};
  var moduleClosureGlobals = {};

  function readModuleFileSync(module) {
    return fs.readFileSync(src + '/' + module + '.js', {encoding: 'utf8'});
  }

  function getDependencies(module) {
    var code = readModuleFileSync(module);
    var parts = code.split('\'use strict\';');
    var header = parts[0];

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

    // Parse required global closure variables
    var closureGlobalsMatch = /@closure_globals\s+(.*?)\s*$/m.exec(header);
    if (closureGlobalsMatch) {
      moduleClosureGlobals[module] = closureGlobalsMatch[1].split(/,\s*/);
    }

    // Parse override
    var override = /@overrides ([\w\/]+)/.exec(header);
    if (override) {
      moduleOverrides[module] = override[1];
    }

    moduleCode[module] = parts[1];

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
      for (k = 0; k < innerDeps.length; k++) {
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

  // Really just for debugging
  console.log(
    'Building Firebolt with modules (after resolving dependencies):',
    '[\n  ' + modules.join(',\n  ') + '\n]'
  );

  modules.shift(); // Remove "core"

  var vars = [];
  var mains = [];
  var ncfuncs = [];
  var closureGlobals = [];
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

    if (moduleName in moduleClosureGlobals) {
      var modClosureGlobals = moduleClosureGlobals[moduleName];
      for (j = 0; j < modClosureGlobals.length; j++) {
        var closureGlobal = modClosureGlobals[j];
        if (closureGlobals.indexOf(closureGlobal) < 0) {
          closureGlobals.push(closureGlobal);
        }
      }
    }
  }

  function indent(text) {
    return text.replace(/^.+/gm, '  $&');
  }

  var closureGlobalsString = '';
  if (closureGlobals.length) {
    closureGlobalsString = EOL + '  ' + closureGlobals.join(',' + EOL + '  ');
  }

  var code =
    readModuleFileSync('core')
      .replace(/\s*\/\/ CLOSURE_GLOBALS/, closureGlobalsString ? closureGlobalsString + ',' : '')
      .replace(/\s*\/\/ CLOSURE_GLOBALS/, closureGlobalsString ? ',' + closureGlobalsString : '')
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

  if (fs.existsSync(this.dest)) {
    this.cleanSync();
  } else {
    fs.mkdirSync(this.dest);
  }
  fs.writeFileSync(this.dest + '/firebolt.js', code);
};

//#endregion ============================ build ================================


//#region =============================== clean ================================

FireboltBuilder.prototype.clean = function(callback) {
  var dest = this.dest;
  fs.exists(dest, function(exists) {
    if (!exists) return callback(); // Nothing to do if the folder doesn't exist

    // Delete all files in the dest folder
    fs.readdir(dest, function(err, files) {
      var numFiles = files.length;
      if (numFiles === 0) return callback();

      var numUnlinkedFiles = 0;
      function afterUnlink(err) {
        if (err) console.err(err); // (don't return)

        if (++numUnlinkedFiles === numFiles)
          callback();
      }

      for (var i = 0; i < numFiles; i++) {
        fs.unlink(dest + '/' + files[i], afterUnlink);
      }
    });
  });
};

FireboltBuilder.prototype.cleanSync = function() {
  var dest = this.dest;
  if (!fs.existsSync(dest)) return; // Nothing to do if the folder doesn't exist

  // Delete all files in the dest folder
  fs.readdirSync(dest).forEach(function(file) {
    fs.unlinkSync(dest + '/' + file);
  });
};

//#endregion ============================ clean ================================


//#region ================================ zip =================================

FireboltBuilder.prototype.zipSync = function() {
  var Zip = require('adm-zip');

  var pathJs = this.dest + '/firebolt.js';
  var pathMin = this.dest + '/firebolt.min.js';
  var pathMap = this.dest + '/firebolt.min.map';
  var pathZip = this.dest + '/Firebolt.zip';

  // Package built Firebolt files into a .zip file
  var zip = new Zip();
  zip.addLocalFile(pathJs);
  zip.addLocalFile(pathMin);
  zip.addLocalFile(pathMap);
  zip.writeZip(pathZip);
};

//#endregion ============================= zip =================================


module.exports = FireboltBuilder;
