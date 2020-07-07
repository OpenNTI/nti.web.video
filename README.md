# Video component, for ReactJS

![Build Status](https://github.com/NextThought/nti.web.video/workflows/Project%20Health/badge.svg)




##### File naming conventions:
- Mixins/Partials and utility files: `lower-case-hyphenated.js` (in a sub-directory grouping related ones together)
- Classes, Components, and Special-Meaning* files: `PascalNameCase.js(x)`

* Special-Meaning: Actions.js, Api.js, Constants.js, Store.js -- these files are special.

### Special-Meaning files

Files with special meaning should be consistent across all modules & libraries. They belong at the root of a module.

Example directory structure:
```
module-dir:
 ├ components
 │  ├ assets
 │  │  └ ...png
 │  ├ some-usefull-directory-grouping-of-components
 │  │  ├ assets
 │  │  │  └ ...png
 │  │  └ ...jsx
 │  ├ SomeComponent.jsx
 │  ├ SomeComponent.scss
 │  └ index.js
 ├ something-usefull
 │  ├ ...
 │  └ index.js
 ├ Actions.js   (only functions, each MUST do work then dispatch. No sub-Action files. All module actions go here.)
 ├ Api.js       (Interactions with externals...)
 ├ Constants.js (Only constant values)
 ├ Store.js     (exports a single store instance)
 ├ index.js
 ├ whatever.js
 └ utils.js
```

Modules should not contain sub-modules. They can however inter-depend.

### Development
This project uses ES6 JavaScript. ([WebPack][1] bundles and [babel][2] transpiles)

Please do not checkin dist bundles. This project is intended to be included into a larger project using a packager like [WebPack][1].


##### Setup:
```bash
$ npm install karma-cli --global
$ npm install
```

##### Testing:
```bash
$ make test
```

##### Running the test harness app:
```bash
$ npm start
```


   [1]: //webpack.github.io
   [2]: //babeljs.org
