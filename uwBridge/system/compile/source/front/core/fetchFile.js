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
const checksumReturn = (item) => {
	return crate.getItem(`cs-${item}`);
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
const saveCompleted = async (json, config) => {
	const {
		file,
		cs,
		key,
		isJs,
		isJson,
		isCss,
		dirname,
	} = json;
	const {
		appendCSS,
		data,
	} = config;
	const filename = data[key];
	let fileContents = file;
	let skipCheck;
	if (fileContents === true) {
		if (!imported[filename]) {
			fileContents = crate.getItem(filename);
		}
	} else if (fileContents !== false) {
		if (app.debug) {
			console.log('SAVE FILE TO LOCAL', fileContents);
		}
		crate.setItem(`cs-${filename}`, cs);
		crate.setItem(filename, fileContents);
	}
	if (!hasValue(imported[filename]) || fileContents !== true) {
		if (!isJs) {
			if (fileContents === false) {
				imported[filename] = {};
			} else {
				imported[filename] = (isJson) ? iJson(fileContents) : fileContents;
			}
		} else if (fileContents) {
			if (isLibRegex.test(filename)) {
				let scriptRaw = new File([fileContents], filename, {
					type: 'text/javascript'
				});
				let fileBlob = URL.createObjectURL(scriptRaw);
				imported[filename] = await import(fileBlob);
				URL.revokeObjectURL(fileBlob);
				fileBlob = null;
				scriptRaw = null;
			} else {
				if (imported[filename]) {
					config.filesLoaded++;
					return checkIfCompleted(config);
				}
				const emulateImport = `Object.assign(import.meta, {path:'${dirname}/',filename:'${filename}'});\n`;
				let scriptRaw = new File([emulateImport, fileContents], filename, {
					type: 'text/javascript'
				});
				let fileBlob = URL.createObjectURL(scriptRaw);
				const moduleExports = assign({}, await import(fileBlob));
				URL.revokeObjectURL(fileBlob);
				config.filesLoaded++;
				imported[filename] = moduleExports;
				fileBlob = null;
				scriptRaw = null;
				return checkIfCompleted(config);
			}
		}
	}
	if (isCss && appendCSS && isString(imported[filename])) {
		constructStyleTagThenAppendToHead(imported[filename], filename);
		imported[filename] = true;
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
		request: 'socket.get',
	});
};
assign(app, {
	fetchFile,
});
