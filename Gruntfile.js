module.exports = function(grunt) {
  'use strict';

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jsonlint: {
      all: {
        src: [
          'package.json',
          '.jshintrc',
          'src/.jshintrc',
          'test/tests/.jshintrc'
        ]
      }
    },
    jshint: {
      all: {
        src: [
          'Gruntfile.js',
          'build/**/*.js',
          'src/**/*.js',
          'test/tests/**/*.js'
        ],
        options: {
          jshintrc: true
        }
      }
    },
    copy: {
      all: {
        src: 'src/firebolt.js',
        dest: 'dist/firebolt.js'
      }
    },
    uglify: {
      options: {
        banner: '/*! Firebolt v<%= pkg.version %> | (c)2014 Nathan Woltman | fireboltjs.com/license */',
        sourceMap: true,
        sourceMapName: 'dist/firebolt.min.map'
      },
      build: {
        src: 'src/firebolt.js',
        dest: 'dist/firebolt.min.js'
      }
    },
    compare_size: {
      files: [
        'dist/firebolt.js',
        'dist/firebolt.min.js'
      ],
      options: {
        cache: 'build/.sizecache.json',
        compress: {
          gz: function(contents) {
            return require('gzip-js').zip(contents, {}).length;
          }
        }
      }
    }
  });

  // Load the Grunt plugins
  require('load-grunt-tasks')(grunt);

  // Load custom build tasks
  grunt.loadTasks('build');

  // Register tasks
  grunt.registerTask('lint', ['jsonlint', 'jshint']);
  grunt.registerTask('default', ['lint', 'copy', 'uglify', 'compare_size']);
  grunt.registerTask('release', ['copy', 'uglify', 'build.release']);
};
