module.exports = function (grunt) {
  'use strict';

  grunt.registerTask('tasks.nofulltest', 'Warn the user that they cannot run fulltest', function() {
    grunt.log.error('Cannot run "fulltest" without Sauce Labs crendentials.');
    grunt.log.error('Please run `grunt build` to skip the fulltest or run `grunt dev` to test locally.');
  });

};
