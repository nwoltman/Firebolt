<h1 align="center">
  <a href="http://fireboltjs.com" title="http://fireboltjs.com">
    <img alt="Firebolt - JavaScript Empowered" src="http://fireboltjs.com/img/logo_big.png" height="100px" />
  </a>
</h1>

[![Build Status](https://travis-ci.org/woollybogger/Firebolt.svg)](https://travis-ci.org/woollybogger/Firebolt)
[![devDependency Status](https://david-dm.org/woollybogger/Firebolt/dev-status.svg)](https://david-dm.org/woollybogger/Firebolt#info=devDependencies)

[![Sauce Test Status](https://saucelabs.com/browser-matrix/nwoltman.svg)](https://saucelabs.com/u/nwoltman)

[![Join the chat at https://gitter.im/woollybogger/Firebolt](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/woollybogger/Firebolt?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Firebolt is a high performance JavaScript library packed into a very small file size. Firebolt's functionality is based off of <a href="http://jquery.com" target="_blank">jQuery</a> (a lot of the [API](http://api.fireboltjs.com) is identical to jQuery's), but is built by extending the `prototype` of native objects, similar to the <a href="http://prototypejs.org" target="_blank">Prototype framework</a>. This opens up a whole new world of coding possibilities, allowing users of the library to write extremely efficient code, but with the simplicity of a jQuery-like API.


## Getting Started

### Setup

1. Clone the repo:
   ```sh
   git clone https://github.com/woollybogger/Firebolt.git
   ```

2. Install [Node.js](http://nodejs.org/)

3. Install dev dependencies:
   ```sh
   npm install
   npm install -g grunt-cli
   # *nix users may need `sudo` in front of these commands
   ```

### Running the General Build Task

```sh
grunt
```

### Creating a Custom Build

Run:

```sh
grunt build:<modules>
```

where `<modules>` is a comma-separated list of Firebolt modules.

Example:

```sh
grunt build:ajax/basic,style/css,timing,events
```

### Contributing

Please read the [contributing documentation](https://github.com/woollybogger/Firebolt/blob/master/CONTRIBUTING.md).


## Questions?

If you have any questions, please feel free to contact [Firebolt's creator](https://github.com/woollybogger).
