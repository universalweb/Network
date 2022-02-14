import app from './app';
import { post } from './post';
const {
	config,
	utility: {
		assign,
		uid,
		isFileJS,
		isFileJSON,
		isFileCSS,
		initial,
		map,
	},
} = app;
let socket;
let alreadySetup;
const routerData = self.location;
const shouldNotUpgrade = /(^js\/lib\/)|(\.min\.js)/;
const importRegexGlobal = /\b\w*import\b([^:;=]*?){([^;]*?)}(\s\bfrom\b).*(('|"|`).*('|"|`));$/gm;
const importSingleRegexGlobal = /\b\w*import\b([^:;={}]*?)([^;{}]*?)(s\s\bfrom\b).*(('|"|`).*('|"|`));$/gm;
const importEntire = /\b\w*import\b\s(('|"|`).*('|"|`));$/gm;
const importDynamic = /{([^;]*?)}\s\=\simport\((('|"|`).*('|"|`))\);$/gm;
const exportRegexGlobal = /\b\w*export\b([^:;=]*?)[^$]{([^;]*?)}/gm;
const exportSingleRegexGlobal = /\b\w*export\b\s\bconst\b\s/gm;
const slashString = '/';
const update = function(json) {
	post('_', json);
};
const callbacks = {
	update,
};
const apiClient = function(data) {
	if (!data.id) {
		return update(data);
	}
	const callback = callbacks[data.id];
	if (callback) {
		return callback(data);
	}
};
const mainCallback = function(data, uniq, callable, options) {
	const callbackData = {};
	let cleanup = true;
	callbackData.data = data.data;
	const returned = callable(callbackData);
	if (options.async) {
		if (returned === true) {
			cleanup = false;
		}
	}
	if (cleanup) {
		callbacks[uniq] = null;
		uid.free(uniq);
	}
};
// emit function with synthetic callback system
const request = (configObj, workerData) => {
	const data = configObj.data;
	const callback = (json) => {
		let result;
		const workerCallback = configObj.callback;
		if (workerCallback) {
			result = workerCallback(json.data);
		} else if (workerData) {
			result = post(workerData.id, json.data);
		}
		return result;
	};
	const options = {
		async: configObj.async,
	};
	if (data.id) {
		data.id = null;
	} else {
		const uniq = uid()
			.toString();
		data.id = uniq;
		callbacks[uniq] = function(callbackData) {
			mainCallback(callbackData, uniq, callback, options);
		};
	}
	socket.emit('api', data);
};
const socketIsReady = (data) => {
	console.log('Socket Is Ready');
	if (alreadySetup) {
		if (app.creditSave) {
			console.log('Re-authenticating');
			request({
				callback() {
					console.log('Re-authenticated');
					postMessage({
						data: {
							type: 'reconnected',
						},
						id: '_',
					});
				},
				data: {
					data: {
						credit: $.assign({}, app.creditSave)
					},
					request: 'open.loginCredit',
				},
			});
		}
	} else {
		post('setupCompleted', {
			language: data.language,
		});
		alreadySetup = 1;
		console.log('connected');
	}
};
const replaceImports = function(file) {
	let compiled = file.replace(importRegexGlobal, 'const {$2} = await app.demandJs($4);');
	compiled = compiled.replace(importSingleRegexGlobal, 'const {$2} = await app.demandJs($4);');
	compiled = compiled.replace(importEntire, 'await app.demandJs($1);');
	compiled = compiled.replace(exportRegexGlobal, 'app.assign(exports, {$2};);');
	compiled = compiled.replace(importDynamic, '{$1} = await app.demandJs($2);');
	compiled = compiled.replace(exportSingleRegexGlobal, 'exports.');
	console.log(compiled);
	if (file !== compiled) {
		app.log(compiled);
	}
	return compiled;
};
const getCallback = function(jsonData, configObj, workerInfo) {
	const item = jsonData.file;
	const checksum = jsonData.cs;
	const cacheCheck = jsonData.cache;
	const key = jsonData.key;
	const fileList = configObj.fileList;
	const filename = fileList.files[key];
	const completedFiles = configObj.completedFiles;
	const checksums = configObj.checksum;
	const isLib = shouldNotUpgrade.test(filename);
	const isJs = isFileJS(filename);
	const isJson = isFileJSON(filename);
	const isCss = isFileCSS(filename);
	const dirname = initial(filename.split(slashString))
		.join(slashString);
	let sendNow;
	let requestStatus = true;
	/*
    During an active stream data is compiled.
    Based on Key coming in.
    */
	if (item) {
		completedFiles[key] += item;
	} else if (item === false) {
		checksums[key] = false;
		completedFiles[key] = false;
		configObj.filesLoaded += 1;
		sendNow = true;
	} else if (cacheCheck) {
		completedFiles[key] = true;
		configObj.filesLoaded += 1;
		sendNow = true;
	} else {
		configObj.filesLoaded += 1;
		checksums[key] = checksum;
		sendNow = true;
	}
	if (sendNow) {
		let completedFile = completedFiles[key];
		if (completedFile !== true && isJs && !isLib && completedFile !== false) {
			completedFile = `((exports) => {return ${replaceImports(completedFile)}});`;
		}
		post(workerInfo.id, {
			cs: checksums[key],
			dirname,
			file: completedFile,
			isCss,
			isJs,
			isJson,
			isLib,
			key,
		}, {
			keep: true,
		});
	}
	if (configObj.filesLoaded === configObj.fileListLength) {
		const returned = {};
		if (configObj.callback) {
			configObj.callback(returned);
		} else {
			post(workerInfo.id, returned);
		}
		requestStatus = false;
	}
	return requestStatus;
};
/*
This async streams required filesLoadedfrom socket
or from cache.
*/
assign(app.events.socket, {
	get(options, workerInfo) {
		/*
    Config for stream callback function
    */
		const dataProp = options.data;
		const fileList = dataProp.files;
		const configObj = {
			callback: options.callback,
			checksum: [],
			completedFiles: map(fileList, () => {
				return '';
			}),
			fileList: dataProp,
			fileListLength: fileList.length,
			filesLoaded: 0,
			progress: options.progress,
		};
		const body = {
			async: true,
			callback(json) {
				return getCallback(json, configObj, workerInfo);
			},
			data: {
				request: 'file.get',
			},
		};
		body.data.data = dataProp;
		request(body);
	},
	request,
});
const socketInitialize = () => {
	console.log('Worker Socket Module', 'notify');
	const serverLocation = `${routerData.protocol}//${(app.config.socketHostname || routerData.hostname)}:${app.config.port}`;
	socket = self.io.connect(serverLocation, {
		transports: ['websocket'],
	});
	// this listens for client API calls
	socket.on('api', apiClient);
	socket.on('ready', socketIsReady);
	socket.on('connect', () => {
		socket.emit('configure', app.config);
	});
	socket.on('disconnect', (reason) => {
		console.log('disconnected');
		if (reason === 'io server disconnect') {
			// the disconnection was initiated by the server, you need to reconnect manually
			socket.connect();
		}
		postMessage({
			data: {
				type: 'disconnected',
			},
			id: '_',
		});
	});
};
app.events.configure = (data) => {
	assign(config, data);
	console.log('STARTING');
	socketInitialize();
};
