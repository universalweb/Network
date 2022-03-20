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
		mapAsync,
		compact
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
	// console.log(results, demandType, compiledImports, localImport, remoteImport);
	return demandType(compiledImports, arrayToObjectMap);
};
function buildFilePathType(item, type, options) {
	let filePath = item;
	if (filePath[0] !== '/') {
		filePath = `/${filePath}`;
	}
	console.log('BUILD PATH DEMAND', item, type, options);
	if (options) {
		const { path } = options;
		const pathArray = compact(path.split('/'));
		const pathArrayLength = pathArray.length - 1;
		const matches = filePath.match(/\.\.\//g);
		if (matches) {
			filePath = pathArray.slice(0, pathArrayLength - matches.length + 1).join('/') + filePath.replace(/\.\.\//g, '');
		}
		if (filePath.substring(0, 3) === '/./') {
			filePath = path + filePath.substring(3);
		}
	}
	if (!hasDot(filePath)) {
		if (last(filePath) === '/') {
			filePath += `index.${type}`;
		} else {
			filePath += `.${type}`;
		}
	}
	if (options) {
		console.log('BUILT PATH', filePath, options);
	}
	return filePath;
}
async function getCacheFromLocal(filePath, type) {
	if (imported[filePath]) {
		return imported[filePath];
	}
	if (type.match(/css|html/)) {
		const crateCache = imported[filePath];
		if (crateCache) {
			return crateCache;
		} else {
			const cacheTimeElapsed = checksumData(filePath);
			if (cacheTimeElapsed) {
				const timeElapsed = Date.now() - cacheTimeElapsed.time;
				// console.log(timeElapsed, app.cacheExpire);
				if (timeElapsed <= app.cacheExpire) {
					const localstoredCache = crate.getItem(filePath);
					if (localstoredCache) {
						imported[filePath] = localstoredCache;
						return localstoredCache;
					}
				}
			}
		}
	} else {
		const localstoredCache = crate.getItem(filePath);
		// console.log(filePath, localstoredCache);
		if (localstoredCache && isString(localstoredCache)) {
			const cacheTimeElapsed = checksumData(filePath);
			if (cacheTimeElapsed) {
				const timeElapsed = Date.now() - cacheTimeElapsed.time;
				if (timeElapsed <= app.cacheExpire) {
					try {
						const hotModule = await hotloadJS(localstoredCache, filePath);
						if (hotModule) {
							return hotModule;
						}
					} catch (err) {
						crate.removeItem(filePath);
					}
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
			files = buildFilePathType(files, type, options);
			const localstoredCache = await getCacheFromLocal(files, type);
			if (localstoredCache) {
				return localstoredCache;
			}
		} else {
			files = await mapAsync(files, async (item) => {
				if (imported[item]) {
					return imported[item];
				}
				const compiledFileName = buildFilePathType(item, type, options);
				const localstoredCache = await getCacheFromLocal(compiledFileName, type);
				if (localstoredCache) {
					return localstoredCache;
				}
				app.log('Demand Type', type, compiledFileName, options);
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
