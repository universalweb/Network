import app from './app.js';
import { fetchFile } from './fetchFile.js';
import languagePath from './language.js';
import { watch, Watcher } from './watchers.js';
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
		getFileExtension,
		isArray,
		isNumber
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
		// app.log(item);
	}
	if (getFileExtension(item) === 'js') {
		// app.log(item, watch);
		if (!Watcher.containerPrimary[item]) {
			watch(item, (thing) => {
				if (app.debug) {
					console.log('Live Reload', thing);
				}
				crate.removeItem(thing.name);
				crate.removeItem(`cs-${thing.name}`);
			});
		}
	}
	if (item[0] !== '/') {
		item = `/${item}`;
	}
	return item;
};
const singleDemand = (items) => {
	return items[0];
};
const objectDemand = (items, arrayToObjectMap) => {
	return map(arrayToObjectMap, (item) => {
		if (isPlainObject(item)) {
			return item;
		}
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
export const demand = async (files, options) => {
	const remoteImport = [];
	const localImport = [];
	const compiledImports = [];
	let results;
	let demandType;
	let arrayToObjectMap;
	if (isPlainObject(files)) {
		demandType = objectDemand;
		arrayToObjectMap = {};
		each(files, (item, key) => {
			if (isPlainObject(item)) {
				arrayToObjectMap[key] = item;
			} else {
				arrayToObjectMap[key] = remoteImport.push(buildFilePath(item)) - 1;
			}
		});
	} else if (isString(files)) {
		demandType = singleDemand;
		if (isPlainObject(files)) {
			localImport.push(files);
		} else {
			localImport.push(remoteImport.push(buildFilePath(files)) - 1);
		}
	} else if (isArray(files)) {
		demandType = multiDemand;
		each(files, (item) => {
			if (isPlainObject(item)) {
				localImport.push(item);
			} else {
				localImport.push(remoteImport.push(buildFilePath(item)) - 1);
			}
		});
	}
	if (remoteImport.length) {
		results = await streamAssets(remoteImport, options);
	}
	cnsl('importing', 'notify');
	if (!arrayToObjectMap) {
		each(localImport, (item, index) => {
			if (isNumber(item)) {
				compiledImports[index] = results[item];
			} else {
				compiledImports[index] = item;
			}
		});
	}
	console.log(results, demandType, compiledImports, localImport, remoteImport);
	return demandType(compiledImports, arrayToObjectMap);
};
const demandTypeMethod = (type, optionsFunction) => {
	return function(filesArg, options) {
		let files = filesArg;
		if (optionsFunction) {
			optionsFunction(options);
		}
		if (isString(files)) {
			if (imported[files]) {
				return imported[files];
			}
			files = (hasDot(files)) ? files : `${files}${last(files) === '/' && 'index' || ''}.${type}`;
			if (imported[files]) {
				return imported[files];
			}
		} else {
			files = map(files, (item) => {
				if (imported[item]) {
					return imported[item];
				}
				const itemHasExt = hasDot(item);
				const compiledFileName = (itemHasExt) ? item : `${item}${last(item) === '/' && 'index' || ''}.${type}`;
				if (imported[compiledFileName]) {
					return imported[compiledFileName];
				}
				app.log('Demand Type', type, compiledFileName);
				return compiledFileName;
			});
		}
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
	async ready(data) {
		cnsl('Worker is Ready', 'notify');
		app.systemLanguage = data.language;
		try {
			await demand('app/index.js');
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
