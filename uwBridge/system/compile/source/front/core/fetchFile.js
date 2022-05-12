import app from './app.js';
import { workerRequest } from './worker';
const {
	imported,
	crate,
	utility: {
		assign,
		querySelector,
		map,
		hasValue,
		isString,
		jsonParse,
		isFileJS,
		isFileJSON,
		isFileCSS,
		isPlainObject
	}
} = app;
export const headNode = querySelector('head');
export const styleNode = document.createElement('style');
const iJson = (contents) => {
	if (contents) {
		return jsonParse(contents);
	}
	return {};
};
const isLibRegex = /(^js\/lib\/)|(\.min\.js)/;
const checksumData = (item) => {
	const checksumString = crate.getItem(`cs-${item}`);
	if (checksumString) {
		if (isPlainObject(checksumString)) {
			return checksumString;
		}
		const checksum = jsonParse(checksumString);
		if (checksum) {
			return checksum;
		}
	}
};
app.checksumData = checksumData;
const checksumReturn = (item) => {
	const checksum = checksumData(item);
	if (checksum) {
		if (checksum?.cs) {
			return checksum.cs;
		}
	}
};
const constructStyleTagThenAppendToHead = (text, filePath) => {
	const node = styleNode.cloneNode(false);
	node.textContent = text;
	node.setAttribute('data-src', filePath);
	headNode.appendChild(node);
	return node;
};
/*
When all the required items have been downloaded
*/
const getLoadedAssets = (item) => {
	return imported[item];
};
const getCompleted = async (config) => {
	const {
		callback,
		data,
	} = config;
	const assetCollection = map(data, getLoadedAssets);
	callback(...assetCollection);
};
const checkIfCompleted = (config) => {
	if (!config.done && config.filesLoaded === config.fileCount) {
		config.done = true;
		getCompleted(config);
	}
};
async function hotloadJS(fileContents, filePath) {
	const lastSlash = filePath.lastIndexOf('/') + 1;
	const filename = filePath.substring(lastSlash, filePath.length);
	const dirname = filePath.substring(0, lastSlash);
	const emulateImport = `Object.assign(import.meta, {path:'${dirname}',filePath:'${filePath}', filename:'${filename}'});\n`;
	let scriptRaw = new File([emulateImport, fileContents], filePath, {
		type: 'text/javascript'
	});
	let fileBlob = URL.createObjectURL(scriptRaw);
	const moduleExports = assign({}, await import(fileBlob));
	URL.revokeObjectURL(fileBlob);
	imported[filePath] = moduleExports;
	fileBlob = null;
	scriptRaw = null;
	return moduleExports;
}
app.hotloadJS = hotloadJS;
async function hotloadLocalJS(dirname) {
	const fileContents = crate.getItem(dirname);
	if (fileContents) {
		return hotloadJS(fileContents, dirname);
	}
}
app.hotloadLocalJS = hotloadLocalJS;
const saveCompleted = async (json, config) => {
	const {
		file,
		cs,
		key,
	} = json;
	const {
		appendCSS,
		data,
	} = config;
	const filePath = data[key];
	const isJs = isFileJS(filePath);
	const isCss = isFileCSS(filePath);
	const isJson = isFileJSON(filePath);
	let fileContents = file;
	let skipCheck;
	if (fileContents === true) {
		if (!imported[filePath]) {
			fileContents = crate.getItem(filePath);
			if (fileContents) {
				console.log(filePath);
				const checksumUpdate = checksumData(filePath);
				if (checksumUpdate) {
					checksumUpdate.time = Date.now();
					crate.setItem(`cs-${filePath}`, checksumUpdate);
				}
			}
		}
	} else if (fileContents !== false) {
		if (app.debug) {
			console.log('SAVE FILE TO LOCAL', filePath);
		}
		crate.setItem(`cs-${filePath}`, {
			cs,
			time: Date.now()
		});
		crate.setItem(filePath, fileContents);
	}
	if (!hasValue(imported[filePath]) || fileContents !== true) {
		if (!isJs) {
			if (fileContents === false) {
				imported[filePath] = {};
			} else {
				imported[filePath] = (isJson) ? iJson(fileContents) : fileContents;
			}
		} else if (fileContents) {
			if (isLibRegex.test(filePath)) {
				let scriptRaw = new File([fileContents], filePath, {
					type: 'text/javascript'
				});
				let fileBlob = URL.createObjectURL(scriptRaw);
				imported[filePath] = await import(fileBlob);
				URL.revokeObjectURL(fileBlob);
				fileBlob = null;
				scriptRaw = null;
			} else {
				if (imported[filePath]) {
					config.filesLoaded++;
					return checkIfCompleted(config);
				}
				const lastSlash = filePath.lastIndexOf('/') + 1;
				const filename = filePath.substring(lastSlash, filePath.length);
				const dirname = filePath.substring(0, lastSlash);
				const emulateImport = `Object.assign(import.meta, {path:'${dirname}',filePath:'${filePath}',filename:'${filename}'});\n`;
				let scriptRaw = new File([emulateImport, fileContents], filePath, {
					type: 'text/javascript'
				});
				let fileBlob = URL.createObjectURL(scriptRaw);
				const moduleExports = assign({}, await import(fileBlob));
				URL.revokeObjectURL(fileBlob);
				config.filesLoaded++;
				imported[filePath] = moduleExports;
				fileBlob = null;
				scriptRaw = null;
				return checkIfCompleted(config);
			}
		}
	}
	if (isCss && appendCSS && isString(imported[filePath])) {
		constructStyleTagThenAppendToHead(imported[filePath], filePath);
		imported[filePath] = true;
	}
	if (!skipCheck) {
		config.filesLoaded++;
		return checkIfCompleted(config);
	}
};
export const fetchFile = async (config) => {
	const configData = config.data;
	config.filesLoaded = 0;
	config.fileCount = config.data.length;
	await workerRequest({
		async callback(json) {
			if (hasValue(json.file)) {
				await saveCompleted(json, config);
			} else {
				return checkIfCompleted(config);
			}
		},
		data: {
			body: {
				cs: map(configData, checksumReturn),
				files: configData,
			},
		},
		task: 'socket.get',
	});
};
assign(app, {
	fetchFile,
});
