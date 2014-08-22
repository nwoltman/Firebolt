Firebolt Source Code
========

## Viewing on GitHub

I use Visual Studio to develop Firebolt, and unfortunately tabs are just easier to work with for indentation in VS rather than spaces. This makes viewing the code in a browser a little sloppy since most browsers display tabs with a default width of 8 spaces. Luckily, GitHub has a feature that allows you to specify the width of tabs when viewing source code. Using one of the following links will make the code a little bit easier to look at when viewing on GitHub:

+ [tab width: 4 spaces](https://github.com/woollybogger/Firebolt/blob/master/src/firebolt.js?ts=4) (this is what I use for development)
+ [tab width: 2 spaces](https://github.com/woollybogger/Firebolt/blob/master/src/firebolt.js?ts=2)


## Code Oddities

In order to keep code size at a minimum, there are a couple of areas where I purposely threw best practices out the window. The first, most obvious instance being the fact that the entire library is contained in a single file. This allows for maximum code reuse, which in turn maximizes compression by minification. The other strange form of code is places where variables and/or function arguments are reused for another purpose, sometimes where the name of the variable doesn't make the most sense. Again, this helps optimize minification by reducing the number of variables used, and sometimes by reducing the code needed for a `var` declaration.
