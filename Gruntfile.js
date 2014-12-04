module.exports = function(grunt) {
  'use strict';

  // Define the browser to test with Sauce Labs
  var platforms = {
    'Windows 8.1': {
      chrome: ['38', '39'],
      firefox: ['32', '33'],
      'internet explorer': ['11']
    },
    'Windows 8': {
      chrome: ['38', '39'],
      firefox: ['32', '33'],
      'internet explorer': ['10']
    },
    'Windows 7': {
      chrome: ['38', '39'],
      firefox: ['32', '33'],
      'internet explorer': ['9', '10', '11']
    },
    'OS X 10.8': {
      iPhone: ['6.0'],
      safari: ['6']
    },
    'OS X 10.9': {
      iPhone: ['8.1'],
      iPad: ['8.1'],
      safari: ['7']
    },
    'OS X 10.10': {
      safari: ['8']
    },
    Linux: {
      chrome: ['38', '39'],
      firefox: ['33', '34'],
      android: ['4.0', '4.4']
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
  var qunitTestsUrl = 'http://127.0.0.1:9999/test/index.html';

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
    connect: {
      temp: {
        options: {
          port: 9999
        }
      },
      local: {
        options: {
          port: 9999,
          open: qunitTestsUrl,
          keepalive: true
        }
      }
    },
    'saucelabs-qunit': {
      full: {
        options: {
          browsers: sauceBrowsers,
          build: process.env.TRAVIS_JOB_ID,
          concurrency: 3,
          tags: ['master'],
          testname: 'Firebolt QUnit full test',
          tunnelTimeout: 5,
          urls: [qunitTestsUrl]
        }
      },
      simple: {
        options: {
          browsers: [sauceBrowsers[1]],
          concurrency: 3,
          tags: ['master'],
          testname: 'Firebolt QUnit simple test',
          tunnelTimeout: 5,
          urls: [qunitTestsUrl]
        }
      },
      custom: {
        options: {
          browsers: [ ['OS X 10.8', 'iPhone', '6.0'] ],
          concurrency: 3,
          tags: ['master'],
          testname: 'Firebolt QUnit custom test',
          tunnelTimeout: 5,
          urls: [qunitTestsUrl]
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

  /* Register tasks */
  grunt.registerTask('lint', ['jsonlint', 'jshint']);
  grunt.registerTask('dev', ['lint', 'connect:local']);
  grunt.registerTask('cleanbuild', ['tasks.cleandist', 'copy', 'uglify']);
  grunt.registerTask('build', ['lint', 'cleanbuild', 'compare_size']);
  grunt.registerTask('release', ['lint', 'cleanbuild', 'tasks.release']);

  // Only connect to Sauce if the user has Sauce credentials
  if (process.env.SAUCE_USERNAME && process.env.SAUCE_ACCESS_KEY) {
    grunt.registerTask('test', ['lint', 'connect:temp', 'saucelabs-qunit:simple']);
    grunt.registerTask('fulltest', ['lint', 'connect:temp', 'saucelabs-qunit:full']);
    grunt.registerTask('customtest', ['connect:temp', 'saucelabs-qunit:custom']);
  } else {
    grunt.registerTask('test', ['lint', 'connect:local']); // Same as dev
    grunt.registerTask('fulltest', ['lint', 'tasks.nofulltest']);
  }

  // Default: run everything
  grunt.registerTask('default', ['fulltest', 'cleanbuild', 'compare_size', 'tasks.release']);
};
