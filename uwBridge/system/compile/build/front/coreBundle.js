(function() {
	const app = {
		events: {},
		start(data) {
			return app.workerRequest('configure', data);
		},
		log(...args) {
			if (app.debug) {
				apply(console.log, console, args);
			}
		},
		security: {
			clear() {
				app.log('Cleanup');
				app.crate.clear();
			}
		},
		utility: window.$
	};
	window.app = app;
	const vStorage = {
		hasLocal: false,
		items: {},
		getItem(key) {
			return vStorage.items[key];
		},
		setItem(key, value) {
			vStorage.items[key] = value;
			return;
		},
		clear() {
			vStorage.storage.items = {};
			return;
		},
		removeItem(key) {
			vStorage.items[key] = null;
			return;
		}
	};
	function hasStorage(storeCheck) {
		try {
			storeCheck().removeItem('TESTING');
			vStorage.hasLocal = true;
		} catch (e) {
			console.log(e);
			vStorage.hasLocal = false;
		}
	}
	hasStorage(() => {
		return localStorage;
	});
	class Crate {
		constructor() {
			this.storage = vStorage.hasLocal ? localStorage : vStorage;
		}
		setItem(key, value) {
			return this.storage.setItem(key, value);
		}
		getItem(key) {
			return this.storage.getItem(key);
		}
		clear() {
			return this.storage.clear();
		}
		removeItem(key) {
			return this.storage.removeItem(key);
		}
	}
	app.crate = new Crate();
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
			hasValue: hasValue$4, promise: promise$1, uid, isString: isString$7
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
		if (!hasValue$4(generatedId)) {
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
		assign: assign$9, querySelector: querySelector$2, map: map$2, hasValue: hasValue$3, isString: isString$6
	} = app.utility;
	const {
		crate: crate$2
	} = app;
	const imported = {};
	const headNode$1 = querySelector$2('head');
	const styleNode = document.createElement('style');
	const loadScript = window.eval;
	const iJson = (contents) => {
		if (contents) {
			return loadScript(`(${contents})`);
		}
		return {};
	};
	const isLibRegex = new RegExp(/^js\/lib\//);
	const checksumReturn = (item) => {
		return crate$2.getItem(`cs-${item}`);
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
		return imported[item];
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
		let skipCheck;
		if (fileContents === true) {
			if (!imported[filename]) {
				fileContents = crate$2.getItem(filename);
			}
		} else if (fileContents !== false) {
			if (app.debug) {
				console.log('SAVE FILE TO LOCAL', fileContents);
			}
			crate$2.setItem(`cs-${filename}`, cs);
			crate$2.setItem(filename, fileContents);
		}
		if (!hasValue$3(imported[filename]) || fileContents !== true) {
			if (!isJs) {
				if (fileContents === false) {
					imported[filename] = {};
				} else {
					imported[filename] = isJson ? iJson(fileContents) : fileContents;
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
		if (isCss && appendCSS && isString$6(imported[filename])) {
			constructStyleTagThenAppendToHead(imported[filename], filename);
			imported[filename] = true;
		}
		if (!skipCheck) {
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
				if (hasValue$3(json.file)) {
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
	assign$9(app, {
		fetchFile
	});
	const {
		assign: assign$8
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
	assign$8(app, {
		request
	});
	const {
		utility: {
			assign: assign$7,
			cnsl: cnsl$3,
			compactMapArray,
			isEmpty: isEmpty$1,
			eachAsync,
			eachObject,
			eachArray,
			isString: isString$5,
			isPlainObject: isPlainObject$2,
			hasValue: hasValue$2,
			drop
		}
	} = app;
	cnsl$3('Initilizing watchers module.', 'notify');
	const watchers = {};
	const watchersRegex = [];
	const onRegex = (type, callable) => {
		const watchObject = {};
		callable.regex = type;
		let number = watchersRegex.push(callable) - 1;
		assign$7(watchObject, {
			_: {
				isWatcher: true
			},
			callable,
			start() {
				if (!hasValue$2(number)) {
					number = watchersRegex.push(callable) - 1;
				}
			},
			stop() {
				if (hasValue$2(number)) {
					drop(watchersRegex, number);
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
		assign$7(watchObject, {
			_: {
				isWatcher: true
			},
			callable,
			start() {
				if (!hasValue$2(number)) {
					number = levelObject.push(callable) - 1;
				}
			},
			stop() {
				if (hasValue$2(number)) {
					drop(levelObject, number);
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
				eachArray(watching, (item) => {
					item.start();
				});
			},
			stop() {
				eachArray(watching, (item) => {
					item.stop();
				});
			},
			watching
		};
		eachObject(object, (item, key) => {
			watching.push(onString(`${prefix}${key}${suffix}`, item));
		});
		return watchCollection;
	};
	const watch$3 = (type, callable) => {
		let method;
		if (isString$5(type)) {
			method = onString;
		} else if (isPlainObject$2(type)) {
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
		if (!isEmpty$1(regexSubscribers)) {
			subscribers.push(...regexSubscribers);
		}
		if (levelObject) {
			subscribers.push(...levelObject);
		}
		console.log(subscribers);
		if (subscribers.length) {
			eachAsync(subscribers, (watcher) => {
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
	assign$7(app.events, {
		_(json) {
			return onUpdate(json.data);
		}
	});
	assign$7(app, {
		push,
		watch: watch$3,
		watchers
	});
	const {
		utility: {
			assign: assign$6,
			hasDot,
			promise,
			last: last$1,
			map: map$1,
			isString: isString$4,
			isPlainObject: isPlainObject$1,
			each: each$9,
			cnsl: cnsl$2,
			initialString,
			restString
		},
		crate: crate$1
	} = app;
	const commaString = ',';
	const buildFilePath = (itemArg) => {
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
			if (app.debug) {
				console.log(item);
			}
		}
		if (restString(item, -3) === '.js') {
			if (app.debug) {
				console.log(item, watch$3);
			}
			if (!watchers[item]) {
				watch$3(item, (thing) => {
					if (app.debug) {
						console.log('Live Reload', thing);
					}
					crate$1.removeItem(thing.name);
					crate$1.removeItem(`cs-${thing.name}`);
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
				assign$6(
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
		if (isPlainObject$1(files)) {
			demandType = objectDemand;
			arrayToObjectMap = {};
			let index = 0;
			each$9(files, (item, key) => {
				arrayToObjectMap[key] = index;
				index++;
				assets.push(buildFilePath(item));
			});
		} else {
			files = isString$4(files) ? files.split(commaString) : files;
			demandType = files.length < 2 ? singleDemand : multiDemand;
			each$9(files, (item) => {
				assets.push(buildFilePath(item));
			});
		}
		const results = await streamAssets(assets, options);
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
			files = map$1(files, (itemArg) => {
				let item = itemArg;
				if (type === 'js' && last$1(item) === '/') {
					item += 'index';
				}
				return `${item}.${type}`;
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
	assign$6(app.events, {
		async setupCompleted(data) {
			cnsl$2('Worker is Ready', 'notify');
			app.systemLanguage = data.language;
			try {
				await demand$4('app/');
			} catch (error) {
				console.log(error);
				crate$1.clear();
				window.location.reload();
			}
		}
	});
	assign$6(app, {
		demand: demand$4,
		demandCss: demandCss$1,
		demandHtml: demandHtml$1,
		demandJs: demandJs$1,
		demandLang
	});
	const spawnNotification = (data) => {};
	app.notify = async (data) => {
		if (Notification.permission === 'granted') {
			return spawnNotification();
		} else if (Notification.permission !== 'denied') {
			await Notification.requestPermission();
		}
	};
	const {
		utility: {
			debounce, eventAdd: eventAdd$1, isAgent, info, model, assign: assign$5
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
			assign$5(Ractive.sharedGet(), {
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
	window.Ractive.prototype.data = {
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
	const {
		utility: {
			findIndex,
			hasValue: hasValue$1,
			get: get$1,
			isPlainObject,
			findItem,
			assignDeep: assignDeep$1,
			ensureArray: ensureArray$1,
			assign: assign$4,
			each: each$8,
			isArray: isArray$1,
			isEmpty,
			sortNewest,
			sortOldest,
			clear
		}
	} = app;
	const extendRactive = {
		async afterIndex(path, indexMatch, item, indexName) {
			const index = findIndex(this.get(path), indexMatch, indexName);
			if (hasValue$1(index)) {
				await this.splice(path, index + 1, 0, ...ensureArray$1(item));
			} else {
				await this.push(path, item);
			}
		},
		async assign(path, mergeObject) {
			const item = this.get(path);
			if (hasValue$1(item)) {
				assignDeep$1(item, mergeObject);
				await this.update(path);
				return item;
			}
		},
		async beforeIndex(path, indexMatch, item, indexName) {
			const index = findIndex(this.get(path), indexMatch, indexName);
			if (hasValue$1(index)) {
				await this.splice(path, index - 1, 0, ...ensureArray$1(item));
			} else {
				await this.push(path, item);
			}
		},
		async clearArray(path) {
			const arrayToClear = this.get(path);
			if (arrayToClear) {
				clear(arrayToClear);
				await this.update(path);
			}
		},
		findItem(path, indexMatch, indexName) {
			const item = find(this.get(path), indexMatch, indexName);
			if (hasValue$1(item)) {
				return item;
			}
		},
		getIndex(path, indexMatch, indexName) {
			const index = findIndex(this.get(path), indexMatch, indexName);
			if (hasValue$1(index)) {
				return index;
			}
		},
		async mergeItem(path, indexMatch, newVal, indexName) {
			const item = findItem(this.get(path), indexMatch, indexName);
			if (hasValue$1(item)) {
				assignDeep$1(item, newVal);
				await this.update(path);
				return item;
			}
		},
		async removeIndex(path, indexMatch, indexName) {
			const index = findIndex(this.get(path), indexMatch, indexName);
			if (hasValue$1(index)) {
				await this.splice(path, index, 1);
			}
		},
		async setIndex(path, indexMatch, item, indexName, optionsArg) {
			const options = optionsArg || {};
			const index = findIndex(this.get(path), indexMatch, indexName);
			if (hasValue$1(index)) {
				const pathSuffix = options.pathSuffix ? `.${options.pathSuffix}` : '';
				await this.set(`${path}.${index}${pathSuffix}`, item);
			} else if (get$1('conflict', options) === 'insert') {
				await this[get$1('conflictMethod', options) || 'push'](path, item);
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
		async syncCollection(path, newValArg, type = 'push', indexName = 'id') {
			const oldVal = this.get(path);
			if (isPlainObject(oldVal)) {
				assignDeep$1(oldVal, newValArg);
			} else {
				const newVal = ensureArray$1(newValArg);
				each$8(newVal, (item) => {
					const oldValItem = findItem(oldVal, item[indexName], indexName);
					if (hasValue$1(oldValItem)) {
						assign$4(oldValItem, item);
					} else {
						oldVal[type](item);
					}
				});
			}
			await this.update(path);
		},
		async toggleIndex(path, indexMatchArg, pathSuffixArg, indexName) {
			let indexMatch;
			const arrayCheck = isArray$1(indexMatchArg);
			if (arrayCheck && !isEmpty(indexMatchArg)) {
				indexMatch = indexMatchArg.shift();
			} else {
				indexMatch = indexMatchArg;
			}
			const index = findIndex(this.get(path), indexMatch, indexName);
			if (hasValue$1(index)) {
				const pathSuffix = pathSuffixArg ? `.${pathSuffixArg}` : '';
				await this.toggle(`${path}.${index}${pathSuffix}`);
			}
			if (arrayCheck && !isEmpty(indexMatchArg)) {
				await this.toggleIndex(path, indexMatchArg, pathSuffixArg, indexName);
			}
		},
		async updateItem(path, indexMatch, react, indexName) {
			const item = findItem(this.get(path), indexMatch, indexName);
			if (hasValue$1(item)) {
				react(item);
				await this.update(path);
				return item;
			}
		}
	};
	assign$4(Ractive.prototype, extendRactive);
	const getComponentName = (componentModel, componentName) => {
		return componentModel === app.router.currentStateObject ? 'navState' : componentName;
	};
	const {
		watch: watch$2,
		demand: demand$3,
		utility: {
			each: each$7, isFunction: isFunction$1
		},
		crate
	} = app;
	const onHtml = async (matchFilename, componentName, json) => {
		const type = json.type;
		const filePath = json.name;
		if (app.debug) {
			console.log('WATCH HTML', matchFilename, json);
		}
		if (!filePath.includes(matchFilename)) {
			return;
		}
		const html = await demand$3(filePath);
		crate.setItem(filePath, html);
		if (app.debug) {
			console.log(type, filePath, html);
		}
		if (isFunction$1(componentName)) {
			componentName(html);
		} else {
			each$7(app.view.findAllComponents(componentName), (item) => {
				if (app.debug) {
					console.log(item);
				}
				item.resetTemplate(html);
			});
		}
		window.UIkit.update(document.body, 'update');
	};
	const watchHtml = (matchFilename, componentName) => {
		if (app.debug) {
			console.log('WATCH HTML', matchFilename);
		}
		return watch$2(matchFilename, (json) => {
			onHtml(matchFilename, componentName, json);
		});
	};
	watch$2.html = watchHtml;
	const {
		utility: {
			each: each$6
		}
	} = app;
	const importPartials = (componentName, componentModel, asset) => {
		if (asset.partials) {
			each$6(asset.partials, (item, key) => {
				watchHtml(item.includes('.html') ? item : `${item}.html`, (html) => {
					const realName = getComponentName(componentModel, componentName);
					each$6(app.view.findAllComponents(realName), (subItem) => {
						subItem.resetPartial(key, html);
					});
				});
			});
		}
	};
	const importTemplate = (componentName, componentModel, asset) => {
		let template = asset.template;
		if (!template.includes('.html') && !template.includes('.hbs') && !template.includes('.mustache')) {
			template = asset.template = asset.template = `${template}.html`;
		}
		if (template) {
			watchHtml(template, (html) => {
				const realName = getComponentName(componentModel, componentName);
				if (realName) {
					const matchedComponent = app.view.findComponent(realName);
					if (matchedComponent) {
						matchedComponent.resetTemplate(html);
					}
				}
			});
		}
	};
	const {
		utility: {
			each: each$5, isString: isString$3, isArray, apply: apply$3
		}
	} = app;
	const logMulti = console;
	function debugMultiEvent(...args) {
		if (app.debug || app.debugMultiEvent) {
			apply$3(logMulti.log, logMulti, args);
		}
	}
	const multiEvent = (currentView, componentEvent, events, ...args) => {
		debugMultiEvent(currentView, componentEvent, events);
		debugMultiEvent(args);
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
			} else if (isArray(events)) {
				each$5(events, (item) => {
					if (item) {
						each$5(item.split(','), (subItem) => {
							if (subItem) {
								currentView.fire(subItem.trim(), componentEvent, ...args);
							}
						});
					}
				});
			}
		}
	};
	const {
		utility: {
			each: each$4, assign: assign$3, querySelector: querySelector$1
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
	assign$3(app, {
		componentsWithCss,
		importedCss,
		importedCssCount
	});
	const {
		watch: watch$1,
		utility: {
			each: each$3, get, apply: apply$2
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
			methods
		} = item;
		const createMethod = methods.create || 'push';
		const readMethod = methods.read || 'push';
		prefix = prefix ? `${prefix}.` : '';
		suffix = suffix ? `.${suffix}` : '';
		item.prefix = prefix;
		item.suffix = suffix;
		currentView.watchers[key] = watch$1(
			{
				async create(json) {
					await currentView.syncCollection(key, json.item, createMethod);
					currentView.fire(`${prefix}create${suffix}`, json.item, json);
				},
				async delete(json) {
					await currentView.removeIndex(key, json.item.id);
					currentView.fire(`${prefix}delete${suffix}`, json.item, json);
				},
				async read(json) {
					await currentView.syncCollection(key, json.items, readMethod);
					currentView.fire(`${prefix}read${suffix}`, json.item, json);
				},
				async update(json) {
					await currentView.syncCollection(key, json.item, createMethod);
					currentView.fire(`${prefix}update${suffix}`, json.item, json);
				}
			},
			item.options
		);
	};
	const removeInstance = function(currentView, css) {
		cssUnrender(css);
		each$3(currentView.watchers, (item, key) => {
			item.stop();
			item[key] = null;
		});
	};
	const onrenderInstance = function(currentView, css) {
		cssRender(css);
		if (currentView.watchers) {
			each$3(currentView.watchers, (item) => {
				item.start();
			});
		}
	};
	const buildComponentEvents = function(componentConfig) {
		const {
			css, watchers
		} = componentConfig;
		const thisComponent = this;
		thisComponent.watchers = watchers ? watchers(thisComponent) : {};
		if (thisComponent.watchers) {
			each$3(thisComponent.watchers, (item, key) => {
				createWatchers(thisComponent, item, key);
			});
		}
		thisComponent.on({
			multi(cmpntEvent, ...args) {
				if (app.debug) {
					console.log(cmpntEvent, ...args);
				}
				return multiEvent(this, cmpntEvent, ...args);
			},
			render() {
				return onrenderInstance(this, css);
			},
			teardown() {
				return removeInstance(this, css);
			}
		});
	};
	const onConstruct = function(componentConfig) {
		const sourceConstruct = componentConfig.onconstruct;
		componentConfig.onconstruct = function(...args) {
			apply$2(buildComponentEvents, this, [componentConfig, ...args]);
			if (sourceConstruct) {
				return apply$2(sourceConstruct, this, args);
			}
		};
		const sourceRender = componentConfig.onrender;
		componentConfig.onrender = function(...args) {
			if (sourceRender) {
				return apply$2(sourceRender, this, args);
			}
		};
	};
	const {
		utility: {
			cnsl: cnsl$1, assign: assign$2
		}
	} = app;
	cnsl$1('viewSetup Module', 'notify');
	const initializeComponent = (componentConfig) => {
		componentConfig.decorators = assign$2(componentConfig.decorators || {}, {});
		const {
			css, model: componentModel, asset, name: componentName
		} = componentConfig;
		registerCssComponent(css, componentConfig);
		if (asset && (componentName || componentModel)) {
			importTemplate(componentName, componentModel, asset);
			importPartials(componentName, componentModel, asset);
		}
		onConstruct(componentConfig);
	};
	const {
		utility: {
			omit
		}
	} = app;
	const buildComponent = (componentConfig) => {
		initializeComponent(componentConfig);
		const {
			name: componentName, model
		} = componentConfig;
		const cmpntConfigClean = omit(componentConfig, ['css', 'asset']);
		if (componentConfig.CSS) {
			cmpntConfigClean.css = componentConfig.CSS;
		}
		const Component = Ractive.extend(cmpntConfigClean);
		if (componentName) {
			Ractive.components[componentName] = Component;
		}
		if (model) {
			model.component = Component;
		}
		return Component;
	};
	const {
		demand: demand$2,
		demandCss,
		demandHtml,
		utility: {
			assign: assign$1, each: each$2, ensureArray, isString: isString$2
		}
	} = app;
	const asyncComponent = async function(componentConfig) {
		const componentModel = componentConfig.model;
		let asset = componentConfig.asset || {};
		if (isString$2(asset)) {
			asset = {
				css: [`${asset}style`],
				template: `${asset}template`
			};
		}
		componentConfig.asset = asset;
		componentConfig.css = componentConfig.css || {};
		componentConfig.partials = componentConfig.partials || {};
		if (asset) {
			if (asset.template) {
				componentConfig.template = await demandHtml(asset.template);
			}
			if (asset.demand) {
				componentConfig.demand = await demand$2(asset.demand);
			}
			if (asset.partials) {
				assign$1(componentConfig.partials, await demandHtml(asset.partials));
			}
			if (asset.css) {
				const assetCss = asset.css;
				const loadCss = await demandCss(assetCss);
				each$2(ensureArray(loadCss), (item, index) => {
					let keyName = assetCss[index];
					if (!keyName.includes('.css')) {
						keyName = `${keyName}.css`;
					}
					componentConfig.css[keyName] = item;
				});
			}
		}
		const componentPromise = buildComponent(componentConfig);
		if (componentModel) {
			componentModel.component = componentPromise;
		}
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
		demand: demand$1,
		watch,
		utility: {
			each: each$1, querySelector, isDom
		}
	} = app;
	const onCss = async (json) => {
		const filePath = json.name;
		const componentName = json.type;
		const componentsUsingCss = componentsWithCss[filePath];
		console.log('CSS UPDATE', filePath, componentsUsingCss);
		const node = importedCss[filePath] || importedCss[componentName] || querySelector(`[data-src="${filePath}"]`);
		if (node || componentsUsingCss) {
			const content = await demand$1(filePath);
			if (isDom(node)) {
				node.innerHTML = content;
			}
			if (componentsUsingCss) {
				each$1(componentsUsingCss, (item) => {
					console.log(item);
					item.css[filePath] = content;
				});
			}
		}
	};
	watch(/\.css/, onCss);
	const {
		demand,
		utility: {
			assign, each, isFunction
		}
	} = app;
	const view = new Ractive({
		data() {
			return {
				notification: [],
				screenSize: ''
			};
		},
		template: `{{#@shared.components.main:key}}{{>getComponent(key)}}{{/}}`
	});
	view.on({
		async '*.loadComponent'(componentEvent) {
			const imported = await demand(componentEvent.get('demand'));
			const afterDemand = componentEvent.get('afterDemand');
			if (afterDemand) {
				const afterDemandEvents = afterDemand[componentEvent.original.type];
				each(afterDemandEvents, (item, key) => {
					if (isFunction(item)) {
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
			await Ractive.sharedSet('components', {
				dynamic: {},
				layout: {},
				main: {}
			});
			await app.initializeScreen();
			await view.render('body');
		},
		view
	});
	localStorage.clear();
	const {
		demandJs,
		utility: {
			cnsl, assignDeep, mapArray, map, isString, rest, camelCase, eventAdd, apply: apply$1, isRegExp, mapWhile, ifInvoke, hasValue, last
		},
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
    defaults = {
    	protected: false,
    	role: false
    };
    state;
    log(...args) {
    	if (this.debug || app.debug) {
    		apply$1(console.log, console, args);
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
    	await this.process();
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
    				this.pathState.path = `${path}${success}/`;
    			}
    		} else {
    			this.pathState.path = `/${await this.methods.fail()}/`;
    		}
    	}
    	this.pathState.path = `/${this.defaults.root}${this.pathState.path}index`;
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
    		this.component = null;
    	}
    }
    async process() {
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
    		await Ractive.sharedSet('@shared.currentPath', this.pathname);
    		await Ractive.sharedSet('navState', false);
    		this.log('Checking if Model Loaded', match.model);
    		if (!match.model) {
    			if (match.assets) {
    				if (match.assets.scripts) {
    					await demandJs(match.assets.scripts);
    				}
    			}
    			this.log('match model', pathState.path);
    			match.model = await demandJs(pathState.path);
    			this.log(match.model);
    		}
    		this.state = match;
    		const initializeComponent = await component(match.model.component);
    		this.log('component made', initializeComponent);
    		Ractive.components.navstate = initializeComponent;
    		ifInvoke(match.model.open);
    		ifInvoke(this.methods.onLoad);
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
    		router.historyIndex--;
    		window.history.back();
    	}
    }
    forward() {
    	this.log('Router forward State');
    	const navHistory = this.navHistory;
    	if (navHistory.length > this.historyIndex) {
    		router.historyIndex++;
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
			const url = componentEvent.get('href') || node.getAttribute('href') || node.getAttribute('data-href');
			original.preventDefault();
			app.router.log(componentEvent, url);
			app.router.pushState(url);
			return false;
		}
	});
})();
