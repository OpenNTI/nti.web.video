exports = module.exports = Object.assign(require('./webpack.config'), {
	entry: './test/app/index.js',
	output: {
		path: '/',
		filename: 'index.js',
		publicPath: '/'
	},

	devtool: 'source-map',

	externals: []
});

delete exports.node;
