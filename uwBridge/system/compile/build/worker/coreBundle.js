(function() {
	const {
		assign: assign$2
	} = self.$;
	const app = {
		config: {},
		utility: self.$,
		events: {
			appStatus: {
				state: 0
			},
			credit(data) {
				if (data.credit) {
					app.creditSave = $.assign({}, data.credit);
					console.log('Credits Saved in worker');
				}
			},
			post(id, data, options) {
				const responseData = {
					data,
					id
				};
				assign$2(responseData, options);
				postMessage(responseData);
			},
			socket: {}
		}
	};
	const {
		utility: {
			assign: assign$1
		}
	} = app;
	const post$1 = (id, data, options) => {
		const responseData = {
			data,
			id
		};
		assign$1(responseData, options);
		postMessage(responseData);
	};
	const {
		config,
		utility: {
			assign, uid, stringify, mapArray, last, isFileJS, isFileJSON, isFileCSS, initial, map, eachArray, zipObject
		}
	} = app;
	let socket;
	let alreadySetup;
	const routerData = self.location;
	const tickMark = '`';
	const isLib = /^js\/lib\//;
	const commaString = ',';
	const convertToTemplateString = /:"([^,]*?)"/gm;
	const convertToTemplateStringReplace = ':`$1`';
	const importRegexGlobal = /\b\w*import\b([^:;=]*?)?(["']*([\w'/$,{}_]+)["'][^\w])/gm;
	const importLocationsRegex = /[`'"](.*?)[`'"]/;
	const importVarsRegex = /[^$]{([^;]*?)}/;
	// const exportRegex = /\b\w*export\b([^:;=]*?)/;
	// const exportVars = /{([^;]*?)}/;
	// const exportDeafultRegex = /default ([^;]*?)/;
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
				result = post$1(workerData.id, json.data);
			}
			return result;
		};
		const options = {
			async: configObj.async
		};
		if (data.id) {
			data.id = undefined;
		} else {
			const uniq = uid().toString();
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
								type: 'reconnected'
							},
							id: '_'
						});
					},
					data: {
						data: {
							credit: $.assign({}, app.creditSave)
						},
						request: 'user.loginCredit'
					}
				});
			}
		} else {
			post$1('setupCompleted', {
				language: data.language
			});
			alreadySetup = 1;
			console.log('connected');
		}
	};
	const upgradeImport = (fileArg, item) => {
		let locations = item.match(importLocationsRegex);
		let replaceString = '';
		let appendCSS = '';
		let file = fileArg;
		let objectString;
		if (!locations || !fileArg) {
			return;
		}
		locations = locations[1];
		let imports = item.match(importVarsRegex);
		if (imports) {
			imports = mapArray(imports[1].split(commaString), (ImportItemArg) => {
				const ImportItem = ImportItemArg.trim();
				if (ImportItem.includes(' as ')) {
					return last(ImportItem.split(' '));
				}
				return ImportItem;
			});
			const fileLocations = locations.split(commaString);
			if (fileLocations.length < 2) {
				objectString = `${tickMark}${locations}${tickMark}`;
			} else {
				objectString = stringify(zipObject(imports, fileLocations)).replace(convertToTemplateString, convertToTemplateStringReplace);
			}
			replaceString = `const{${imports}}= `;
		} else {
			appendCSS = ',{appendCSS:true}';
			objectString = `${tickMark}${locations}${tickMark}`;
		}
		replaceString = `${replaceString} await _imprt(${objectString}${appendCSS});`;
		if (!file) {
			return fileArg;
		}
		file = fileArg.replace(item, replaceString);
		return file;
	};
	const replaceImports = function(fileArg) {
		const matches = fileArg.match(importRegexGlobal);
		let file = fileArg;
		if (matches) {
			eachArray(matches, (item) => {
				if (item) {
					file = upgradeImport(file, item);
				}
			});
		}
		return file;
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
		const islib = isLib.test(filename);
		const isJs = isFileJS(filename);
		const isJson = isFileJSON(filename);
		const isCss = isFileCSS(filename);
		const dirname = initial(filename.split(slashString)).join(slashString);
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
			if (completedFile !== true && isJs && !islib && completedFile !== false) {
				completedFile = `((exports) => { const _imprt = app.demand; return ${replaceImports(completedFile)}});`;
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
			const returned = {};
			if (configObj.callback) {
				configObj.callback(returned);
			} else {
				post$1(workerInfo.id, returned);
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
				progress: options.progress
			};
			const body = {
				async: true,
				callback(json) {
					return getCallback(json, configObj, workerInfo);
				},
				data: {
					request: 'file.get'
				}
			};
			body.data.data = dataProp;
			request(body);
		},
		request
	});
	const socketInitialize = () => {
		console.log('Worker Socket Module', 'notify');
		const serverLocation = `${routerData.protocol}//${app.config.socketHostname || routerData.hostname}:${app.config.port}`;
		socket = self.io.connect(serverLocation, {
			transports: ['websocket']
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
					type: 'disconnected'
				},
				id: '_'
			});
		});
	};
	app.events.configure = (data) => {
		assign(config, data);
		console.log('STARTING');
		socketInitialize();
	};
	const {
		utility: {
			get
		},
		events,
		events: {
			post
		}
	} = app;
	self.onmessage = (evnt) => {
		const data = evnt.data;
		const requestName = data.request;
		const id = data.id;
		const body = data.data;
		const eventCallback = get(requestName, events);
		if (eventCallback) {
			const returned = eventCallback(body, {
				id
			});
			if (returned) {
				post(returned, id);
			}
		} else {
			console.log(`FAILED Worker api.${requestName}`);
		}
	};
})();
