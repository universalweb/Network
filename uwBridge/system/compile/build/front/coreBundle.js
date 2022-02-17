(function() {
	const {
		isPlainObject: isPlainObject$4, virtualStorage, crate: crate$4
	} = $;
	const app = {
		events: {},
		async start(data) {
			await Ractive.sharedSet('components', {
				dynamic: {},
				layout: {},
				main: {}
			});
			Ractive.sharedData.$ = $;
			return app.workerRequest('configure', data);
		},
		log: console.log,
		security: {
			clear() {
				app.log('Cleanup');
				app.crate.clear();
			}
		},
		get app() {
			return this;
		},
		componentStore(keyPath, keyValue) {
			if (keyValue || isPlainObject$4(keyPath)) {
				return Ractive.sharedSet(keyPath, keyValue);
			}
			return Ractive.sharedGet(keyPath);
		},
		store: virtualStorage(),
		crate: crate$4(),
		utility: $
	};
	app.imported = {
		get app() {
			return app;
		}
	};
	window.appGlobal = app;
	const isEventNodeMethod = (componentEvent) => {
		if (!componentEvent || !componentEvent.original || !componentEvent.original.target) {
			return false;
		}
		return componentEvent.node === componentEvent.original.target;
	};
	app.isEventNode = isEventNodeMethod;
	const {
		last: last$2, first
	} = app.utility;
	const isLang = new RegExp(/^language\//);
	const languagePath = (filePath) => {
		let filePathCompiled = filePath;
		if (!isLang.test(filePathCompiled)) {
			if (first(filePathCompiled) !== '/') {
				filePathCompiled = `/${filePathCompiled}`;
			}
			filePathCompiled = `language${filePathCompiled}`;
		}
		if (last$2(filePathCompiled) !== '/') {
			filePathCompiled = `${filePathCompiled}/`;
		}
		return `${filePathCompiled}${app.systemLanguage}.json`;
	};
	app.languagePath = languagePath;
	const {
		utility: {
			hasValue: hasValue$5, promise: promise$1, uid, isString: isString$7
		}
	} = app;
	const mainWorker = new Worker('/worker.js');
	const workerRequest = async (requestName, dataArg) => {
		let compiledRequest;
		let callback;
		if (dataArg) {
			compiledRequest = {
				data: dataArg,
				request: requestName
			};
		} else {
			compiledRequest = requestName;
			callback = requestName.callback;
		}
		const requestObject = {
			data: compiledRequest.data,
			request: compiledRequest.request
		};
		if (requestObject.data.id) {
			return mainWorker.postMessage(requestObject);
		}
		return promise$1((accept) => {
			const uniq = uid();
			app.events[uniq] = callback ?
				function(dataCallback) {
					accept(dataCallback);
					callback(dataCallback);
				} :
				accept;
			requestObject.id = uniq;
			mainWorker.postMessage(requestObject);
		});
	};
	const workerMessage = (workerEvent) => {
		const eventData = workerEvent.data;
		const {
			id, data
		} = eventData;
		let generatedId = id;
		if (!hasValue$5(generatedId)) {
			generatedId = '_';
		}
		if (!app.events[generatedId]) {
			console.log(id, generatedId);
		}
		app.events[generatedId](data);
		if (!eventData.keep && !isString$7(generatedId)) {
			app.events[generatedId] = null;
			uid.free(generatedId);
		}
	};
	mainWorker.onmessage = (workerEvent) => {
		return workerMessage(workerEvent);
	};
	app.workerRequest = workerRequest;
	const {
		imported: imported$1,
		crate: crate$3,
		utility: {
			assign: assign$8, querySelector: querySelector$2, map: map$2, hasValue: hasValue$4, isString: isString$6, jsonParse
		}
	} = app;
	const headNode$1 = querySelector$2('head');
	const styleNode = document.createElement('style');
	const iJson = (contents) => {
		if (contents) {
			return jsonParse(contents);
		}
		return {};
	};
	const isLibRegex = /(^js\/lib\/)|(\.min\.js)/;
	const checksumReturn = (item) => {
		return crate$3.getItem(`cs-${item}`);
	};
	const constructStyleTagThenAppendToHead = (text, filePath) => {
		const node = styleNode.cloneNode(false);
		node.textContent = text;
		node.setAttribute('data-src', filePath);
		headNode$1.appendChild(node);
		return node;
	};
	/*
	When all the required items have been downloaded
	*/
	const getLoadedAssets = (item) => {
		return imported$1[item];
	};
	const getCompleted = async (config) => {
		const {
			callback, data
		} = config;
		const assetCollection = map$2(data, getLoadedAssets);
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
			file, cs, key, isJs, isJson, isCss, dirname
		} = json;
		const {
			appendCSS, data
		} = config;
		const filename = data[key];
		let fileContents = file;
		if (fileContents === true) {
			if (!imported$1[filename]) {
				fileContents = crate$3.getItem(filename);
			}
		} else if (fileContents !== false) {
			if (app.debug) {
				console.log('SAVE FILE TO LOCAL', fileContents);
			}
			crate$3.setItem(`cs-${filename}`, cs);
			crate$3.setItem(filename, fileContents);
		}
		if (!hasValue$4(imported$1[filename]) || fileContents !== true) {
			if (!isJs) {
				if (fileContents === false) {
					imported$1[filename] = {};
				} else {
					imported$1[filename] = isJson ? iJson(fileContents) : fileContents;
				}
			} else if (fileContents) {
				if (isLibRegex.test(filename)) {
					let scriptRaw = new File([fileContents], filename, {
						type: 'text/javascript'
					});
					let fileBlob = URL.createObjectURL(scriptRaw);
					imported$1[filename] = await import(fileBlob);
					URL.revokeObjectURL(fileBlob);
					fileBlob = null;
					scriptRaw = null;
				} else {
					if (imported$1[filename]) {
						config.filesLoaded++;
						return checkIfCompleted(config);
					}
					const emulateImport = `Object.assign(import.meta, {path:'${dirname}/',filename:'${filename}'});\n`;
					let scriptRaw = new File([emulateImport, fileContents], filename, {
						type: 'text/javascript'
					});
					let fileBlob = URL.createObjectURL(scriptRaw);
					const moduleExports = Object.assign({}, await import(fileBlob));
					URL.revokeObjectURL(fileBlob);
					config.filesLoaded++;
					imported$1[filename] = moduleExports;
					fileBlob = null;
					scriptRaw = null;
					return checkIfCompleted(config);
				}
			}
		}
		if (isCss && appendCSS && isString$6(imported$1[filename])) {
			constructStyleTagThenAppendToHead(imported$1[filename], filename);
			imported$1[filename] = true;
		}
		{
			config.filesLoaded++;
			return checkIfCompleted(config);
		}
	};
	const fetchFile = async (config) => {
		const configData = config.data;
		config.filesLoaded = 0;
		config.fileCount = config.data.length;
		await workerRequest({
			async callback(json) {
				if (hasValue$4(json.file)) {
					await saveCompleted(json, config);
				} else {
					return checkIfCompleted(config);
				}
			},
			data: {
				data: {
					cs: map$2(configData, checksumReturn),
					files: configData
				}
			},
			request: 'socket.get'
		});
	};
	assign$8(app, {
		fetchFile
	});
	const {
		assign: assign$7
	} = app.utility;
	const request = async (requestName, config) => {
		const requestPackage = config ?
			{
				data: config,
				request: requestName
			} :
			requestName;
		const workerPackage = {
			data: {
				data: requestPackage,
				name: 'api'
			},
			request: 'socket.request'
		};
		if (requestPackage.id) {
			workerPackage.data.id = requestPackage.id;
			return workerRequest(workerPackage);
		}
		const json = await workerRequest(workerPackage);
		return json;
	};
	assign$7(app, {
		request
	});
	const {
		utility: {
			assign: assign$6,
			cnsl: cnsl$2,
			compactMapArray,
			isEmpty,
			eachAsync: eachAsync$2,
			eachObject: eachObject$1,
			eachArray: eachArray$1,
			isString: isString$5,
			isPlainObject: isPlainObject$3,
			hasValue: hasValue$3,
			drop: drop$1
		}
	} = app;
	cnsl$2('Initilizing watchers module.', 'notify');
	const watchers = {};
	const watchersRegex = [];
	const onRegex = (type, callable) => {
		const watchObject = {};
		callable.regex = type;
		let number = watchersRegex.push(callable) - 1;
		assign$6(watchObject, {
			_: {
				isWatcher: true
			},
			callable,
			start() {
				if (!hasValue$3(number)) {
					number = watchersRegex.push(callable) - 1;
				}
			},
			stop() {
				if (hasValue$3(number)) {
					drop$1(watchersRegex, number);
					number = null;
				}
			}
		});
		return watchObject;
	};
	const onString = (type, callable) => {
		const watchObject = {};
		if (!watchers[type]) {
			watchers[type] = [];
		}
		const levelObject = watchers[type];
		let number = levelObject.push(callable) - 1;
		assign$6(watchObject, {
			_: {
				isWatcher: true
			},
			callable,
			start() {
				if (!hasValue$3(number)) {
					number = levelObject.push(callable) - 1;
				}
			},
			stop() {
				if (hasValue$3(number)) {
					drop$1(levelObject, number);
					number = null;
				}
			}
		});
		return watchObject;
	};
	const onCollection = (object, settings) => {
		const watching = [];
		const prefix = settings.prefix ? `${settings.prefix}.` : '';
		const suffix = settings.suffix ? `.${settings.suffix}` : '';
		const watchCollection = {
			_: {
				isWatcher: true
			},
			start() {
				eachArray$1(watching, (item) => {
					item.start();
				});
			},
			stop() {
				eachArray$1(watching, (item) => {
					item.stop();
				});
			},
			watching
		};
		eachObject$1(object, (item, key) => {
			watching.push(onString(`${prefix}${key}${suffix}`, item));
		});
		return watchCollection;
	};
	const watch$3 = (type, callable) => {
		let method;
		if (isString$5(type)) {
			method = onString;
		} else if (isPlainObject$3(type)) {
			method = onCollection;
		} else {
			method = onRegex;
		}
		return method(type, callable);
	};
	watch$3.status = true;
	watch$3.start = () => {
		watch$3.status = true;
	};
	watch$3.stop = () => {
		watch$3.status = null;
	};
	const onUpdate = async (json) => {
		if (!watch$3.status || !json) {
			return;
		}
		const type = json.type;
		const subscribers = [];
		const levelObject = watchers[type] || watchers[json.name];
		const regexSubscribers = compactMapArray(watchersRegex, (item) => {
			if (item.regex.test(type)) {
				return item;
			}
		});
		if (!isEmpty(regexSubscribers)) {
			subscribers.push(...regexSubscribers);
		}
		if (levelObject) {
			subscribers.push(...levelObject);
		}
		console.log(subscribers);
		if (subscribers.length) {
			eachAsync$2(subscribers, (watcher) => {
				return watcher(json, watcher);
			});
		}
	};
	const push = (requestName, data) => {
		return request({
			data,
			id: '_',
			request: requestName
		});
	};
	assign$6(app.events, {
		_(json) {
			return onUpdate(json.data);
		}
	});
	assign$6(app, {
		push,
		watch: watch$3,
		watchers,
		watchersRegex
	});
	const {
		utility: {
			assign: assign$5,
			hasDot,
			promise,
			last: last$1,
			map: map$1,
			isString: isString$4,
			isPlainObject: isPlainObject$2,
			each: each$6,
			cnsl: cnsl$1,
			initialString,
			restString,
			getFileExtension: getFileExtension$1
		},
		imported,
		crate: crate$2
	} = app;
	const commaString = ',';
	const buildFilePath$1 = (itemArg) => {
		let item = itemArg;
		if (!hasDot(item)) {
			if (initialString(item, -9) === 'language/') {
				item = languagePath(item);
			} else if (last$1(item) === '/') {
				item += 'index.js';
			} else if (initialString(item, -3) === 'js/') {
				item += '.js';
			} else if (initialString(item, -4) === 'css/') {
				item += '.css';
			}
			app.log(item);
		}
		if (restString(item, -3) === '.js') {
			app.log(item, watch$3);
			if (!watchers[item]) {
				watch$3(item, (thing) => {
					if (app.debug) {
						console.log('Live Reload', thing);
					}
					crate$2.removeItem(thing.name);
					crate$2.removeItem(`cs-${thing.name}`);
				});
			}
		}
		return item;
	};
	const singleDemand = (items) => {
		return items[0];
	};
	const objectDemand = (items, arrayToObjectMap) => {
		return map$1(arrayToObjectMap, (item) => {
			return items[item];
		});
	};
	const multiDemand = (items) => {
		return items;
	};
	const streamAssets = (data, options) => {
		return promise((accept) => {
			fetchFile(
				assign$5(
					{
						callback(...args) {
							accept(args);
						},
						data
					},
					options
				)
			);
		});
	};
	const demand$4 = async (filesArg, options) => {
		const assets = [];
		let demandType;
		let arrayToObjectMap;
		let files = filesArg;
		if (isPlainObject$2(files)) {
			demandType = objectDemand;
			arrayToObjectMap = {};
			let index = 0;
			each$6(files, (item, key) => {
				arrayToObjectMap[key] = index;
				index++;
				assets.push(buildFilePath$1(item));
			});
		} else {
			files = isString$4(files) ? files.split(commaString) : files;
			demandType = files.length < 2 ? singleDemand : multiDemand;
			each$6(files, (item) => {
				assets.push(buildFilePath$1(item));
			});
		}
		const results = await streamAssets(assets, options);
		app.log(results);
		return demandType(results, arrayToObjectMap);
	};
	const demandTypeMethod = (type, optionsFunction) => {
		return function(filesArg, options) {
			let files = filesArg;
			if (isString$4(files)) {
				files = files.split(commaString);
			}
			if (optionsFunction) {
				optionsFunction(options);
			}
			files = map$1(files, (item) => {
				if (imported[item]) {
					return item;
				}
				const itemExt = getFileExtension$1(item);
				const compiledFileName = itemExt ? item : `${item}${(last$1(item) === '/' && 'index') || ''}.${type}`;
				app.log('Demand Type', type, compiledFileName);
				return compiledFileName;
			});
			return demand$4(files, options);
		};
	};
	const demandCss$1 = demandTypeMethod('css', (appendCSS) => {
		return {
			appendCSS
		};
	});
	const demandJs$1 = demandTypeMethod('js');
	const demandHtml$1 = demandTypeMethod('html');
	const demandLang = (fileList) => {
		const files = isString$4(fileList) ? fileList.split(commaString) : fileList;
		return demand$4(map$1(files, languagePath));
	};
	assign$5(app.events, {
		async setupCompleted(data) {
			cnsl$1('Worker is Ready', 'notify');
			app.systemLanguage = data.language;
			try {
				await demand$4('app/');
			} catch (error) {
				console.log(error);
				crate$2.clear();
				window.location.reload();
			}
		}
	});
	assign$5(app, {
		demand: demand$4,
		demandCss: demandCss$1,
		demandHtml: demandHtml$1,
		demandJs: demandJs$1,
		demandLang
	});
	const {
		utility: {
			drop
		}
	} = app;
	const notifications = [];
	const spawnNotification = (data) => {
		if (app.notificationStatus) {
			const notification = new Notification(
				data.title,
				{
					body: data.body,
					icon: data.icon
				},
				data.options
			);
			const number = notifications.push(notification) - 1;
			setTimeout(() => {
				notification.close();
				drop(notifications, number, 1);
			}, data.time || 4000);
			return notification;
		}
	};
	app.notify = async (data) => {
		if (Notification.permission === 'granted') {
			return spawnNotification(data);
		} else if (Notification.permission !== 'denied') {
			const permission = await Notification.requestPermission();
			if (permission === 'granted') {
				spawnNotification({
					body: 'enabled',
					title: 'Notifications'
				});
			}
		}
	};
	const {
		utility: {
			debounce, eventAdd: eventAdd$1, isAgent, info, model, assign: assign$4
		}
	} = app;
	app.updateResize = async () => {
		await Ractive.sharedSet(info);
		const width = info.windowWidth;
		let widthLevel = 0;
		let screenSize;
		if (width < 640) {
			screenSize = 'miniScreen';
		} else if (width < 740) {
			screenSize = 'tinyScreen';
			widthLevel = 1;
		} else if (width < 1024) {
			screenSize = 'smallScreen';
			widthLevel = 2;
		} else if (width < 1920) {
			screenSize = 'mediumScreen';
			widthLevel = 3;
		} else if (width < 3000) {
			screenSize = 'hdScreen';
			widthLevel = 4;
		} else if (width > 3000) {
			screenSize = '4kScreen';
			widthLevel = 5;
		}
		console.log(screenSize);
		await Ractive.sharedSet(
			assign$4(Ractive.sharedGet(), {
				tinyScreen: false,
				smallScreen: false,
				mediumScreen: false,
				hdScreen: false,
				'4kScreen': false
			})
		);
		await Ractive.sharedSet('screenSize', screenSize);
		await Ractive.sharedSet(screenSize, true);
		await Ractive.sharedSet('widthLevel', widthLevel);
	};
	const updateResize = debounce(app.updateResize, 250);
	function calculateScreen() {
		requestAnimationFrame(updateResize);
	}
	eventAdd$1(
		window,
		'resize',
		() => {
			calculateScreen();
		},
		true
	);
	const smoothScroll = (element, to, duration) => {
		if (duration <= 0) {
			return;
		}
		const difference = to - element.scrollTop;
		const perTick = (difference / duration) * 10;
		requestAnimationFrame(() => {
			element.scrollTop = element.scrollTop + perTick;
			if (element.scrollTop === to) {
				return;
			}
			smoothScroll(element, to, duration - 10);
		});
	};
	const mobileCheck = () => {
		let check = false;
		const a = navigator.userAgent || navigator.vendor || window.opera;
		if (
			(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i).test(
				a
			) ||
      (/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw(n|u)|c55\/|capi|ccwa|cdm|cell|chtm|cldc|cmd|co(mp|nd)|craw|da(it|ll|ng)|dbte|dcs|devi|dica|dmob|do(c|p)o|ds(12|d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(|_)|g1 u|g560|gene|gf5|gmo|go(\.w|od)|gr(ad|un)|haie|hcit|hd(m|p|t)|hei|hi(pt|ta)|hp( i|ip)|hsc|ht(c(| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i(20|go|ma)|i230|iac( ||\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|[a-w])|libw|lynx|m1w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|mcr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|([1-8]|c))|phil|pire|pl(ay|uc)|pn2|po(ck|rt|se)|prox|psio|ptg|qaa|qc(07|12|21|32|60|[2-7]|i)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h|oo|p)|sdk\/|se(c(|0|1)|47|mc|nd|ri)|sgh|shar|sie(|m)|sk0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h|v|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl|tdg|tel(i|m)|tim|tmo|to(pl|sh)|ts(70|m|m3|m5)|tx9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas|your|zeto|zte/i).test(
      	a.substr(0, 4)
      )
		) {
			check = true;
		}
		return check;
	};
	const tabletCheck = () => {
		return (/(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/).test(
			navigator.userAgent.toLowerCase()
		);
	};
	app.initializeScreen = async () => {
		const isMobile = mobileCheck();
		const isTablet = tabletCheck();
		if (isMobile) {
			await Ractive.sharedSet('classes.mobile', true);
			await Ractive.sharedSet('mobile', true);
		}
		if (isTablet) {
			await Ractive.sharedSet('classes.tablet', true);
			await Ractive.sharedSet('tablet', true);
		}
		if (!isMobile && !isTablet) {
			await Ractive.sharedSet('classes.desktop', true);
			await Ractive.sharedSet('desktop', true);
		}
		await Ractive.sharedSet('classes.chrome', isAgent.chrome);
		await Ractive.sharedSet('classes.android', isAgent.android);
		await Ractive.sharedSet('classes.linux', isAgent.linux);
		await Ractive.sharedSet('classes.mozilla', isAgent.mozilla);
		await Ractive.sharedSet('classes.applewebkit', isAgent.applewebkit);
		await app.updateResize();
	};
	model('smoothScroll', smoothScroll);
	const {
		utility: {
			assign: assign$3
		}
	} = app;
	const methods = {
		$: app.utility,
		getComponent(partialName) {
			const componentName = partialName;
			const partial = `<${partialName} />`;
			console.log(componentName);
			const partialsCheck = Boolean(this.partials[partialName]);
			if (!partialsCheck) {
				this.partials[partialName] = partial;
			}
			return partialName;
		},
		makePartial(id, template) {
			const key = `partial-${id}`;
			const partialsCheck = Boolean(this.partials[id]);
			if (partialsCheck) {
				return key;
			}
			this.partials[key] = template;
			return key;
		}
	};
	assign$3(Ractive.prototype.data, methods);
	const {
		utility: {
			findIndex,
			hasValue: hasValue$2,
			findItem,
			assignDeep: assignDeep$1,
			ensureArray: ensureArray$1,
			assign: assign$2,
			isArray: isArray$1,
			sortNewest,
			sortOldest,
			clear,
			isPlainObject: isPlainObject$1,
			mapAsync
		}
	} = app;
	function assemblePath(keypath, options = {}) {
		const {
			pathPrefix = '', pathSuffix = ''
		} = options;
		return (pathPrefix && `${pathPrefix}.`) + keypath + (pathSuffix && `.${pathSuffix}`);
	}
	// function assembleAfterIndexPath(keypath, options) {
	// 	const {
	// 		afterIndex = '',
	// 		beforeIndex = ''
	// 	} = options;
	// 	return (beforeIndex && `${beforeIndex}.`) + keypath + (afterIndex && `.${afterIndex}`);
	// }
	function getPropertyName(indexName, options = {}) {
		return indexName || app.idProperty || options.idProperty || 'id';
	}
	function getIndexValue(indexMatchArg, indexNameArg, options) {
		const indexName = getPropertyName(indexNameArg, options);
		const indexMatch = isPlainObject$1(indexMatchArg) ? indexMatchArg[indexName] : indexMatchArg;
		return indexMatch;
	}
	function getItem(context, keypath, indexMatchArg, indexNameArg, options = {}) {
		const indexName = getPropertyName(indexNameArg, options);
		const indexMatch = getIndexValue(indexMatchArg, indexNameArg, options);
		const path = assemblePath(keypath, options);
		const item = findItem(context.get(path), indexMatch, indexName);
		return item;
	}
	function getIndex(context, keypath, indexMatchArg, indexNameArg, options = {}) {
		const indexName = getPropertyName(indexNameArg, options);
		const indexMatch = getIndexValue(indexMatchArg, indexNameArg, options);
		const path = assemblePath(keypath, options);
		const index = findIndex(context.get(path), indexMatch, indexName);
		return hasValue$2(index) ? index : null;
	}
	function getOrigin(context, keypath, indexMatchArg, indexNameArg, options = {}) {
		const indexName = getPropertyName(indexNameArg, options);
		const indexMatch = getIndexValue(indexMatchArg, indexNameArg, options);
		const path = assemblePath(keypath, options);
		const item = context.get(path);
		const index = findIndex(item, indexMatch, indexName);
		return {
			index,
			path
		};
	}
	async function putByIndex(context, keypath, value, indexMatchArg, indexNameArg, options, addBy = 1) {
		const path = assemblePath(keypath, options);
		const indexName = getPropertyName(indexNameArg, options);
		const indexMatch = getIndexValue(indexMatchArg, indexNameArg, options);
		const index = findIndex(path, indexMatch, indexName);
		if (hasValue$2(index)) {
			return context.splice(path, index + addBy, 0, ...ensureArray$1(value));
		} else {
			return context.push(path, value);
		}
	}
	async function setAtIndex(context, keypath, value, indexMatchArg, indexNameArg, options) {
		const path = assemblePath(keypath, options);
		const indexName = getPropertyName(indexNameArg, options);
		const indexMatch = getIndexValue(indexMatchArg, indexNameArg, options);
		const index = findIndex(context.get(path), indexMatch, indexName);
		if (hasValue$2(index)) {
			return context.set(`${path}.${index}`, value);
		}
	}
	const extendRactive = {
		async merge(keypath, source = {}, options) {
			const path = assemblePath(keypath, options);
			const target = this.get(keypath);
			if (hasValue$2(target)) {
				assignDeep$1(target, source);
				await this.update(path);
			}
			return target;
		},
		putByIndex(keypath, value, indexMatch, indexName, options, addBy) {
			return putByIndex(this, keypath, value, indexMatch, indexName, options, addBy);
		},
		setAtIndex(keypath, value, indexMatch, indexName, options, addBy) {
			return setAtIndex(this, keypath, value, indexMatch, indexName, options);
		},
		getOrigin(keypath, indexMatch, indexNameArg, options) {
			return getOrigin(this, keypath, indexMatch, indexNameArg, options);
		},
		appendAtIndex(keypath, indexMatch, value, indexName, amount = 1, options) {
			return putByIndex(this, keypath, value, indexMatch, indexName, options, amount);
		},
		prependAtIndex(keypath, indexMatch, value, indexName, amount = -1, options) {
			return putByIndex(this, keypath, value, indexMatch, indexName, options, amount);
		},
		async clearArray(keypath, options) {
			const path = assemblePath(keypath, options);
			const target = this.get(path);
			app.log(path, target);
			if (isArray$1(target)) {
				clear(target);
				await this.update(path);
			} else {
				app.log(`Attempted to clear none array at ${keypath}`);
			}
			return target;
		},
		getItem(keypath, indexMatch, indexName, options) {
			return getItem(this, keypath, indexMatch, indexName, options);
		},
		getIndex(keypath, indexMatch, indexName, options) {
			return getIndex(this, keypath, indexMatch, indexName, options);
		},
		async removeByIndex(keypath, indexMatchArg, indexNameArg, upto = 1, options) {
			const path = assemblePath(keypath, options);
			const indexName = getPropertyName(indexNameArg, options);
			const index = getIndex(this, keypath, indexMatchArg, indexName, options);
			if (hasValue$2(index)) {
				return this.splice(path, index, upto);
			}
		},
		async removeIndex(keypath, index, upto = 1, options) {
			const path = assemblePath(keypath, options);
			if (hasValue$2(index)) {
				return this.splice(path, index, upto);
			}
		},
		async pushByIndex(keypath, value, indexMatch, indexName, options) {
			const path = assemblePath(keypath, options);
			const item = getItem(this, path, indexMatch, indexName, options);
			if (isArray$1(item)) {
				item.push(value);
			}
			this.update(path);
		},
		async unshiftByIndex(keypath, item, indexMatchArg, indexNameArg, options) {
			const indexName = getPropertyName(indexNameArg, options);
			const index = getIndex(this, keypath, indexMatchArg, indexName, options);
			if (hasValue$2(index)) {
				const path = assemblePath(`${keypath}.${index}`, options);
				await this.unshift(path, item);
			}
		},
		async shiftByIndex(keypath, indexMatchArg, item, indexNameArg, options) {
			const indexName = getPropertyName(indexNameArg, options);
			const index = getIndex(this, keypath, indexMatchArg, indexName, options);
			if (hasValue$2(index)) {
				const path = assemblePath(`${keypath}.${index}`, options);
				await this.shift(path);
			}
		},
		async popByIndex(keypath, indexMatchArg, item, indexNameArg, options) {
			const indexName = getPropertyName(indexNameArg, options);
			const index = getIndex(this, keypath, indexMatchArg, indexName, options);
			if (hasValue$2(index)) {
				const path = assemblePath(`${keypath}.${index}`, options);
				await this.pop(path);
			}
		},
		async sortNewest(path, property) {
			const array = this.get(path);
			sortNewest(array, property, true);
			await this.update(path);
		},
		async sortOldest(path, property) {
			const array = this.get(path);
			sortOldest(array, property, true);
			await this.update(path);
		},
		async syncItem(pathOriginal, newValue, indexName, type = 'push', propertyName, options = {}) {
			// app.log(this, pathOriginal, newValue, indexName);
			const path = assemblePath(pathOriginal, options);
			// app.log(path);
			const currentValue = getItem(this, path, newValue, indexName, options);
			if (currentValue) {
				if (type === 'remove') {
					return this.removeByIndex(pathOriginal, newValue, propertyName, indexName);
				} else {
					const {
						mergeArrays = false
					} = options;
					assignDeep$1(currentValue, newValue, mergeArrays);
					return this.update(path);
				}
			}
			if (extendRactive[type]) {
				return this[type](path, newValue, indexName, propertyName, options);
			}
			return this[type](path, newValue);
		},
		async syncCollection(...args) {
			const source = this;
			const [pathOriginal, newValues, indexName, type = 'push', propertyName, options = {}] = args;
			app.log(source, pathOriginal, newValues, indexName, type, propertyName, options);
			if (isArray$1(newValues)) {
				return mapAsync(newValues, async (item) => {
					return source.syncItem(pathOriginal, item, indexName, type, propertyName, options);
				});
			} else {
				return source.syncItem(pathOriginal, newValues, indexName, type, propertyName, options);
			}
		},
		async toggleByIndex(keypath, indexMatch, indexName, options) {
			const path = assemblePath(keypath, options);
			const index = getIndex(keypath, indexMatch, indexName, options);
			if (hasValue$2(index)) {
				await this.toggle(`${path}.${index}`);
			}
		}
	};
	assign$2(Ractive.prototype, extendRactive);
	const {
		utility: {
			each: each$5, isString: isString$3, isArray, isFunction: isFunction$2
		}
	} = app;
	const multiEvent = (currentView, componentEvent, events, ...args) => {
		app.log(currentView, componentEvent, events);
		app.log(args);
		if (componentEvent && events.length) {
			const {
				original
			} = componentEvent;
			original.preventDefault();
			original.stopPropagation();
		}
		if (events) {
			if (isString$3(events)) {
				each$5(events.split(','), (subItem) => {
					if (subItem) {
						currentView.fire(subItem.trim(), componentEvent, ...args);
					}
				});
			} else if (isFunction$2(events)) {
				events(componentEvent, ...args);
			} else if (isArray(events)) {
				each$5(events, (item) => {
					if (item) {
						multiEvent(currentView, componentEvent, item, ...args);
					}
				});
			}
		}
	};
	const {
		utility: {
			each: each$4, assign: assign$1, querySelector: querySelector$1
		}
	} = app;
	const headNode = querySelector$1('head');
	const importedCssCount = {};
	const importedCss = {};
	const render = (code, filePath) => {
		if (importedCss[filePath]) {
			importedCssCount[filePath]++;
		} else {
			importedCssCount[filePath] = 0;
			const node = document.createElement('style');
			node.innerHTML = code;
			node.setAttribute('data-src', filePath);
			headNode.appendChild(node);
			importedCss[filePath] = node;
		}
	};
	const unrender = (code, filePath) => {
		if (importedCss[filePath]) {
			importedCssCount[filePath]--;
			if (importedCssCount[filePath] < 0) {
				importedCss[filePath].remove();
				importedCss[filePath] = null;
				importedCssCount[filePath] = null;
			}
		}
	};
	const cssRender = (css) => {
		if (css) {
			each$4(css, render);
		}
	};
	const cssUnrender = (css) => {
		if (css) {
			each$4(css, unrender);
		}
	};
	const componentsWithCss = {};
	const registerCssComponent = (css, componentConfig) => {
		if (!css) {
			return;
		}
		each$4(css, (item, key) => {
			if (!componentsWithCss[key]) {
				componentsWithCss[key] = [];
			}
			componentsWithCss[key].push(componentConfig);
		});
	};
	assign$1(app, {
		componentsWithCss,
		importedCss,
		importedCssCount
	});
	const {
		watch: watch$2,
		utility: {
			each: each$3, get, apply: apply$1
		}
	} = app;
	const createWatchers = (currentView, item, key) => {
		if (get('isWatcher', item._)) {
			currentView.watchers[key] = item;
			return;
		}
		item.options = item.options || {};
		item.methods = item.methods || {};
		let {
			prefix, suffix
		} = item.options;
		const {
			idProperty
		} = item.options;
		const {
			methods
		} = item;
		const createMethod = methods.create || 'push';
		const readMethod = methods.read || 'push';
		prefix = prefix ? `${prefix}.` : '';
		suffix = suffix ? `.${suffix}` : '';
		item.prefix = prefix;
		item.suffix = suffix;
		currentView.watchers[key] = watch$2(
			{
				async create(json) {
					await currentView.syncCollection(key, json.item, createMethod, idProperty);
					currentView.fire(`${prefix}create${suffix}`, json.item, json);
				},
				async delete(json) {
					await currentView.removeByIndex(key, json.item[idProperty], idProperty);
					currentView.fire(`${prefix}delete${suffix}`, json.item, json);
				},
				async read(json) {
					await currentView.syncCollection(key, json.items, readMethod, idProperty);
					currentView.fire(`${prefix}read${suffix}`, json.item, json);
				},
				async update(json) {
					await currentView.syncCollection(key, json.item, createMethod, idProperty);
					currentView.fire(`${prefix}update${suffix}`, json.item, json);
				}
			},
			item.options
		);
	};
	const removeInstance = function(currentView, styles) {
		cssUnrender(styles);
		each$3(currentView.watchers, (item, key) => {
			item.stop();
			item[key] = null;
		});
		currentView.styles = null;
		currentView.asset = null;
	};
	const onrenderInstance = function(currentView, styles) {
		cssRender(styles);
		if (currentView.watchers) {
			each$3(currentView.watchers, (item) => {
				item.start();
			});
		}
	};
	const buildComponentEvents = function(componentConfig) {
		const {
			styles, watchers
		} = componentConfig;
		const thisComponent = this;
		thisComponent.watchers = watchers ? watchers(thisComponent) : {};
		if (thisComponent.watchers) {
			each$3(thisComponent.watchers, (item, key) => {
				createWatchers(thisComponent, item, key);
			});
		}
		thisComponent.asset = componentConfig.asset;
		thisComponent.on({
			multi(cmpntEvent, ...args) {
				app.log(cmpntEvent, ...args);
				return multiEvent(this, cmpntEvent, ...args);
			},
			render() {
				return onrenderInstance(this, styles);
			},
			teardown() {
				return removeInstance(this, styles);
			}
		});
	};
	const onConstruct = function(componentConfig) {
		const sourceConstruct = componentConfig.onconstruct;
		componentConfig.onconstruct = function(...args) {
			apply$1(buildComponentEvents, this, [componentConfig, ...args]);
			if (sourceConstruct) {
				return apply$1(sourceConstruct, this, args);
			}
		};
		const sourceRender = componentConfig.onrender;
		componentConfig.onrender = function(...args) {
			if (sourceRender) {
				return apply$1(sourceRender, this, args);
			}
		};
	};
	const buildComponent = (componentConfig) => {
		const {
			name: componentName, asset, styles
		} = componentConfig;
		registerCssComponent(styles, componentConfig);
		onConstruct(componentConfig);
		const cmpntConfigClean = componentConfig;
		const Component = Ractive.extend(cmpntConfigClean);
		if (componentName) {
			Ractive.components[componentName] = Component;
		}
		Component.asset = asset;
		return Component;
	};
	const {
		demand: demand$3,
		demandCss,
		demandHtml,
		utility: {
			eachAsync: eachAsync$1, ensureArray, isString: isString$2, getFileExtension, hasValue: hasValue$1, eachObjectAsync
		}
	} = app;
	function buildFilePath(template, extType = 'html') {
		const templateExt = template && getFileExtension(template);
		return (!templateExt && `${template}.${extType}`) || template;
	}
	const asyncComponent = async function(componentConfig) {
		componentConfig.asset ||= {};
		let asset = componentConfig.asset || {};
		if (isString$2(asset)) {
			asset = {
				template: asset
			};
		}
		componentConfig.styles = componentConfig.styles || {};
		componentConfig.partials = componentConfig.partials || {};
		if (asset) {
			const {
				partials, template, styles
			} = asset;
			if (hasValue$1(template)) {
				asset.template = buildFilePath(template);
				app.log('Async Template COMPILED URL', asset.template);
				componentConfig.template = await demandHtml(asset.template);
			}
			if (asset.demand) {
				componentConfig.demand = await demand$3(asset.demand);
			}
			if (partials) {
				await eachObjectAsync(partials, async (item, key) => {
					const compiledPartialPath = (partials[key] = buildFilePath(item));
					componentConfig.partials[key] = await demandHtml(compiledPartialPath);
				});
				console.log(asset);
			}
			if (styles) {
				await eachAsync$1(ensureArray(styles), async (item, key) => {
					const compiledCssPath = (styles[key] = buildFilePath(item, 'css'));
					app.log('compiled css path', compiledCssPath);
					componentConfig.styles[compiledCssPath] = await demandCss(compiledCssPath);
				});
			}
		}
		const componentPromise = await buildComponent(componentConfig);
		app.log('Async Component Config', componentConfig);
		return componentPromise;
	};
	const {
		utility: {
			isString: isString$1
		}
	} = app;
	const components = {};
	const generateComponent = (ComponentView, config) => {
		return new ComponentView(config);
	};
	const getComponent = (componentName, config) => {
		const componentObject = components[componentName];
		return config ? generateComponent(componentObject, config) : componentObject;
	};
	const component$1 = (componentName, componentConfigOption) => {
		let method;
		const componentConfig = componentConfigOption ? componentConfigOption : componentName;
		if (isString$1(componentName)) {
			componentConfig.name = componentName;
		}
		console.log(componentConfig);
		if (componentConfig.asset) {
			method = asyncComponent;
		} else {
			method = buildComponent;
		}
		return method(componentConfig);
	};
	app.component = component$1;
	app.getComponent = getComponent;
	const {
		demand: demand$2,
		watch: watch$1,
		utility: {
			each: each$2, querySelector, isDom
		}
	} = app;
	const onCss = async (json) => {
		const filePath = json.name;
		const componentName = json.type;
		const componentsUsingCss = componentsWithCss[filePath];
		console.log('CSS UPDATE', filePath, componentsUsingCss);
		const node = importedCss[filePath] || importedCss[componentName] || querySelector(`[data-src="${filePath}"]`);
		if (node || componentsUsingCss) {
			const content = await demand$2(filePath);
			if (isDom(node)) {
				node.innerHTML = content;
			}
			if (componentsUsingCss) {
				each$2(componentsUsingCss, (item) => {
					console.log(item);
					item.styles[filePath] = content;
				});
			}
		}
	};
	watch$1(/\.css/, onCss);
	const {
		watch,
		demand: demand$1,
		utility: {
			eachObject, eachArray
		},
		crate: crate$1
	} = app;
	const onHtml = async (matchFilename, json, callback) => {
		if (callback) {
			return callback(matchFilename, json);
		}
		const filePath = json.name;
		app.log('WATCH HTML', matchFilename, json);
		const html = await demand$1(filePath);
		crate$1.setItem(filePath, html);
		app.log(filePath, html.length);
		eachObject(Ractive.components, (item, key) => {
			const asset = item.asset;
			if (asset.template === filePath) {
				item.defaults.template = Ractive.parse(html);
				const matchedComponents = app.view.findAllComponents(key);
				if (matchedComponents) {
					eachArray(matchedComponents, (matchedComponent) => {
						matchedComponent.resetTemplate(html);
					});
				}
			}
			if (asset.partials) {
				eachObject(asset.partials, (partialPath, partialName) => {
					if (partialPath === filePath) {
						item.partials[partialName] = Ractive.parse(html);
						const matchedComponents = app.view.findAllComponents(key);
						if (matchedComponents) {
							eachArray(matchedComponents, (matchedComponent) => {
								// app.log('reset partial', partialName);
								matchedComponent.resetPartial(partialName, html);
							});
						}
					}
				});
			}
		});
		window.UIkit.update(document.body, 'update');
	};
	const watchHtml = (matchFilename, callback) => {
		app.log('WATCH HTML', matchFilename);
		return watch(matchFilename, (json) => {
			app.log('HTML FILE CHANGED WATCH EVENT', matchFilename);
			onHtml(matchFilename, json, callback);
		});
	};
	watch.html = watchHtml;
	watchHtml(/\.html/);
	const {
		demand,
		utility: {
			assign, each: each$1, isFunction: isFunction$1
		}
	} = app;
	const view = new Ractive({
		template: `{{#@shared.components.main:key}}{{>getComponent(key)}}{{/}}`
	});
	view.on({
		async '*.loadComponent'(componentEvent) {
			const imported = await demand(componentEvent.get('demand'));
			const afterDemand = componentEvent.get('afterDemand');
			if (afterDemand) {
				const afterDemandEvents = afterDemand[componentEvent.original.type];
				each$1(afterDemandEvents, (item, key) => {
					if (isFunction$1(item)) {
						item(imported, item, key);
					} else {
						app.view.findComponent(key).fire(item);
					}
				});
			}
		},
		'*.preventDefault'(context) {
			const {
				original
			} = context;
			original.preventDefault();
			original.stopPropagation();
		}
	});
	app.importComponent = async (componentName, importURL, type = 'dynamic') => {
		if (importURL) {
			await demand(importURL);
		}
		await view.set(`@shared.components.${type}.${componentName}`, true);
		await view.update('@shared.components.${type}');
	};
	app.title = new Ractive({
		target: 'head',
		append: true,
		data() {
			return {};
		},
		template: `<title>{{@shared.pageTitle}}</title>`
	});
	assign(app, {
		async render() {
			await app.initializeScreen();
			await view.render('body');
		},
		view
	});
	const {
		demandJs,
		utility: {
			cnsl,
			assignDeep,
			mapArray,
			map,
			isString,
			rest,
			camelCase,
			eventAdd,
			isRegExp,
			mapWhile,
			hasValue,
			last,
			isFunction,
			apply,
			eachAsync,
			isPlainObject,
			each
		},
		crate,
		component
	} = app;
	cnsl('ROUTER ONLINE', 'important');
	class Router {
		constructor() {
			return this;
		}
    debug = false;
    hostname = location.hostname;
    pathname = location.pathname;
    navHistory = [];
    historyIndex = 0;
    routes = [];
    methods = {};
    events = {
    	beforeLoad: [],
    	afterLoad: [],
    	beforeInit: [],
    	afterInit: [],
    	afterRender: [],
    	beforeRender: [],
    	render: []
    };
    on(eventNames, callback) {
    	const thisRouter = this;
    	if (isPlainObject(eventNames) && !callback) {
    		return each(eventNames, (eventCallback, eventName) => {
    			thisRouter.on(eventName, eventCallback);
    		});
    	}
    	return this.events[eventNames].push(callback);
    }
    async triggerEvents(eventName, optionalBind = this, args = []) {
    	const bindThis = this;
    	console.log(bindThis, this.events[eventName], eventName, args);
    	return eachAsync(this.events[eventName], async (eventItem) => {
    		await apply(eventItem, optionalBind, args);
    	});
    }
    defaults = {
    	protected: false,
    	role: false
    };
    state;
    log(...args) {
    	if (this.debug || app.debug) {
    		console.log(...args);
    	}
    }
    popstate(popstateEvent) {
    	app.router.log('popstate', popstateEvent);
    	popstateEvent.preventDefault();
    	app.router.process();
    }
    pushState(url) {
    	history.pushState({}, url, url);
    	app.router.process();
    }
    installRoute(routeModel) {
    	app.router.log('Install Route', routeModel);
    	const {
    		match
    	} = routeModel;
    	if (match) {
    		routeModel.regex = isRegExp(match) ? match : new RegExp(match);
    	}
    	return app.router.routes.push(routeModel);
    }
    add(item) {
    	this.log('add routes', item);
    	return mapArray(item, this.installRoute);
    }
    async setup(options) {
    	this.log('setup router');
    	this.add(options.routes);
    	this.log('assign options');
    	assignDeep(this, options);
    	this.log('eventAdd popstate');
    	eventAdd(window, 'popstate', this.popstate, true);
    }
    async updateLocation() {
    	map(location, (item, index) => {
    		if (isString(item)) {
    			this[index] = item;
    		}
    	});
    	this.pathScored = this.pathname.replace(/\//g, '_');
    	this.paths = rest(this.pathname.split('/'));
    	this.pathCamel = camelCase(this.paths.join('_'));
    	this.navHistory.push(this.pathname);
    	this.historyIndex++;
    }
    async compilePath() {
    	const {
    		route, secured, role, path
    	} = this.pathState;
    	this.log(this.pathState);
    	if (route) {
    		this.pathState.path = route();
    	} else if (!path) {
    		this.pathState.path = this.pathname;
    	}
    	if (last(this.pathState.path) !== '/') {
    		this.pathState.path = `${this.pathState.path}/`;
    	}
    	if (this.pathState.path[0] !== '/') {
    		this.pathState.path = `/${this.pathState.path}`;
    	}
    	if (secured) {
    		const securityCheck = Boolean(await this.methods.security(this.match));
    		if (securityCheck) {
    			const success = await this.methods.success();
    			if (role) {
    				this.pathState.path = `${this.pathState.path}${success}/`;
    			}
    		} else {
    			this.pathState.path = `/${await this.methods.fail()}/`;
    		}
    	}
    	this.pathState.path = `/${this.defaults.root}${this.pathState.path}index.js`;
    	this.log('COMPILED PATH', this.pathState.path);
    }
    checkMatch(routeObject) {
    	const check = routeObject.regex.test(app.router.pathname);
    	if (check) {
    		app.router.routeState = routeObject;
    	}
    	app.router.log(check, app.router.pathname, routeObject.regex);
    	return !check;
    }
    async close() {
    	const currentComponent = this.component;
    	if (currentComponent) {
    		console.log('Close Component', this, currentComponent);
    		await app.view.findComponent('navstate').teardown();
    	}
    }
    async process() {
    	const routerThis = this;
    	app.view.fire('router.loading');
    	this.log('Router Loading State');
    	this.updateLocation();
    	this.log(this.routes);
    	mapWhile(this.routes, this.checkMatch);
    	const match = app.router.routeState;
    	this.log('Match found', match);
    	if (match) {
    		await this.close();
    		const {
    			path, route
    		} = match;
    		const secured = hasValue(match.secured) ? match.secured : this.defaults.secured;
    		const role = hasValue(match.role) ? match.role : this.defaults.role;
    		const pathState = {
    			match,
    			secured,
    			role,
    			path,
    			route
    		};
    		this.pathState = pathState;
    		this.match = match;
    		await this.compilePath();
    		await Ractive.sharedSet('currentPath', this.pathname);
    		await Ractive.sharedSet('navState', false);
    		await this.triggerEvents('beforeLoad');
    		this.log('Checking if Model Loaded', match.model);
    		if (match.assets) {
    			if (match.assets.scripts) {
    				await demandJs(match.assets.scripts);
    			}
    		}
    		this.log('match model', pathState.path);
    		let stateModel;
    		try {
    			stateModel = await demandJs(pathState.path);
    		} catch (e) {
    			app.log('Error Navigation File Failed to load', pathState.path);
    			app.log(e);
    			crate.removeItem(pathState.path);
    		}
    		if (!stateModel) {
    			return app.log('ROUTER FAILED TO LOAD');
    		}
    		if (!stateModel.loaded) {
    			stateModel.loaded = true;
    			const onrender = stateModel.component.onrender;
    			const oninit = stateModel.component.oninit;
    			stateModel.component.onrender = function() {};
    			const compiledRender = async function(...args) {
    				cnsl('onrender', 'notify');
    				onrender && (await apply(onrender, this, args));
    				cnsl('onrender END', 'notify');
    				await routerThis.triggerEvents('render', this, args);
    			};
    			stateModel.component.oninit = async function(...args) {
    				cnsl('oninit', 'notify');
    				await routerThis.triggerEvents('beforeInit', this, args);
    				oninit && (await apply(oninit, this, args));
    				console.log(this.rendered);
    				cnsl('oninit END', 'notify');
    				if (this.rendered) {
    					await apply(compiledRender, this, args);
    				} else {
    					this.on('onrender', compiledRender);
    				}
    			};
    		}
    		this.log(stateModel);
    		const initializeComponent = await component(stateModel.component);
    		this.log('component made', initializeComponent);
    		Ractive.components.navstate = initializeComponent;
    		await routerThis.triggerEvents('afterLoad');
    		await Ractive.sharedSet('navState', true);
    	} else {
    		return false;
    	}
    	this.log('Finished processing');
    }
    back() {
    	this.log('Router back State');
    	const navHistory = this.navHistory;
    	if (navHistory.length) {
    		app.router.historyIndex--;
    		window.history.back();
    	}
    }
    forward() {
    	this.log('Router forward State');
    	const navHistory = this.navHistory;
    	if (navHistory.length > this.historyIndex) {
    		app.router.historyIndex++;
    		window.history.forward();
    	}
    }
	}
	app.router = new Router();
	app.view.on({
		'*.routerBack'() {
			app.router.back();
		},
		'*.routerForward'() {
			app.router.forward();
		},
		'*.route'(componentEvent) {
			const {
				original, node
			} = componentEvent;
			let url = componentEvent.get('href') || componentEvent.get('url') || node.getAttribute('href') || node.getAttribute('data-href');
			url = (isFunction(url) && url()) || url;
			original.preventDefault();
			app.router.log(componentEvent, url);
			app.router.pushState(url);
			return false;
		}
	});
})();
