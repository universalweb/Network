(function() {
	const {
		isFileJS, isFileJSON, isFileCSS, initial
	} = self.$;
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
	const keepObject = {
		keep: true
	};
	const processScriptRequest = async function(contex, response, configObj, workerInfo) {
		const { body } = response;
		const {
			file, cs, cache
		} = body;
		const key = body.key;
		const fileList = configObj.fileList;
		const filename = fileList.files[key];
		const completedFiles = configObj.completedFiles;
		const checksums = configObj.checksum;
		const isLib = shouldNotUpgrade.test(filename);
		// Remove this can just get ext on other end and check if needed
		const isJs = isFileJS(filename);
		const isJson = isFileJSON(filename);
		const isCss = isFileCSS(filename);
		const dirname = initial(filename.split(slashString)).join(slashString);
		/*
	    During an active stream data is compiled.
	    Based on Key coming in.
	    */
		if (file) {
			completedFiles[key] = file;
			checksums[key] = cs;
			configObj.filesLoaded += 1;
		} else if (file === false) {
			checksums[key] = false;
			completedFiles[key] = false;
			configObj.filesLoaded += 1;
		} else if (cache) {
			completedFiles[key] = true;
			configObj.filesLoaded += 1;
		}
		let completedFile = completedFiles[key];
		if (completedFile !== true && isJs && !isLib && completedFile !== false) {
			completedFile = replaceImports(completedFile);
		}
		const message = {
			dirname,
			isCss,
			isJs,
			isJson,
			isLib,
			key
		};
		if (cs) {
			message.cs = cs;
		}
		if (completedFile) {
			message.file = completedFile;
		}
		contex.post(workerInfo.id, message, keepObject);
		if (configObj.filesLoaded === configObj.fileListLength) {
			const returned = {
				loaded: configObj.filesLoaded
			};
			return returned;
		}
		return false;
	};
	const {
		uid, promise, construct: construct$2, isPlainObject, isString, stringify, jsonParse, hasValue
	} = self.$;
	class ClientSocket {
		constructor(app) {
			this.app = app;
			console.log('Worker Socket Module', 'notify');
			this.hostDomain = `${app.config.socketHostname || location.hostname}`;
			if (app.config.port) {
				this.hostDomain = `${this.hostDomain}:${app.config.port}`;
			}
			console.log(this.hostDomain);
			this.connect();
			clearInterval();
		}
    callbacks = {};
    status = 0;
    ready() {
    	console.log('Socket Is Ready');
    	if (this.status) {
    		this.app.update({
    			type: 'connection',
    			status: 'reconnected'
    		});
    	} else {
    		this.app.post('ready', {
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
    		return this.app.update(compiledResponse);
    	}
    	const callback = this.callbacks[compiledResponse.id];
    	if (callback) {
    		return callback(compiledResponse);
    	}
    }
    reconnect() {
    	const thisContext = this;
    	if (!hasValue(thisContext.connectInterval)) {
    		thisContext.connectInterval = setInterval(() => {
    			thisContext.connect();
    		}, 2000);
    	}
    }
    connect() {
    	const thisContext = this;
    	thisContext.socket = construct$2(WebSocket, [thisContext.hostDomain]);
    	thisContext.socket.addEventListener('open', () => {
    		if (hasValue(thisContext.connectInterval)) {
    			clearInterval(thisContext.connectInterval);
    		}
    		this.ready();
    	});
    	// Listen for messages
    	thisContext.socket.addEventListener('message', (socketEvent) => {
    		console.log('Message from server ', socketEvent.data);
    		thisContext.process(socketEvent.data);
    	});
    	thisContext.socket.addEventListener('disconnect', () => {
    		console.log('disconnected');
    		if (!hasValue(thisContext.connectInterval)) {
    			thisContext.app.update({
    				type: 'connection',
    				status: 'disconnected'
    			});
    		}
    		thisContext.reconnect();
    	});
    	thisContext.socket.addEventListener('close', () => {
    		console.log('close');
    		if (!hasValue(thisContext.connectInterval)) {
    			thisContext.app.update({
    				type: 'connection',
    				status: 'closed'
    			});
    		}
    		thisContext.reconnect();
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
    			data, callback
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
	}
	const {
		assign, construct: construct$1, get, map, apply
	} = self.$;
	class AppWorker {
		constructor() {
			self.onmessage = async (workerEvent) => {
				this.onmessage(workerEvent);
			};
		}
		async onmessage(workerEvent) {
			console.log(workerEvent.data);
			const {
				task, id, data
			} = workerEvent.data;
			const eventCallback = get(task, this.tasks);
			console.log(task, data);
			if (eventCallback) {
				const results = await apply(eventCallback, this, [
					data,
					{
						id
					}
				]);
				if (results) {
					this.post(id, results);
				}
				if (this.debug) {
					console.log(`Worker api.${task}`);
				}
			} else {
				console.log(`FAILED Worker api.${task}`);
			}
		}
		update(body) {
			console.log(body);
			this.post('_', {
				body
			});
		}
		post(id, data, options) {
			const responseData = {
				data,
				id
			};
			assign(responseData, options);
			postMessage(responseData);
		}
    state = 1;
    config = {};
    tasks = {
    	configure(data) {
    		assign(this.config, data);
    		console.log('STARTING');
    		this.socket = construct$1(ClientSocket, [this]);
    	},
    	post(id, data, options) {
    		const responseData = {
    			data,
    			id
    		};
    		assign(responseData, options);
    		postMessage(responseData);
    	},
    	socket: {
    		async get(options, workerInfo) {
    			const context = this;
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
    				progress: options.progress
    			};
    			const requestConfig = {
    				async callback(json) {
    					return processScriptRequest(context, json, configObj, workerInfo);
    				},
    				data: {
    					task: 'file.get',
    					body
    				}
    			};
    			const results = await this.socket.request(requestConfig);
    			this.post(workerInfo.id, results);
    		},
    		request(data) {
    			this.socket.request(data);
    		}
    	}
    };
    utility = self.$;
	}
	const { construct } = self.$;
	construct(AppWorker, []);
})();
