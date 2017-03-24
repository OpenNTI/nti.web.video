exports = module.exports = Object.assign(require('./webpack.config'), {
	entry: './test/app/index.js',
	externals: [],
	output: {
		path: '/',
		filename: 'index.js'
		// publicPath: '/'
	}
});

delete exports.node;

exports.module.rules.push({
	test: /\.(eot|ttf|woff)$/,
	loader: 'file-loader',
	query: {
		name: 'assets/fonts/[name]-[hash].[ext]'
	}
});
