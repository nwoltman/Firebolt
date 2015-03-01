module.exports = function (grunt) {
  'use strict';

  var fbBuilder = require('../firebolt-builder')('src', 'dist');

  grunt.registerTask('clean', 'Deletes the contents of the dist folder', function() {
    fbBuilder.cleanSync();
    grunt.log.ok('Cleaned dist folder.');
  });

  grunt.registerTask('build', 'Builds Firebolt from the source files', function(target) {
    grunt.config.requires(this.name);

    target = target || 'DEFAULT';

    var config = grunt.config(this.name);
    var configModules;

    if (target in config) { // Preset build
      var configPath = [this.name, target, 'modules'];
      grunt.config.requires(configPath);
      configModules = grunt.config(configPath);
    } else {                // Custom build
      configModules = target.split(',');
      grunt.task.run('uglify', 'package_release');
    }

    grunt.log.writeln('Building Firebolt with modules:', '[\n  ' + configModules.join(',\n  ') + '\n]');

    fbBuilder.buildSync(configModules);

    grunt.log.ok('Done building Firebolt');
  });

};
