const path = require('path');

const autoprefixer = require('autoprefixer');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const pkg = require('./package.json');

const root = path.resolve(__dirname, 'src');
const testRoot = path.resolve(__dirname, 'test');
const isRoot = (e) => e.startsWith(root) || e.startsWith(testRoot);

exports = module.exports = {
	entry: {
		index: path.join(__dirname, 'src/index.js')
	},
	output: {
		path: path.join(__dirname, 'lib/'),
		filename: 'index.js',
		library: pkg.name,
		libraryTarget: 'commonjs-module'
	},

	devtool: 'cheap-module-source-map',

	node: {
		global: false
	},

	target: 'web',

	resolve: {
		extensions: ['.jsx', '.js']
	},


	externals: [
		// Every non-relative module is external
		// abc -> require("abc")
		(context, request, callback) => {
			if (/^[a-z\-0-9]+/i.test(request)) {
				return callback(null, 'commonjs ' + request);
			}
			callback();
		}
	],


	module: {
		rules: [
			{
				test: /src.+jsx?$/,
				enforce: 'pre',
				loader: 'baggage-loader',
				include: isRoot,
				options: {
					'[file].scss':{}
				}
			},

			{
				test: /\.js(x?)$/,
				include: isRoot,
				loader: 'babel-loader',
				options: {
					sourceMaps: true
				}
			},

			{
				test: /\.(ico|gif|png|jpg|svg)$/,
				loader: 'url-loader',
				options: {
					limit: 500,
					name: 'assets/[name]-[hash].[ext]',
					mimeType: 'image/[ext]'
				}
			},

			{
				test: /\.(s?)css$/,
				use: ExtractTextPlugin.extract({
					fallback: 'style-loader',
					use: [
						{
							loader: 'css-loader',
							options: {
								sourceMap: true
							}
						},
						{
							loader: 'postcss-loader',
							options: {
								sourceMap: true,
								plugins: () => [
									autoprefixer({ browsers: ['> 1% in US', 'last 2 versions', 'iOS > 8'] })
								]
							}
						},
						{
							loader: 'resolve-url-loader'
						},
						{
							loader: 'sass-loader',
							options: {
								sourceMap: true
							}
						}
					]
				})
			}
		]
	},

	plugins: [
		new ExtractTextPlugin({
			filename: 'index.css',
			allChunks: true,
			disable: false
		}),
	].filter(x => x)
};
