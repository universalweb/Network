(async () => {
	const state = {
		utility: require('Lucy')
	};
	await require('../utilities/console/')(state);
	await require('../utilities/file/')(state);
	const rollup = require('rollup').rollup;
	const babel = require('rollup-plugin-babel-minify');
	const watch = require('node-watch');
	const build = async () => {
		console.log('Build Start');
		const bundle = await rollup({
			input: './source/index.js',
		});
		await bundle.write({
			file: './build/bundle.js',
			format: 'umd',
			name: '$',
			sourceMap: true
		});
		const production = await rollup({
			input: './source/index.js',
			plugins: [
				babel({
					banner: `/* COMPONENTS by ARITY - ARITY.COMPANY */`,
					comments: false,
				})
			]
		});
		await production.write({
			file: './build/index.js',
			format: 'umd',
			name: '$',
			sourceMap: true
		});
		console.log('Build End');
	};
	await build();
	watch('./source/', {
		recursive: true
	}, async () => {
		await build();
	});
})();
