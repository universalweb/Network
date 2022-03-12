const utility = require('Acid');
const {
	each,
	compactMap,
	promise
} = utility;
const rollup = require('rollup').rollup;
const { terser: minify } = require('rollup-plugin-terser');
const format = require('prettier-eslint');
const fs = require('fs');
const watch = require('node-watch');
const beautify = (filePath) => {
	console.log('Beautify');
	const text = fs.readFileSync(filePath).toString();
	const eslintConfig = JSON.parse(fs.readFileSync('./.eslintrc').toString());
	const formattedCode = format({
		eslintConfig,
		text,
		prettierOptions: {
			parser: 'babel',
		},
	});
	fs.writeFileSync(filePath, formattedCode, 'utf8');
};
const copyFile = (start, end) => {
	fs.writeFileSync(end, fs.readFileSync(start).toString(), 'utf8');
};
const bundle = async (folderName, { environment }) => {
	console.log(`-----------${folderName}-----------`);
	console.log(`Bundle Start.`);
	if (environment === 'production') {
		const core = await rollup({
			input: `./source/${folderName}/core/index.js`,
			plugins: [minify()]
		});
		console.log(`production ROLLED`);
		await core.write({
			file: `./build/${folderName}/coreBundle.js`,
			format: 'iife',
			name: '$',
			sourcemap: false,
		});
	} else {
		console.log(`Development Build Start.`);
		const core = await rollup({
			input: `./source/${folderName}/core/index.js`,
		});
		console.log(`Development ROLLED`);
		await core.write({
			file: `./build/${folderName}/coreBundle.js`,
			format: 'iife',
			name: '$',
			sourcemap: false,
			strict: false,
		});
		beautify(`./build/${folderName}/coreBundle.js`);
		console.log(`Development Build Completed.`);
	}
	console.log(`Bundle Dependencies Start.`);
	const library = await rollup({
		context: 'window',
		input: `./source/${folderName}/libs/index.js`,
	});
	console.log(`Bundle Dependencies ROLLED`);
	await library.write({
		file: `./build/${folderName}/bundle.js`,
		format: 'iife',
		sourcemap: false,
		strict: false,
	});
	console.log(`Bundle Dependencies Completed.`);
	console.log(`Bundle Completed.`);
};
const getApps = () => {
	return promise((accept) => {
		fs.readdir('./../../apps/', (err, items) => {
			if (err) {
				return console.log(err);
			}
			const apps = compactMap(items, (item) => {
				if (item[0] !== '.') {
					return item;
				}
			});
			console.log(apps);
			accept(apps);
		});
	});
};
const compileApps = async () => {
	const apps = await getApps();
	if (apps) {
		each(apps, (item) => {
			console.log(`Exporting Files to ${item}.`);
			copyFile(`./build/front/bundle.js`, `./../../apps/${item}/filesystem/public/assets/main.js`);
			copyFile(`./build/worker/bundle.js`, `./../../apps/${item}/filesystem/public/assets/worker.js`);
			console.log(`Exporting Files to ${item} Completed.`);
		});
	}
};
exports.build = async (options) => {
	console.log('----------- uwbridge -----------');
	console.log('Compiling');
	console.log(`-----------Start IMPORT Libs-----------`);
	copyFile(`./../../../node_modules/Acid/browser.js`, `./source/front/libs/Acid.js`);
	console.log('Acid Browser Imported');
	copyFile(`./../../../node_modules/Acid/index.js`, `./source/worker/libs/Acid.js`);
	console.log('Acid Primary Imported');
	copyFile(`./../../../node_modules/ractive/ractive.min.js`, `./source/front/libs/ractive.js`);
	console.log('ractive Imported');
	await bundle('front', options);
	await bundle('worker', options);
	console.log('-----------Export To Apps-----------');
	const apps = await getApps();
	await compileApps();
	console.log('-----------Watching Source subDirectories-----------');
	watch('./source/front', {
		recursive: true
	}, async () => {
		await bundle('front', options);
		console.log('LIVE CHANGE DETECTED COMPILE FRONT');
		each(apps, (item) => {
			console.log(`Exporting Files to ${item}.`);
			copyFile(`./build/front/bundle.js`, `./../../apps/${item}/filesystem/public/assets/main.js`);
			console.log(`Exporting Files to ${item} Completed.`);
		});
	});
	console.log('Watching Front');
	watch('./source/worker', {
		recursive: true
	}, async () => {
		console.log('LIVE CHANGE DETECTED COMPILE worker');
		each(apps, (item) => {
			console.log(`Exporting Files to ${item}.`);
			copyFile(`./build/worker/bundle.js`, `./../../apps/${item}/filesystem/public/assets/worker.js`);
			console.log(`Exporting Files to ${item} Completed.`);
		});
		await bundle('worker', options);
	});
	console.log('Watching Worker');
	console.log('-----------uwbridge Compiled-----------');
};
