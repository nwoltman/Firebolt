module.exports = function(grunt) {
  'use strict';

  // Define the browsers to test with Sauce Labs
  var platforms = {
    'Windows 7': {
      chrome: ['38', '39'],
      firefox: ['34', '35'],
      'internet explorer': ['9', '10', '11']
    },
    'OS X 10.8': {
      safari: ['6']
    },
    'OS X 10.9': {
      safari: ['7']
    },
    'OS X 10.10': {
      iphone: ['5.1', '8.1'],
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
        tasks: ['build:basic'],
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
          tunnelArgs: [
            '-D',
            '\'*.yahoo.com,*.apple.com,*.icloud.com,*.bing.com,*.google.com,' +
              '*.verisign.com,*.entrust.net,*.symb.com,*.cloudfront.net\''
          ],
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
    },

    uglify: {
      options: {
        banner: '/*! Firebolt v<%= pkg.version %> | (c)2014-2015 Nathan Woltman | fireboltjs.com/license */',
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
    }

  });

  // Load the Grunt plugins
  require('load-grunt-tasks')(grunt);

  // Load custom build tasks
  grunt.loadTasks('build/tasks');

  // --- Register tasks ---
  grunt.registerTask('lint', ['jsonlint', 'jshint']);
  grunt.registerTask('dev', ['connect:local_temp', 'watch']);
  grunt.registerTask('build:basic', ['tasks.cleandist', 'tasks.build']);
  grunt.registerTask('build', ['lint', 'build:basic', 'uglify', 'compare_size']);
  grunt.registerTask('release', ['build', 'tasks.package_release', 'tasks.gen_changelog']);

  // Only connect to Sauce if the user has Sauce credentials
  if (process.env.SAUCE_USERNAME && process.env.SAUCE_ACCESS_KEY) {
    grunt.registerTask('test', ['connect:temp', 'saucelabs-qunit:basic']);
    grunt.registerTask('fulltest', ['connect:temp', 'saucelabs-qunit:full']);
    grunt.registerTask('customtest', ['connect:temp', 'saucelabs-qunit:custom']);

    // Default: do a release build and run all tests
    grunt.registerTask('default', ['release', 'fulltest']);

  } else {
    grunt.registerTask('test', ['connect:local_persistant']);
    grunt.registerTask('fulltest', ['tasks.nofulltest']);

    // Default for no Sauce credentials: just do a release build
    grunt.registerTask('default', ['release']);
  }
};
