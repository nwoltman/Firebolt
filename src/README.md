Firebolt Source Code
========

## Code Oddities

In order to keep code size at a minimum, there are a couple of areas where I purposely threw best practices out the window. The first, most obvious instance being the fact that the entire library is contained in a single file. This allows for maximum code reuse, which in turn maximizes compression by minification. The other strange form of code is places where variables and/or function arguments are reused for another purpose, sometimes where the name of the variable doesn't make the most sense. Again, this helps optimize minification by reducing the number of variables used, and sometimes by reducing the code needed for a `var` declaration.
