module.exports = function(grunt) {
  'use strict';

  // Define the browsers to test with Sauce Labs
  var platforms = {
    'Windows 7': {
      chrome: ['39', '40'],
      firefox: ['34', '35'],
      'internet explorer': ['9', '10', '11']
    },
    'OS X 10.8': {
      iphone: ['5.1'],
      safari: ['6']
    },
    'OS X 10.9': {
      safari: ['7']
    },
    'OS X 10.10': {
      iphone: ['8.1'],
      safari: ['8']
    },
    Linux: {
      android: ['4.0', '4.4'],
      opera: ['12.15']
    }
  };

  var sauceBrowsers = [];

  for (var platform in platforms) {
    var browsers = platforms[platform];
    for (var browser in browsers) {
      var versions = browsers[browser];
      for (var i = 0; i < versions.length; i++) {
        sauceBrowsers.push([platform, browser, versions[i]]);
      }
    }
  }

  // Define more options
  var qunitTestsUrl = 'http://127.0.0.1:9999/test/index.html?hidepassed';

  // Project configuration.
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    jsonlint: {
      all: {
        src: [
          'package.json',
          '.jshintrc',
          'src/.jshintrc',
          'test/unit/.jshintrc'
        ]
      }
    },

    jshint: {
      all: {
        src: [
          'Gruntfile.js',
          'build/**/*.js',
          'src/**/*.js',
          'test/unit/**/*.js'
        ],
        options: {
          jshintrc: true
        }
      }
    },

    build: {
      ALL: {
        modules: [
          'core',
          'ajax/basic',
          'data',
          'event',
          'form',
          'number/es6',
          'number/extras',
          'php',
          'string/es6',
          'string/extras',
          'style/animation',
          'style/css',
          'style/display',
          'timing',
          'tmpl'
        ]
      },
      DEFAULT: {
        modules: [
          'core',
          'ajax/basic',
          'data',
          'event',
          'form',
          'string/extras',
          'style/animation',
          'style/css',
          'style/display'
        ]
      }
    },

    uglify: {
      options: {
        banner: '/*! Firebolt v<%= pkg.version %> | (c)2014-2015 Nathan Woltman | fireboltjs.com/license */',
        screwIE8: true,
        sourceMap: true,
        sourceMapName: 'dist/firebolt.min.map'
      },
      build: {
        src: 'dist/firebolt.js',
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
            return require('gzip-js').zip(contents).length;
          }
        }
      }
    },

    connect: {
      temp: {
        options: {
          port: 9999
        }
      },
      local_temp: {
        options: {
          port: 9999,
          open: qunitTestsUrl
        }
      },
      local_persistant: {
        options: {
          port: 9999,
          open: qunitTestsUrl,
          keepalive: true
        }
      }
    },

    watch: {
      source: {
        files: ['src/**/*.js'],
        tasks: ['build:ALL'],
        options: {
          atBegin: true,
          spawn: false
        },
      },
    },

    'saucelabs-qunit': {
      full: {
        options: {
          browsers: sauceBrowsers,
          build: Date.now(), // Use `Date.now()` instead of `process.env.TRAVIS_JOB_ID` so every build run is unique
          sauceConfig: {'video-upload-on-pass': false, 'record-logs': false},
          tags: ['master', 'full'],
          testname: 'Firebolt QUnit full test',
          urls: [qunitTestsUrl]
        }
      },
      basic: {
        options: {
          browsers: [sauceBrowsers[1]],
          concurrency: 1,
          tags: ['master', 'basic'],
          testname: 'Firebolt QUnit basic test',
          urls: [qunitTestsUrl]
        }
      },
      custom: {
        options: {
          browsers: [ ['OS X 10.8', 'iPhone', '5.1'] ],
          concurrency: 1,
          tags: ['master', 'custom'],
          testname: 'Firebolt QUnit custom test',
          urls: [qunitTestsUrl]
        }
      }
    }

  });

  // Load the Grunt plugins
  require('load-grunt-tasks')(grunt);

  // Load custom build tasks
  grunt.loadTasks('build/tasks');

  // --- Register tasks ---
  grunt.registerTask('lint', ['jsonlint', 'jshint']);
  grunt.registerTask('dev', ['connect:local_temp', 'watch']);
  grunt.registerTask('release', ['default', 'package_release', 'gen_changelog']);

  // Only connect to Sauce if the user has Sauce credentials
  if (process.env.SAUCE_USERNAME && process.env.SAUCE_ACCESS_KEY) {
    grunt.registerTask('test', ['build:ALL', 'connect:temp', 'saucelabs-qunit:basic']);
    grunt.registerTask('test_full', ['build:ALL', 'connect:temp', 'saucelabs-qunit:full']);
    grunt.registerTask('test_custom', ['build:ALL', 'connect:temp', 'saucelabs-qunit:custom']);
  } else {
    grunt.registerTask('test', ['build:ALL', 'connect:local_persistant']);
    grunt.registerTask('test_full', ['no_test_full']);
    grunt.registerTask('test_custom', ['no_test_custom']);
  }

  // Travis CI: do a release build and run all tests
  grunt.registerTask('ci', ['release', 'test_full']);

  // Default
  grunt.registerTask('default', ['lint', 'build:DEFAULT', 'uglify', 'compare_size']);
};
