module.exports = function (grunt) {
  'use strict';

  grunt.registerTask('no_test_full', 'Warn the user that they cannot run test_full', function() {
    grunt.log.error('Cannot run "test_full" without Sauce Labs crendentials.');
    grunt.log.error('Please run `grunt test` to test locally.');
  });

  grunt.registerTask('no_test_custom', 'Warn the user that they cannot run test_custom', function() {
    grunt.log.error('Cannot run "test_custom" without Sauce Labs crendentials.');
    grunt.log.error('Please run `grunt test` to test locally.');
  });

};
