(function() {
	const { assign: assign$1 } = self.$;
	const app = {
		config: {},
		utility: self.$,
		events: {
			appStatus: {
				state: 0
			},
			post(id, data, options) {
				const responseData = {
					data,
					id
				};
				assign$1(responseData, options);
				postMessage(responseData);
			},
			socket: {}
		}
	};
	const {
		config,
		utility: {
			assign, uid, isFileJS, isFileJSON, isFileCSS, initial, map, promise
		},
		events: { post: post$1 }
	} = app;
	let socket;
	let alreadySetup;
	const shouldNotUpgrade = /(^js\/lib\/)|(\.min\.js)/;
	const importRegexGlobal = /\bimport\b([^:;=]*?){([^;]*?)}(\s\bfrom\b).*(('|"|`).*('|"|`));$/gm;
	const importSingleRegexGlobal = /\bimport\b([^:;={}]*?)([^;{}]*?)(\s\bfrom\b).*(('|"|`).*('|"|`));$/gm;
	const importEntire = /\bimport\b\s(('|"|`).*('|"|`));$/gm;
	const importDynamic = /{([^;]*?)}\s=\simport\((('|"|`).*('|"|`))\);$/gm;
	const slashString = '/';
	const update = function(json) {
		post$1('_', json);
	};
	const callbacks = {
		update
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
	// emit function with synthetic callback system
	const request = async (configObj) => {
		const results = await promise((accept) => {
			const {
				data, callback
			} = configObj;
			if (data.id) {
				data.id = null;
			} else {
				const uuid = uid().toString();
				data.id = uuid;
				callbacks[uuid] = async function(requestData) {
					if (callback) {
						const returned = await callback(requestData.data);
						if (returned) {
							callbacks[uuid] = null;
							uid.free(uuid);
							accept(returned);
						}
					} else {
						accept(requestData.data);
					}
				};
			}
			socket.emit('api', data);
		});
		return results;
	};
	const socketIsReady = (data) => {
		console.log('Socket Is Ready');
		if (alreadySetup) {
			update({
				data: {
					type: 'connection',
					status: 'reconnected'
				}
			});
		} else {
			post$1('ready', {
				language: data.language
			});
			alreadySetup = 1;
			console.log('connected');
		}
	};
	const replaceImports = function(file) {
		let compiled = file;
		compiled = compiled.replace(importRegexGlobal, 'const {$2} = await appGlobal.demandJs($4);');
		compiled = compiled.replace(importSingleRegexGlobal, 'const $2 = await appGlobal.demandJs($4);');
		compiled = compiled.replace(importEntire, 'await appGlobal.demandJs($1);');
		compiled = compiled.replace(importDynamic, '{$1} = await appGlobal.demandJs($2);');
		return compiled;
	};
	const getCallback = async function(jsonData, configObj, workerInfo) {
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
		const dirname = initial(filename.split(slashString)).join(slashString);
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
			post$1(
				workerInfo.id,
				{
					cs: checksums[key],
					dirname,
					file: completedFile,
					isCss,
					isJs,
					isJson,
					isLib,
					key
				},
				{
					keep: true
				}
			);
		}
		if (configObj.filesLoaded === configObj.fileListLength) {
			const returned = {
				loaded: configObj.filesLoaded
			};
			return returned;
		}
		return false;
	};
	assign(app.events.socket, {
		async get(options, workerInfo) {
			const { data } = options;
			const fileList = data.files;
			const configObj = {
				checksum: [],
				completedFiles: map(fileList, () => {
					return '';
				}),
				fileList: data,
				fileListLength: fileList.length,
				filesLoaded: 0,
				progress: options.progress
			};
			const body = {
				async callback(json) {
					return getCallback(json, configObj, workerInfo);
				},
				data: {
					request: 'file.get',
					data
				}
			};
			const results = await request(body);
			post$1(workerInfo.id, results);
		},
		request
	});
	const socketInitialize = () => {
		console.log('Worker Socket Module', 'notify');
		let serverLocation = `${location.protocol}//${app.config.socketHostname || location.hostname}`;
		if (app.config.port) {
			serverLocation = `${serverLocation}:${app.config.port}`;
		}
		socket = self.io.connect(serverLocation, {
			transports: ['websocket'],
			secure: true
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
				socket.connect();
			}
			update({
				data: {
					type: 'connection',
					status: 'disconnected'
				}
			});
		});
	};
	app.events.configure = (data) => {
		assign(config, data);
		console.log('STARTING');
		socketInitialize();
	};
	const {
		utility: { get },
		events,
		events: { post }
	} = app;
	self.onmessage = async (workerEvent) => {
		const {
			request, id, data
		} = workerEvent.data;
		const eventCallback = get(request, events);
		console.log(request, data);
		if (eventCallback) {
			const results = await eventCallback(data, {
				id
			});
			if (results) {
				post(id, results);
			}
			if (app.debug) {
				console.log(`Worker api.${request}`);
			}
		} else {
			console.log(`FAILED Worker api.${request}`);
		}
	};
})();
