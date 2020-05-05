(async () => {
	const state = require('../../state/')('Universal Web App Environment Compiler');
	const rollup = require('rollup').rollup;
	const {
		terser: minify
	} = require('rollup-plugin-terser');
	const watch = require('node-watch');
	const path = require('path');
	const {
		file: {
			copy
		},
		success
	} = state;
	const dirRootModules = `${__dirname}/../../node_modules/`;
	const resources = `${path.resolve(`${__dirname}/../../browser/resources/`)}/`;
	const build = async () => {
		success('Build Start');
		const bundle = await rollup({
			input: `${__dirname}/source/index.js`,
		});
		await bundle.write({
			file: `${__dirname}/build/bundle.js`,
			format: 'umd',
			name: '$',
			sourceMap: true
		});
		const production = await rollup({
			input: `${__dirname}/source/index.js`,
			plugins: [
				minify()
			]
		});
		await production.write({
			file: `${__dirname}/build/index.js`,
			format: 'umd',
			sourceMap: true
		});
		// Disable ESLint to avoid false positives on compiled JS
		const copyFileConfig = {
			prepend: '/* eslint-disable */'
		};
		success('Begin copy of all modules required in the browser from the node_modules folder');
		await copy(`${__dirname}/build/bundle.js`, `${resources}js/components.js`, copyFileConfig);
		await copy(`${dirRootModules}Lucy/index.js`, `${resources}js/utility.js`, copyFileConfig);
		await copy(`${dirRootModules}ractive/ractive.min.js`, `${resources}js/ractive.js`, copyFileConfig);
		await copy(`${dirRootModules}uikit/dist/js/uikit.min.js`, `${resources}js/uikit.js`, copyFileConfig);
		await copy(`${dirRootModules}uikit/dist/js/uikit-icons.min.js`, `${resources}js/uikitIcons.js`, copyFileConfig);
		await copy(`${dirRootModules}uikit/dist/css/uikit.min.css`, `${resources}css/uikit.css`);
		await copy(`${dirRootModules}uikit/dist/css/uikit-rtl.min.css`, `${resources}css/uikit-rtl.css`);
		success('Build End');
	};
	await build();
	watch(`${__dirname}/source/`, {
		recursive: true
	}, async () => {
		await build();
	});
})();
