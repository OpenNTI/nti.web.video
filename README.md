# Video component, for ReactJS



##### File naming conventions:
- Mixins and Partials: `lower-case-hyphenated.js` (in a sub-directory grouping related ones together)
- Classes and Components: `PascalNameCase.js(x)`

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
