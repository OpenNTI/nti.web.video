exports = module.exports = Object.assign(require('./webpack.config'), {
	entry: './tests/app/index.js',
	output: {
		path: '/',
		filename: 'index.js',
		publicPath: '/'
	},

	cache: true,
	devtool: 'source-map',

	externals: []
});
