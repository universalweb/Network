import app from './app.js';
import { fetchFile } from './fetchFile.js';
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
		isArray,
		isNumber,
		mapAsync
	},
	imported,
	crate,
	checksumData,
	hotloadJS
} = app;
const buildFilePath = (itemArg) => {
	let item = itemArg;
	if (item[0] !== '/') {
		item = `/${item}`;
	}
	if (!hasDot(item)) {
		if (last(item) === '/') {
			item += 'index.js';
		}
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
function buildFilePathType(item, type) {
	let filePath = item;
	if (filePath[0] !== '/') {
		filePath = `/${filePath}`;
	}
	if (!hasDot(filePath)) {
		if (last(filePath) === '/') {
			filePath += `index.${type}`;
		} else {
			filePath += `.${type}`;
		}
	}
	return filePath;
}
async function getCacheFromLocal(filePath, type) {
	const crateCache = crate.storage.items[filePath];
	if (type.match(/css|html/)) {
		if (crateCache) {
			return crateCache;
		} else {
			const cacheTimeElapsed = checksumData(filePath);
			if (cacheTimeElapsed) {
				const timeElapsed = Date.now() - cacheTimeElapsed.time;
				if (timeElapsed >= app.cacheExpire) {
					const localstoredCache = crate.getItem(filePath);
					return localstoredCache;
				}
			}
		}
	} else {
		const localstoredCache = crate.getItem(filePath);
		console.log(filePath, localstoredCache);
		if (localstoredCache && isString(localstoredCache)) {
			const cacheTimeElapsed = checksumData(filePath);
			if (cacheTimeElapsed) {
				const hotModule = await hotloadJS(localstoredCache, filePath);
				if (hotModule) {
					return hotModule;
				}
			}
		}
	}
}
function demandTypeMethod(type, optionsFunction) {
	return async function(filesArg, options) {
		let files = filesArg;
		if (optionsFunction) {
			optionsFunction(options);
		}
		if (isString(files)) {
			if (imported[files]) {
				return imported[files];
			}
			files = buildFilePathType(files, type);
			if (imported[files]) {
				return imported[files];
			} else {
				const localstoredCache = await getCacheFromLocal(files, type);
				if (localstoredCache) {
					return localstoredCache;
				}
			}
		} else {
			files = await mapAsync(files, async (item) => {
				if (imported[item]) {
					return imported[item];
				}
				const compiledFileName = buildFilePathType(item, type);
				if (imported[compiledFileName]) {
					return imported[compiledFileName];
				} else {
					const localstoredCache = await getCacheFromLocal(compiledFileName, type);
					if (localstoredCache) {
						return localstoredCache;
					}
				}
				app.log('Demand Type', type, compiledFileName);
				return compiledFileName;
			});
		}
		return demand(files, options);
	};
}
export const demandCss = demandTypeMethod('css', (appendCSS) => {
	return {
		appendCSS
	};
});
const demandJs = demandTypeMethod('js');
const demandHtml = demandTypeMethod('html');
assign(app.events, {
	async ready(data) {
		cnsl('Worker is Ready', 'notify');
		app.systemLanguage = data.language;
		try {
			await demandJs('/app/index.js');
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
});
