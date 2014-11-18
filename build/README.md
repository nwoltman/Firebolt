Build Firebolt
==============

You'll need to have [Node.js](http://nodejs.org/) installed and in your PATH.

Just `cd` to this folder (`Firebolt/build`) and run:

### Configure

Windows:
```bash
configure.bat
```

Unix:
```bash
./configure.sh
```

(You only need to configure the first time)

### Build

```bash
node make
```

Output will be saved in `Firebolt/dist`.
