module.exports = function (grunt) {
  'use strict';

  grunt.registerTask('package_release', 'Generate a release package after a build', function() {
    // Package built files into a .zip file
    require('../firebolt-builder')('src', 'dist').zipSync();
    grunt.log.ok('Packaged Firebolt into "dist/Firebolt.zip".');

    // Remove the source map comment from the minified Firebolt file
    var fs = require('fs');
    var code = fs.readFileSync('dist/firebolt.min.js', {encoding: 'utf8'});
    code = code.replace(/\s*\/\/#.*/, ''); // Remove source map comment
    fs.writeFileSync('dist/firebolt.min.js', code);
    grunt.log.ok('Removed source map comment from "dist/firebolt.min.js".');
  });

  grunt.registerTask('gen_changelog', 'Add the changes since the last release to the change log', function() {
    var done = this.async();

    var pkg = grunt.config.data.pkg;
    var lastVersion = pkg.version;
    var repoURL = pkg.repository.url.slice(0, -4); // Slice off ".git"
    var command = 'git --no-pager log v' + lastVersion + '... ' +
                  '--pretty=format:"+ %s ([view](' + repoURL + '/commit/%H))"';

    require('child_process').exec(command, function(error, stdout) {
      if (error) {
        grunt.log.error('There was an error reading the git log output.');
        grunt.fail.fatal(error);
        return;
      }

      var fs = require('fs');

      var code = fs.readFileSync('dist/firebolt.js', {encoding: 'utf8'});
      var curVersion = /@version (\d+\.\d+\.\d+)/.exec(code)[1];
      var date = new Date().toISOString().slice(0, 10); // Slice off the time
      var versionHeader = '## ' + curVersion + ' (' + date + ')\n';

      // Filter out messages that don't need to be in the change log
      var changes = stdout.replace(/^\+ (?:build:|deps:|grunt:|sauce:|test:|Update).*\r?\n?/gm, '');

      var changelog = fs.readFileSync('CHANGELOG.md', {encoding: 'utf8'}); // Get current changelog
      changelog = 'CHANGELOG\n' +
                  '=========\n\n' +
                  versionHeader + changes + '\n' +
                  changelog.replace(/^CHANGELOG\s+=+\s+/, ''); // Remove the current header

      grunt.log.ok('Writing out change log');
      fs.writeFile('CHANGELOG.md', changelog, done);
    });
  });

};
