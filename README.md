# Video component, for ReactJS

Example Usage:
```HTML
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<meta http-equiv="Content-Type" content="Type=text/html; charset=utf-8"/>
	<meta http-equiv="X-UA-Compatible" content="IE=edge" />
	<meta name="msapplication-tap-highlight" content="no" />
	<meta http-equiv="cleartype" content="on"/>
	<meta name="viewport" content="user-scalable=no, width=device-width, initial-scale=1.0, maximum-scale=1.0" />
	<!-- android -->
	<meta name="mobile-web-app-capable" content="yes"/>
	<!-- iOS -->
	<meta name="apple-mobile-web-app-capable" content="yes"/>
	<meta name="apple-mobile-web-app-status-bar-style" content="black"/>
	<meta name="apple-mobile-web-app-title" content="nextthought app"/>
	<title>NextThought Video</title>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/react/0.14.0/react.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/react/0.14.0/react-dom.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/fetch/0.9.0/fetch.min.js"></script>
	<script src="./nti.react-video.js"></script>
</head>
<body>
	<h3>Kaltura</h3>
	<div id="kaltura"></div>
	<script type="text/javascript">
    	ReactDOM.render(
    		React.createElement(NTIVideo, {src: 'kaltura://1500101/0_nmii7y4j/'}),
    		document.getElementById('kaltura')
    	);
	</script>
</body>
</html>
```

##### File naming conventions:
- Mixins and Partials: `lower-case-hyphenated.js` (in a sub-directory grouping related ones together)
- Classes and Components: `PascalNameCase.js(x)`

### Development
This project uses ES6 JavaScript. ([WebPack][1] bundles and [babel][2] transpiles)

Please do not checkin dist bundles. This project is intended to be included into a larger project using a packager like [WebPack][1].


##### Setup:
```bash
$ npm install grunt-cli karma-cli --global
$ npm install
```

##### Testing:
```bash
$ grunt test
```

##### Running the test harness app:
```bash
$ grunt
```


   [1]: //webpack.github.io
   [2]: //babeljs.org
