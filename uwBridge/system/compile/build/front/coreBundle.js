(function() {
	const {
		isPlainObject: isPlainObject$3, virtualStorage, crate: crate$4, hasValue: hasValue$6
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
			if (hasValue$6(keyValue)) {
				return Ractive.sharedSet(keyPath, keyValue);
			} else if (isPlainObject$3(keyPath)) {
				return Ractive.sharedSet(keyPath);
			}
			return Ractive.sharedGet(keyPath);
		},
		store: virtualStorage(),
		crate: crate$4(),
		utility: $,
		modules: {}
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
		console.log(requestName, dataArg);
		let compiledRequest;
		let callbackOptional;
		if (dataArg) {
			compiledRequest = {
				data: dataArg,
				request: requestName
			};
		} else {
			compiledRequest = requestName;
			callbackOptional = requestName.callback;
		}
		const requestObject = {
			data: compiledRequest.data,
			request: compiledRequest.request
		};
		if (requestObject.data.id) {
			return mainWorker.postMessage(requestObject);
		}
		const uniq = uid();
		// console.log(uniq, callbackOptional);
		requestObject.id = uniq;
		return promise$1((accept) => {
			app.events[uniq] = async function(responseData) {
				if (callbackOptional) {
					await callbackOptional(responseData);
				}
				accept(responseData);
			};
			mainWorker.postMessage(requestObject);
		});
	};
	const workerMessage = (workerEvent) => {
		console.log(workerEvent.data);
		const eventData = workerEvent.data;
		const {
			id, data
		} = eventData;
		let generatedId = id;
		if (!hasValue$5(generatedId)) {
			generatedId = '_';
		}
		if (!app.events[generatedId]) {
			console.log(generatedId);
		}
		console.log(app.events[generatedId], data);
		app.events[generatedId](data);
		if (!eventData.keep && !isString$7(generatedId)) {
			console.log('DONT KEEP', eventData, generatedId);
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
			assign: assign$7, querySelector: querySelector$2, map: map$2, hasValue: hasValue$4, isString: isString$6, jsonParse
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
					const moduleExports = assign$7({}, await import(fileBlob));
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
	assign$7(app, {
		fetchFile
	});
	const { assign: assign$6 } = app.utility;
	const request = async (requestName, data) => {
		const requestPackage = data ?
			{
				data,
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
		}
		return workerRequest(workerPackage);
	};
	assign$6(app, {
		request
	});
	const {
		utility: {
			assign: assign$5,
			cnsl: cnsl$3,
			eachAsync: eachAsync$2,
			isString: isString$5,
			hasValue: hasValue$3,
			isRegExp: isRegExp$1,
			drop: drop$1
		}
	} = app;
	cnsl$3('Initializing watchers module.', 'notify');
	class Watcher {
    static containerRegex = [];
    static containerPrimary = {};
    static status = true;
    static start() {
    	Watcher.status = true;
    }
    static stop() {
    	Watcher.status = false;
    }
    static async update(json) {
    	console.log(json);
    	if (!Watcher.status || !json) {
    		return;
    	}
    	const {
    		type, name: dataName
    	} = json;
    	const levelObject = Watcher.containerPrimary[type] || Watcher.containerPrimary[dataName];
    	await eachAsync$2(Watcher.containerRegex, async (watcher) => {
    		if (watcher.eventName.test(type) || watcher.eventName.test(dataName)) {
    			return watcher.eventAction(json);
    		}
    	});
    	await eachAsync$2(levelObject, async (watcher) => {
    		return watcher.eventAction(json);
    	});
    }
    constructor(eventName, eventAction) {
    	if (isString$5(eventName)) {
    		if (!Watcher.containerPrimary[eventName]) {
    			Watcher.containerPrimary[eventName] = [];
    		}
    		this.eventType = 'string';
    	} else if (isRegExp$1(eventName)) {
    		this.eventType = 'regex';
    	}
    	this.eventName = eventName;
    	this.eventAction = eventAction.bind(this);
    	this.start();
    }
    container() {
    	if (this.eventType === 'string') {
    		return Watcher.containerPrimary[this.eventName];
    	} else if (this.eventType === 'regex') {
    		return Watcher.containerRegex;
    	}
    }
    isWatcher = true;
    eventAction;
    id;
    active;
    start() {
    	if (!hasValue$3(this.id)) {
    		this.id = this.container().push(this) - 1;
    		this.active = true;
    	}
    }
    stop() {
    	if (hasValue$3(this.id)) {
    		drop$1(this.container(), this.id);
    		this.id = null;
    		this.active = false;
    	}
    }
	}
	function watch$3(...args) {
		return new Watcher(...args);
	}
	const push = (requestName, data) => {
		return request({
			data,
			id: '_',
			request: requestName
		});
	};
	assign$5(app.events, {
		_(json) {
			return Watcher.update(json.data);
		}
	});
	assign$5(app, {
		push,
		watch: watch$3,
		Watcher
	});
	const {
		utility: {
			assign: assign$4,
			hasDot,
			promise,
			last: last$1,
			map: map$1,
			isString: isString$4,
			isPlainObject: isPlainObject$2,
			each: each$6,
			cnsl: cnsl$2,
			initialString,
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
			// app.log(item);
		}
		if (getFileExtension$1(item) === 'js') {
			// app.log(item, watch);
			if (!Watcher.containerPrimary[item]) {
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
				assign$4(
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
		// app.log(results);
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
	assign$4(app.events, {
		async ready(data) {
			cnsl$2('Worker is Ready', 'notify');
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
	assign$4(app, {
		demand: demand$4,
		demandCss: demandCss$1,
		demandHtml: demandHtml$1,
		demandJs: demandJs$1,
		demandLang
	});
	const { utility: { drop } } = app;
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
			debounce, eventAdd: eventAdd$1, isAgent, compactKeys, pluckObject
		},
		componentStore
	} = app;
	async function updateResize() {
		app.utility.saveDimensions();
		const info = app.utility.info;
		await componentStore(info);
		const orientation = (screen.orientation || {}).type || screen.mozOrientation || screen.msOrientation;
		const width = info.windowWidth;
		const height = info.windowHeight;
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
		await componentStore('classList.screenSize', screenSize);
		await componentStore('widthLevel', widthLevel);
		if (orientation) {
			await componentStore('classList.orientation', orientation);
		}
		if (height > width) {
			await componentStore('classList.orientationBasic', 'portrait');
		} else if (width > height) {
			await componentStore('classList.orientationBasic', 'landscape');
		} else if (width === height) {
			await componentStore('classList.orientationBasic', 'perfectSquare');
		}
		app.view.fire('classTrigger');
	}
	const updateResizeAnimationFrame = () => {
		requestAnimationFrame(updateResize);
	};
	app.updateResizeAnimationFrame = updateResizeAnimationFrame;
	const updateResizeDebounce = debounce(app.updateResizeAnimationFrame, 250);
	app.updateResizeDebounce = updateResizeDebounce;
	app.updateResize = updateResize;
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
			await componentStore('classes.mobile', true);
			await componentStore('mobile', true);
		}
		if (isTablet) {
			await componentStore('classes.tablet', true);
			await componentStore('tablet', true);
		}
		if (!isMobile && !isTablet) {
			await componentStore('classes.desktop', true);
			await componentStore('desktop', true);
		}
		await componentStore('classes.chrome', isAgent.chrome);
		await componentStore('classes.android', isAgent.android);
		await componentStore('classes.linux', isAgent.linux);
		await componentStore('classes.mozilla', isAgent.mozilla);
		await componentStore('classes.applewebkit', isAgent.applewebkit);
		app.computeLayoutClasses();
		await app.updateResize();
		eventAdd$1(window, 'resize', updateResizeDebounce, true);
	};
	app.computeLayoutClasses = function() {
		console.log('INFO UPDATED');
		const classes = compactKeys(componentStore('classes'));
		const classList = componentStore('classList');
		classes.push(...pluckObject(classList, compactKeys(classList)));
		document.body.className = classes.join(' ');
	};
	const { utility: { assign: assign$3 } } = app;
	const methods = {
		get $() {
			return app.utility;
		},
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
			mapAsync,
			isFunction: isFunction$3,
			apply: apply$2
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
	function getPropertyName(propertyName, options = {}) {
		return propertyName || options.id || app.idProperty || 'id';
	}
	function getIndexValue(item, propertyName) {
		const indexValue = isPlainObject$1(item) ? item[propertyName] : item;
		return indexValue;
	}
	function getItem(context, keypath, indexValue, propertyName) {
		const item = findItem(context.get(keypath), indexValue, propertyName);
		return item;
	}
	function getIndex(context, keypath, indexValue, propertyName) {
		const index = findIndex(context.get(keypath), indexValue, propertyName);
		return index;
	}
	function getIndexPath(context, keypath, indexValue, propertyName) {
		const index = findIndex(context.get(keypath), indexValue, propertyName);
		return index ? `${keypath}.${index}` : false;
	}
	// drop dropRight removeBy right
	async function setByIndex(context, keypath, item, indexValue, propertyName, addBy = 1) {
		const index = findIndex(context.get(keypath), indexValue, propertyName);
		if (hasValue$2(index)) {
			return context.splice(`${keypath}.${index}`, index + addBy, 0, ...ensureArray$1(item));
		} else {
			return context.push(keypath, item);
		}
	}
	async function setAtIndex(context, keypath, item, indexValue, propertyName) {
		const indexPath = getIndexPath(context.get(keypath), indexValue, propertyName);
		if (hasValue$2(indexPath)) {
			return context.set(indexPath, item);
		}
	}
	async function syncItem(context, collection, item, addMethod = 'push', propertyName, mergeArrays, removeMethod) {
		const indexValue = getIndexValue(item, propertyName);
		const index = findIndex(collection, indexValue, propertyName);
		if (index) {
			if (addMethod === 'remove') {
				if (isFunction$3(removeMethod)) {
					return apply$2(removeMethod, context, [index, item]);
				}
				return collection.splice(index, 1);
			} else {
				assignDeep$1(collection[index], item, mergeArrays);
			}
		}
		return collection[addMethod](item);
	}
	const extendRactive = {
		async merge(keypath, source = {}, options) {
			const path = assemblePath(keypath, options);
			const target = this.get(path);
			if (hasValue$2(target)) {
				assignDeep$1(target, source);
				await this.update(path);
			}
			return target;
		},
		async setAtIndex(keypath, item, propertyNameArg, options) {
			const path = assemblePath(keypath, options);
			const propertyName = getPropertyName(propertyNameArg, options);
			const indexValue = getIndexValue(item, propertyName);
			return setAtIndex(this, path, item, indexValue, propertyName);
		},
		async setByIndex(keypath, item, propertyNameArg, positionMod, options) {
			const path = assemblePath(keypath, options);
			const propertyName = getPropertyName(propertyNameArg, options);
			const indexValue = getIndexValue(item, propertyName);
			return setByIndex(this, path, item, indexValue, propertyName, positionMod);
		},
		async removeByIndex(keypath, item, propertyNameArg, upto = 1, options) {
			const path = assemblePath(keypath, options);
			const propertyName = getPropertyName(propertyNameArg, options);
			const index = getIndex(this, keypath, item, propertyName);
			if (hasValue$2(index)) {
				return this.splice(path, index, upto);
			}
		},
		getIndexPath(keypath, item, propertyNameArg, options) {
			const path = assemblePath(keypath, options);
			const propertyName = getPropertyName(propertyNameArg, options);
			const indexValue = getIndexValue(item, propertyName);
			return getIndexPath(this, path, indexValue, propertyName);
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
		getItem(keypath, indexMatch, propertyNameArg, options) {
			const path = assemblePath(keypath, options);
			const propertyName = getPropertyName(propertyNameArg, options);
			const indexValue = getIndexValue(indexMatch, propertyName);
			return getItem(this, path, indexValue, propertyName);
		},
		getIndex(keypath, indexMatch, propertyNameArg, options) {
			const path = assemblePath(keypath, options);
			const propertyName = getPropertyName(propertyNameArg, options);
			const indexValue = getIndexValue(indexMatch, propertyName);
			return getIndex(this, path, indexValue, propertyName);
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
		async syncItem(keypath, item, options = {}) {
			const {
				addMethod, id, mergeArrays, removeMethod
			} = options;
			const path = assemblePath(keypath, options);
			const collection = this.get(path);
			const propertyName = getPropertyName(id, options);
			app.log(item, path, collection, propertyName);
			await syncItem(this, collection, item, addMethod, propertyName, mergeArrays, removeMethod);
			return this.update(path);
		},
		async syncCollection(keypath, items, options = {}) {
			const source = this;
			app.log(keypath, items, options);
			const {
				addMethod, id, mergeArrays, removeMethod
			} = options;
			const path = assemblePath(keypath, options);
			const propertyName = getPropertyName(id, options);
			const collection = this.get(path);
			let results;
			console.log(source, path, collection, items, addMethod, propertyName, mergeArrays, removeMethod);
			if (isArray$1(items)) {
				results = await mapAsync(items, async (item) => {
					return syncItem(source, collection, item, addMethod, propertyName, mergeArrays, removeMethod);
				});
			} else {
				results = await syncItem(source, collection, items, addMethod, propertyName, mergeArrays, removeMethod);
			}
			this.update(path);
			return results;
		},
		async toggleByIndex(keypath, item, propertyNameArg, options) {
			const path = assemblePath(keypath, options);
			const propertyName = getPropertyName(propertyNameArg, options);
			const indexValue = getIndexValue(item, propertyName);
			const indexPath = getIndexPath(this, path, indexValue, propertyName);
			if (hasValue$2(indexPath)) {
				await this.toggle(indexPath);
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
			const { original } = componentEvent;
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
		const { idProperty } = item.options;
		const { methods } = item;
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
			eachAsync: eachAsync$1, ensureArray, isString: isString$2, getFileExtension, hasValue: hasValue$1, eachObjectAsync, isKindAsync
		}
	} = app;
	function buildFilePath(template, extType = 'html') {
		const templateExt = template && getFileExtension(template);
		return (!templateExt && `${template}.${extType}`) || template;
	}
	const asyncComponent = async function(componentConfig) {
		const { data } = componentConfig;
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
				// app.log('Async Template COMPILED URL', asset.template);
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
					// app.log('compiled css path', compiledCssPath);
					componentConfig.styles[compiledCssPath] = await demandCss(compiledCssPath);
				});
			}
		}
		if (data && isKindAsync(data)) {
			componentConfig.data = await data(componentConfig);
		}
		const componentPromise = await buildComponent(componentConfig);
		// app.log('Async Component Config', componentConfig);
		return componentPromise;
	};
	const { utility: { isString: isString$1 } } = app;
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
		// app.log(componentConfig);
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
			assign, each: each$1, isFunction: isFunction$1, cnsl: cnsl$1
		}
	} = app;
	Ractive.sharedData.classes = {};
	Ractive.sharedData.classList = {};
	const view = new Ractive({
		template: `{{#@shared.components.main:key}}{{>getComponent(key)}}{{/}}`,
		async oninit() {
			cnsl$1('App Initialize Component', 'warning');
			const source = this;
			await app.initializeScreen();
			source.on('@shared.sizeTrigger', () => {
				app.computeLayoutClasses();
			});
			source.observe('@shared.classes', () => {
				app.computeLayoutClasses();
			});
			source.observe('@shared.classList', () => {
				app.computeLayoutClasses();
			});
		},
		async onrender() {
			app.computeLayoutClasses();
		}
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
			const { original } = context;
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
			each,
			restString
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
    	render: [],
    	compile: []
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
    	// console.log(bindThis, this.events[eventName], eventName, args);
    	return eachAsync(bindThis.events[eventName], async (eventItem) => {
    		await apply(eventItem, optionalBind, args);
    	});
    }
    safePathAdd(baseArg) {
    	let fullPath = baseArg;
    	if (last(fullPath) !== '/') {
    		fullPath = `${fullPath}/`;
    	}
    	if (fullPath[0] === '/') {
    		fullPath = restString(fullPath);
    	}
    	return fullPath;
    }
    url(baseArg, addPath) {
    	let fullPath = baseArg;
    	if (last(fullPath) !== '/') {
    		fullPath = `${fullPath}/`;
    	}
    	if (fullPath[0] !== '/') {
    		fullPath = `/${fullPath}`;
    	}
    	return baseArg + this.safePathAdd(addPath);
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
    	// app.router.log('Install Route', routeModel);
    	const { match } = routeModel;
    	if (match) {
    		routeModel.regex = isRegExp(match) ? match : new RegExp(match);
    	}
    	return app.router.routes.push(routeModel);
    }
    add(item) {
    	// this.log('add routes', item);
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
    	// app.router.log(check, app.router.pathname, routeObject.regex);
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
    	this.log('Router Loading State', location.pathname);
    	this.updateLocation();
    	// this.log(this.routes);
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
    		const stateComponent = assignDeep({}, stateModel.component);
    		await this.triggerEvents('beforeLoad', stateComponent);
    		const onrender = stateComponent.onrender;
    		const oninit = stateComponent.oninit;
    		stateComponent.onrender = function() {};
    		const compiledRender = async function(...args) {
    			cnsl('onrender', 'notify');
    			onrender && (await apply(onrender, this, args));
    			cnsl('onrender END', 'notify');
    			await routerThis.triggerEvents('render', this, args);
    		};
    		stateComponent.oninit = async function(...args) {
    			cnsl('oninit', 'notify');
    			await routerThis.triggerEvents('beforeInit', this, args);
    			oninit && (await apply(oninit, this, args));
    			cnsl('oninit END', 'notify');
    			if (this.rendered) {
    				await apply(compiledRender, this, args);
    			} else {
    				this.on('onrender', compiledRender);
    			}
    		};
    		await this.triggerEvents('compile', stateComponent);
    		// this.log(stateModel);
    		const initializeComponent = await component(stateComponent);
    		// this.log('component made', initializeComponent);
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
