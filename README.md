Firebolt
========

> Slim, sleek, and speedy

Firebolt is a fast and lightweight JavaScript library for modern browsers. Its core functionality is based on jQuery, so if you already know how to use jQuery, you know how to use Firebolt (with a few minor exceptions).

---

**WARNING:** This project is still in the early stages of development. The API could change at any time and code is unstable.

---

Similar to <a href="http://zeptojs.com" target="_blank">Zepto.js</a>, Firebolt does not aim for 100% jQuery coverage. It stays lean by only targeting only modern browsers and specifically leaves out jQuery functions that were made obsolete by ES5 (i.e `jQuery.trim()`).

In addition to being very small, Firebolt also aims to be blazing fast. Many functions are heavily perfomance tested using <a href="http://jsperf.com" target="_blank">jsPerf</a> to obtain the highest possible performance average across today's most commonly used browsers.

### The Secret Sauce

Following in the footsteps of the <a href="http://prototypejs.org/" target="_blank">Prototype</a> framework, Firebolt extends the prototype of native objects. (In case you're worried about the longevity prototype-extending code, Firebolt also keeps a very close eye on future ECMAScript versions&mdash;such as the up-and-coming ES6&mdash;as well as the <a href="http://dom.spec.whatwg.org" target="_blank">DOM Living Standard</a> to make sure nothing will break when broswers start implementing these standards.) This makes coding with Firebolt feel more natural because you can call functions directly on the objects themselves, which allows you to write code in ways that provide better perfomance, and more clearly indicate what the code is doing. Here's an example of a button that, when clicked, toggles a <a href="http://getbootstrap.com" target="_blank">Bootstrap</a> class:

```html
<button class="btn btn-default" id="mybutton">Text</button>

<script>
  // jQuery
  $('#mybutton').toggleClass('btn-default btn-success');

  // Firebolt
  $$('mybutton').toggleClass('btn-default btn-success');
</script>
```

Even though the code is very similar for both Firebolt and jQuery (although Firebolt also fully supports jQuery syntax), what happens behind the scenes is very different. When using the jQuery syntax, the CSS selector string is parsed, the button element is added to an array-like collection, and the collection is then looped over to toggle the class of each element in the collection (or in this case, the one button element). With Firebolt's ID selector syntax, the native `document.getElementById()` function is used immediately to retrieve the button and `.toggleClass()` is called directly on the element to toggle its class name.

(This is a pretty feeble example of Firebolt's abilites. In the future, there will be a page of examples to show how you can write clear and performant code with Firebolt).

Furthermore, Firebolt's code base is alphabetized by class then function name, so it is fairly easy to find and remove any functions you don't need to make the library even smaller should you decide to use it, or on the other side of the spectrum, you can simply extract a few functions if you don't need the whole libary. All of this is just fine since Firebolt is open source software and is released under the friendly [MIT licence](https://github.com/FireboltJS/Firebolt/blob/master/LICENSE.txt).


## Browser Support

* Internet Explorer 9+
* Chrome 30+ (tested in 30+ but should support back to at least v21)
* Firefox 24+ (tested in 24+ but should support back to v16)
* Safari 5.1+
* Opera 12.1+
* iOS 5.1+
* Android 3.0+
* Blackberry 10+
* IE Mobile 10+


## API

[http://api.fireboltjs.com](http://api.fireboltjs.com)
