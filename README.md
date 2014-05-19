Firebolt
========

> "Smaller, better, faster, stronger."

Firebolt is a fast and lightweight JavaScript library for modern browsers. Its core functionality is based on jQuery, so if you already know how to use jQuery, you know how to use Firebolt (with a few minor exceptions).

---

### WARNING:
This project is still in the early stages of development. The API could change at any time and code is unstable.

---

Similar to <a href="http://zeptojs.com" target="_blank">Zepto.js</a>, Firebolt does not aim for 100% jQuery coverage. It stays lean by only targeting only modern browsers and specifically leaves out jQuery functions that were made obsolete by ES5 (i.e `jQuery.trim()`).

In addition to being very small, Firebolt also aims to be blazing fast. Many functions are heavily perfomance tested using <a href="http://jsperf.com" target="_blank">jsPerf</a> to obtain the highest possible performance average across all modern browsers.

### The Secret Sauce

Firebolt extends the prototype of native objects. Now you may be thinking, "But I've always heard that modifying prototypes is a bad thing." A few years ago this may have been true, but nowadays JavaScript has been implemented quite consistently among modern broswers, so there is less to worry about. Firebolt also keeps a very close eye on future ECMAScript versions (such as the up-and-coming ES6) as well as the <a href="http://dom.spec.whatwg.org" target="_blank">DOM Living Standard</a> to make sure nothing will break when broswers start implementing these standards.

With the old worries about prototype modification abated, we can focus on the benefits. The first benefit is that coding with Firebolt feels more natural because you can call functions directly on the objects themselves. Second, Firebolt allows you to write code in ways that provide better perfomance, and more clearly indicate what the code is doing. Here's an example of a button that, when clicked, toggles a <a href="http://getbootstrap.com" target="_blank">Bootstrap</a> class:

```html
<!-- jQuery -->
<button class="btn btn-default" onclick="$(this).toggleClass('btn-default btn-success')">Text</button>

<!-- Firebolt -->
<button class="btn btn-default" onclick="this.toggleClass('btn-default btn-success')">Text</button>
```

Notice how `toggleClass` was called directly on the button in the Firebolt version, whereas jQuery had to wrap it in a jQuery object first (which also has a perfomance cost).

(This isn't the best example of Firebolt's abilites. In the future, I will create a page of examples of how you can write clear and performant code with Firebolt).

Furthermore, Firebolt's code base simple and easy to follow, so it is very easy to remove any functions you don't need to make the library even smaller should you decide to use it, or on the other side of the spectrum, you can simply extract a few functions if you don't need the whole libary. All of this is just fine since Firebolt is open source software and is released under the friendly [MIT licence](https://github.com/FireboltJS/Firebolt/blob/master/LICENSE.txt).


## Browser Support

* Internet Explorer 9+
* Chrome 30+
* Firefox 24+
* Safari 5.1+
* Opera 12.1+
* iOS 5.1+
* Android 3.0+
* Blackberry 10+
* IE Mobile 10+


## API

[http://api.fireboltjs.com](http://api.fireboltjs.com)
