import app from './app.js';
import { workerRequest } from './worker';
const {
	assign,
	querySelector,
	map,
	hasValue,
	isString,
} = app.utility;
const local = localStorage;
export const imported = {};
export const headNode = querySelector('head');
export const styleNode = document.createElement('style');
const loadScript = window.eval;
const iJson = (contents) => {
	if (contents) {
		return loadScript(`(${contents})`);
	}
	return {};
};
const isLibRegex = new RegExp(/^js\/lib\//);
const checksumReturn = (item) => {
	return localStorage[`cs-${item}`];
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
			fileContents = local[filename];
		}
	} else if (fileContents !== false) {
		if (app.debug) {
			console.log('SAVE FILE TO LOCAL', fileContents);
		}
		local[`cs-${filename}`] = cs;
		local[filename] = fileContents;
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
				loadScript(fileContents);
				imported[filename] = true;
			} else {
				if (imported[filename]) {
					config.filesLoaded++;
					return checkIfCompleted(config);
				}
				skipCheck = true;
				const moduleExports = {
					dirname: `${dirname}/`,
					name: filename
				};
				await loadScript(fileContents)(moduleExports);
				config.filesLoaded++;
				imported[filename] = moduleExports;
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
			data: {
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
