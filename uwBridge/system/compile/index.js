const lucy = require('Lucy');
const {
	each,
	compactMap,
	promise
} = lucy;
const rollup = require('rollup').rollup;
const uglify = require('rollup-plugin-uglify');
const esformatter = require('esformatter');
const fs = require('fs');
const watch = require('node-watch');
const beautify = (filePath) => {
	const code = fs.readFileSync(filePath).toString();
	const formattedCode = esformatter.format(code, {
		indent: {
			value: '  '
		}
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
			entry: `./source/${folderName}/core/index.js`,
			plugins: [uglify()]
		});
		await core.write({
			dest: `./build/${folderName}/coreBundle.js`,
			format: 'iife',
			moduleName: '$',
			sourceMap: true,
		});
	} else {
		console.log(`Development Build Start.`);
		const core = await rollup({
			entry: `./source/${folderName}/core/index.js`,
		});
		await core.write({
			dest: `./build/${folderName}/coreBundle.js`,
			format: 'iife',
			moduleName: '$',
			sourceMap: true,
		});
		beautify(`./build/${folderName}/coreBundle.js`);
		console.log(`Development Build Completed.`);
	}
	console.log(`Bundle Dependencies Start.`);
	const library = await rollup({
		context: 'window',
		entry: `./source/${folderName}/libs/index.js`,
	});
	await library.write({
		dest: `./build/${folderName}/bundle.js`,
		format: 'iife',
		sourceMap: false,
		useStrict: false,
	});
	console.log(`Bundle Dependencies Completed.`);
	console.log(`Bundle Completed.`);
};
const getApps = () => {
	return promise((accept) => {
		fs.readdir('../../../apps/client/', (err, items) => {
			if (err) {
				return console.log(err);
			}
			const apps = compactMap(items, (item) => {
				if (item[0] !== '.') {
					return item;
				}
			});
			accept(apps);
		});
	});
};
const compileApps = async () => {
	const apps = await getApps();
	if (apps) {
		each(apps, (item) => {
			console.log(`Exporting Files to ${item}.`);
			copyFile(`./build/front/bundle.js`, `../../../apps/client/${item}/filesystem/public/Sentivate.js`);
			copyFile(`./build/socket/bundle.js`, `../../../apps/client/${item}/filesystem/asset/Sentivate/index.js`);
			copyFile(`./build/worker/bundle.js`, `../../../apps/client/${item}/filesystem/public/worker.js`);
			console.log(`Exporting Files to ${item} Completed.`);
		});
	}
};
exports.build = async (options) => {
	console.log('-----------Sentivate-----------');
	console.log('Compiling');
	console.log(`-----------Start IMPORT Libs-----------`);
	copyFile(`./node_modules/Acid/index.js`, `./source/front/libs/Acid.js`);
	console.log('Acid Imported');
	copyFile(`./node_modules/Lucy/index.js`, `./source/worker/libs/Lucy.js`);
	console.log('Lucy Imported');
	await bundle('front', options);
	await bundle('socket', options);
	await bundle('worker', options);
	console.log('-----------Export To Apps-----------');
	const apps = await getApps();
	await compileApps();
	console.log('-----------Watching Source subDirectories-----------');
	watch('./source/front', {
		recursive: true
	}, async () => {
		await bundle('front', options);
		each(apps, (item) => {
			console.log(`Exporting Files to ${item}.`);
			copyFile(`./build/front/bundle.js`, `../../../apps/client/${item}/filesystem/public/Sentivate.js`);
			console.log(`Exporting Files to ${item} Completed.`);
		});
	});
	console.log('Watching Front');
	watch('./source/socket', {
		recursive: true
	}, async () => {
		each(apps, (item) => {
			console.log(`Exporting Files to ${item}.`);
			copyFile(`./build/socket/bundle.js`, `../../../apps/client/${item}/filesystem/asset/Sentivate/index.js`);
			console.log(`Exporting Files to ${item} Completed.`);
		});
		await bundle('socket', options);
	});
	console.log('Watching Socket');
	watch('./source/worker', {
		recursive: true
	}, async () => {
		each(apps, (item) => {
			console.log(`Exporting Files to ${item}.`);
			copyFile(`./build/worker/bundle.js`, `../../../apps/client/${item}/filesystem/public/worker.js`);
			console.log(`Exporting Files to ${item} Completed.`);
		});
		await bundle('worker', options);
	});
	console.log('Watching Worker');
	console.log('-----------Sentivate Compiled-----------');
};
