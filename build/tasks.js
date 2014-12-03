module.exports = function (grunt) {
  'use strict';

  grunt.registerTask('tasks.cleandist', 'Deletes the dist folder', function () {
    var fs = require('fs');
    fs.readdirSync('dist').forEach(function(file) {
      fs.unlink('dist/' + file);
    });
    grunt.log.ok('Cleaned dist folder.');
  });

  grunt.registerTask('tasks.release', 'Extra build steps for a release build', function () {
    var fs = require('fs');
    var AdmZip = require('adm-zip');

    var pathJs = 'dist/firebolt.js';
    var pathMin = 'dist/firebolt.min.js';
    var pathMap = 'dist/firebolt.min.map';
    var pathZip = 'dist/Firebolt.zip';

    // Package built Firebolt files into a .zip file
    var zip = new AdmZip();
    zip.addLocalFile(pathJs);
    zip.addLocalFile(pathMin);
    zip.addLocalFile(pathMap);
    zip.writeZip(pathZip);
    grunt.log.ok('Packaged Firebolt into "' + pathZip + '".');

    // Remove the source map comment from the minified Firebolt file
    var code = fs.readFileSync('dist/firebolt.min.js', {encoding: 'utf8'});
    code = code.replace(/\r?\n\/\/#.*/, ''); // Remove source map comment
    fs.writeFileSync('dist/firebolt.min.js', code);
    grunt.log.ok('Removed source map comment from "' + pathMin + '".');
  });

  grunt.registerTask('tasks.nofulltest', 'Warn the user that they cannot run fulltest', function () {
    grunt.log.error('Cannot run "fulltest" without Sauce Labs crendentials.');
    grunt.log.error('Please run `grunt build` to skip the fulltest or run `grunt dev` to test locally.');
  });

};
