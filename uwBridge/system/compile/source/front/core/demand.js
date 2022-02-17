import app from './app.js';
import { fetchFile } from './fetchFile.js';
import languagePath from './language.js';
import { watch, watchers } from './watchers.js';
const {
	utility: {
		assign,
		hasDot,
		promise,
		last,
		map,
		isString,
		isPlainObject,
		each,
		cnsl,
		initialString,
		restString,
		getFileExtension
	},
	imported,
	crate
} = app;
const commaString = ',';
const buildFilePath = (itemArg) => {
	let item = itemArg;
	if (!hasDot(item)) {
		if (initialString(item, -9) === 'language/') {
			item = languagePath(item);
		} else if (last(item) === '/') {
			item += 'index.js';
		} else if (initialString(item, -3) === 'js/') {
			item += '.js';
		} else if (initialString(item, -4) === 'css/') {
			item += '.css';
		}
		app.log(item);
	}
	if (restString(item, -3) === '.js') {
		app.log(item, watch);
		if (!watchers[item]) {
			watch(item, (thing) => {
				if (app.debug) {
					console.log('Live Reload', thing);
				}
				crate.removeItem(thing.name);
				crate.removeItem(`cs-${thing.name}`);
			});
		}
	}
	return item;
};
const singleDemand = (items) => {
	return items[0];
};
const objectDemand = (items, arrayToObjectMap) => {
	return map(arrayToObjectMap, (item) => {
		return items[item];
	});
};
const multiDemand = (items) => {
	return items;
};
const streamAssets = (data, options) => {
	return promise((accept) => {
		fetchFile(assign({
			callback(...args) {
				accept(args);
			},
			data
		}, options));
	});
};
export const demand = async (filesArg, options) => {
	const assets = [];
	let demandType;
	let arrayToObjectMap;
	let files = filesArg;
	if (isPlainObject(files)) {
		demandType = objectDemand;
		arrayToObjectMap = {};
		let index = 0;
		each(files, (item, key) => {
			arrayToObjectMap[key] = index;
			index++;
			assets.push(buildFilePath(item));
		});
	} else {
		files = (isString(files)) ? files.split(commaString) : files;
		demandType = (files.length < 2) ? singleDemand : multiDemand;
		each(files, (item) => {
			assets.push(buildFilePath(item));
		});
	}
	const results = await streamAssets(assets, options);
	app.log(results);
	return demandType(results, arrayToObjectMap);
};
const demandTypeMethod = (type, optionsFunction) => {
	return function(filesArg, options) {
		let files = filesArg;
		if (isString(files)) {
			files = files.split(commaString);
		}
		if (optionsFunction) {
			optionsFunction(options);
		}
		files = map(files, (item) => {
			if (imported[item]) {
				return item;
			}
			const itemExt = getFileExtension(item);
			const compiledFileName = (itemExt) ? item : `${item}${last(item) === '/' && 'index' || ''}.${type}`;
			app.log('Demand Type', type, compiledFileName);
			return compiledFileName;
		});
		return demand(files, options);
	};
};
export const demandCss = demandTypeMethod('css', (appendCSS) => {
	return {
		appendCSS
	};
});
const demandJs = demandTypeMethod('js');
const demandHtml = demandTypeMethod('html');
const demandLang = (fileList) => {
	const files = (isString(fileList)) ? fileList.split(commaString) : fileList;
	return demand(map(files, languagePath));
};
assign(app.events, {
	async setupCompleted(data) {
		cnsl('Worker is Ready', 'notify');
		app.systemLanguage = data.language;
		try {
			await demand('app/');
		} catch (error) {
			console.log(error);
			crate.clear();
			window.location.reload();
		}
	},
});
assign(app, {
	demand,
	demandCss,
	demandHtml,
	demandJs,
	demandLang,
});
