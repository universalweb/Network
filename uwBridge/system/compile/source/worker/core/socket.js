import app from './app';
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
		promise,
		construct,
		isPlainObject,
		isString,
		stringify,
		jsonParse
	},
	events: { post }
} = app;
const shouldNotUpgrade = /(^js\/lib\/)|(\.min\.js)/;
const importRegexGlobal = /\bimport\b([^:;=]*?){([^;]*?)}(\s\bfrom\b).*(('|"|`).*('|"|`));$/gm;
const importSingleRegexGlobal = /\bimport\b([^:;={}]*?)([^;{}]*?)(\s\bfrom\b).*(('|"|`).*('|"|`));$/gm;
const importEntire = /\bimport\b\s(('|"|`).*('|"|`));$/gm;
const importDynamic = /{([^;]*?)}\s=\simport\((('|"|`).*('|"|`))\);$/gm;
const slashString = '/';
const replaceImports = function(file) {
	let compiled = file;
	compiled = compiled.replace(importRegexGlobal, 'const {$2} = await appGlobal.demandJs($4);');
	compiled = compiled.replace(importSingleRegexGlobal, 'const $2 = await appGlobal.demandJs($4);');
	compiled = compiled.replace(importEntire, 'await appGlobal.demandJs($1);');
	compiled = compiled.replace(importDynamic, '{$1} = await appGlobal.demandJs($2);');
	return compiled;
};
const getCallback = async function(response, configObj, workerInfo) {
	const { body } = response;
	const item = body.file;
	const checksum = body.cs;
	const cacheCheck = body.cache;
	const key = body.key;
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
			completedFile = replaceImports(completedFile);
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
		const returned = {
			loaded: configObj.filesLoaded
		};
		return returned;
	}
	return false;
};
class client {
	update(json) {
		post('_', json);
	}
	callbacks = {
		update(json) {
			return this.update(json);
		},
	};
	status = 0;
	ready() {
		console.log('Socket Is Ready');
		if (this.status) {
			this.update({
				data: {
					type: 'connection',
					status: 'reconnected'
				}
			});
		} else {
			post('ready', {
				type: 'connection',
				status: 'connected'
			});
			this.status = 1;
			console.log('connected');
		}
	}
	process(response) {
		const compiledResponse = jsonParse(response);
		console.log(compiledResponse);
		if (!compiledResponse.id) {
			return this.update(compiledResponse);
		}
		const callback = this.callbacks[compiledResponse.id];
		if (callback) {
			return callback(compiledResponse);
		}
	}
	connect() {
		this.socket = construct(WebSocket, [this.hostDomain]);
		this.socket.addEventListener('open', () => {
			this.ready();
		});
		// Listen for messages
		this.socket.addEventListener('message', (socketEvent) => {
			console.log('Message from server ', socketEvent.data);
			this.process(socketEvent.data);
		});
		this.socket.addEventListener('disconnect', (reason) => {
			console.log('disconnected');
			if (reason === 'io server disconnect') {
				this.connect();
			}
			this.update({
				data: {
					type: 'connection',
					status: 'disconnected'
				}
			});
		});
		this.socket.addEventListener('close', (reason) => {
			console.log('disconnected');
			if (reason === 'io server disconnect') {
				this.socket.connect();
			}
			this.update({
				data: {
					type: 'connection',
					status: 'closed'
				}
			});
		});
	}
	send(data) {
		if (isPlainObject(data)) {
			this.socket.send(stringify(data));
		} else if (isString(data)) {
			this.socket.send(data);
		} else {
			this.socket.send(data);
		}
	}
	async request(configObj) {
		const results = await promise((accept) => {
			const {
				data,
				callback,
			} = configObj;
			if (data.id) {
				data.id = null;
			} else {
				const uuid = uid().toString();
				data.id = uuid;
				this.callbacks[uuid] = async (requestData) => {
					if (callback) {
						const returned = await callback(requestData);
						if (returned) {
							this.callbacks[uuid] = null;
							uid.free(uuid);
							accept(returned);
						}
					} else {
						accept(requestData.data);
					}
				};
			}
			this.send(data);
		});
		return results;
	}
	constructor() {
		console.log('Worker Socket Module', 'notify');
		this.hostDomain = `${(app.config.socketHostname || location.hostname)}`;
		if (app.config.port) {
			this.hostDomain = `${this.hostDomain}:${app.config.port}`;
		}
		console.log(this.hostDomain);
		this.connect();
	}
}
let socketObject;
assign(app.events.socket, {
	async get(options, workerInfo) {
		const { body } = options;
		const fileList = body.files;
		const configObj = {
			checksum: [],
			completedFiles: map(fileList, () => {
				return '';
			}),
			fileList: body,
			fileListLength: fileList.length,
			filesLoaded: 0,
			progress: options.progress,
		};
		const requestConfig = {
			async callback(json) {
				return getCallback(json, configObj, workerInfo);
			},
			data: {
				request: 'file.get',
				body
			},
		};
		const results = await socketObject.request(requestConfig);
		post(workerInfo.id, results);
	},
	request(data) {
		socketObject.request(data);
	},
});
app.events.configure = (data) => {
	assign(config, data);
	console.log('STARTING');
	socketObject = construct(client, []);
};
