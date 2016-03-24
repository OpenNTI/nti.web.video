const baseConfig = require('nti-unittesting-clientside');

module.exports = function (config) {
	baseConfig.webpack.resolve.root = void 0;

	config.set(Object.assign(baseConfig, {
		files: [
			'test/helpers/**/*.js',
			'test/*.js'
		],

		preprocessors: {
			'test/**/*.js': ['webpack', 'sourcemap']
		}
	}));
};
