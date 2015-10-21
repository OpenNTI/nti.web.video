/*eslint no-var: 0*/
var path = require('path');
var webpack = require('webpack');
exports = module.exports = {
	entry: '<%= pkg.main %>',
	output: {
		path: '<%= pkg.dist %>',
		filename: 'nti.react-video.js',
		library: 'NTIVideo',
		libraryTarget: 'this'
	},

	cache: true,
	debug: true,
	devtool: 'source-map',

	target: 'web',
	stats: {
		colors: true,
		reasons: true
	},

	resolve: {
		root: path.resolve(__dirname, 'src'),
		extensions: ['', '.jsx', '.js']
	},

	externals: [
		{
			'react' : 'React',
			'react-dom': 'ReactDOM'
		}
	],

	plugins: [
		new webpack.optimize.OccurenceOrderPlugin(),
		new webpack.optimize.DedupePlugin(),
		new webpack.optimize.UglifyJsPlugin({ test: /\.js(x?)($|\?)/i })
	],

	module: {
		loaders: [
			{ test: /\.js(x?)$/, exclude: /node_modules/, loader: 'babel?optional[]=runtime' },
			{ test: /\.json$/, loader: 'json' }
		]
	}
};
