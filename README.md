<h1 align="center">
  <a href="http://fireboltjs.com" title="http://fireboltjs.com">
    <img alt="Firebolt - JavaScript Empowered" src="http://fireboltjs.com/img/logo_big.png" height="100px" />
  </a>
</h1>

[![Build Status](https://travis-ci.org/woollybogger/Firebolt.svg)](https://travis-ci.org/woollybogger/Firebolt)
[![devDependency Status](https://david-dm.org/woollybogger/Firebolt/dev-status.svg)](https://david-dm.org/woollybogger/Firebolt#info=devDependencies)

[![Sauce Test Status](https://saucelabs.com/browser-matrix/nwoltman.svg)](https://saucelabs.com/u/nwoltman)

Firebolt is a high performance JavaScript library packed into a very small file size. Firebolt's functionality is based off of <a href="http://jquery.com" target="_blank">jQuery</a> (a lot of the [API](http://api.fireboltjs.com) is identical to jQuery's), but is built by extending the `prototype` of native objects, similar to the <a href="http://prototypejs.org" target="_blank">Prototype framework</a>. This opens up a whole new world of coding possibilties, allowing users of the libary to write extremely efficient code, but with the simplicity of a jQuery-like API.


## Getting Started

### Setup

Just clone the repo and you're all set!

```sh
git clone https://github.com/woollybogger/Firebolt.git
```

### Building Firebolt

Before you build for the first time, you must have [Node.js](http://nodejs.org/) installed and install dev dependencies with:

```sh
npm install
```

Then to build run:

```sh
grunt build
```

### Running Unit Tests

Simply open `test/index.html` in a browser to run unit tests.

If you have a [Sauce Labs](https://saucelabs.com/) account and you have exported your credentials as environment variables, you may also run tests with:

```bash
grunt test     # runs a single test
# or
grunt fulltest # runs tests on all browsers configured in the Gruntfile
```

### Contributing

Please read the [contributing documentation](https://github.com/woollybogger/Firebolt/blob/master/CONTRIBUTING.md).


## Questions?

If you have any questions, please feel free to contact [Firebolt's creator](https://github.com/woollybogger).
