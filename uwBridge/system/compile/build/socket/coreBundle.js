(function() {
	const app = window.app;
	const security = {
		clear() {
			console.log('Cleanup');
		}
	};
	security.clear();
	app.security = security;
	const {
		utility: {
			debounce, eventAdd: eventAdd$1, isAgent, info, model
		}
	} = app;
	const updateResize = debounce(async () => {
		await Ractive.sharedSet(info);
		const width = info.windowWidth;
		let screenSize;
		if (isAgent.mobile) {
			screenSize = 'mobileScreen';
		} else if (width < 740) {
			screenSize = 'tinyScreen';
		} else if (width < 1024) {
			screenSize = 'smallScreen';
		} else if (width < 1920) {
			screenSize = 'mediumScreen';
		} else if (width < 3000) {
			screenSize = 'hdScreen';
		} else if (width > 3000) {
			screenSize = '4kScreen';
		}
		console.log(screenSize);
		await Ractive.sharedSet('screenSize', screenSize);
	}, 250);
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
	model('smoothScroll', smoothScroll);
	updateResize();
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
			hasValue,
			get: get$1,
			isPlainObject,
			findItem,
			assignDeep,
			ensureArray: ensureArray$1,
			assign: assign$5,
			each: each$9,
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
			if (hasValue(index)) {
				await this.splice(path, index + 1, 0, ...ensureArray$1(item));
			} else {
				await this.push(path, item);
			}
		},
		async assign(path, mergeObject) {
			const item = this.get(path);
			if (hasValue(item)) {
				assignDeep(item, mergeObject);
				await this.update(path);
				return item;
			}
		},
		async beforeIndex(path, indexMatch, item, indexName) {
			const index = findIndex(this.get(path), indexMatch, indexName);
			if (hasValue(index)) {
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
			if (hasValue(item)) {
				return item;
			}
		},
		getIndex(path, indexMatch, indexName) {
			const index = findIndex(this.get(path), indexMatch, indexName);
			if (hasValue(index)) {
				return index;
			}
		},
		async mergeItem(path, indexMatch, newVal, indexName) {
			const item = findItem(this.get(path), indexMatch, indexName);
			if (hasValue(item)) {
				assignDeep(item, newVal);
				await this.update(path);
				return item;
			}
		},
		async removeIndex(path, indexMatch, indexName) {
			const index = findIndex(this.get(path), indexMatch, indexName);
			if (hasValue(index)) {
				await this.splice(path, index, 1);
			}
		},
		async setIndex(path, indexMatch, item, indexName, optionsArg) {
			const options = optionsArg || {};
			const index = findIndex(this.get(path), indexMatch, indexName);
			if (hasValue(index)) {
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
				assignDeep(oldVal, newValArg);
			} else {
				const newVal = ensureArray$1(newValArg);
				each$9(newVal, (item) => {
					const oldValItem = findItem(oldVal, item[indexName], indexName);
					if (hasValue(oldValItem)) {
						assign$5(oldValItem, item);
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
			if (hasValue(index)) {
				const pathSuffix = pathSuffixArg ? `.${pathSuffixArg}` : '';
				await this.toggle(`${path}.${index}${pathSuffix}`);
			}
			if (arrayCheck && !isEmpty(indexMatchArg)) {
				await this.toggleIndex(path, indexMatchArg, pathSuffixArg, indexName);
			}
		},
		async updateItem(path, indexMatch, react, indexName) {
			const item = findItem(this.get(path), indexMatch, indexName);
			if (hasValue(item)) {
				react(item);
				await this.update(path);
				return item;
			}
		}
	};
	assign$5(Ractive.prototype, extendRactive);
	const getComponentName = (componentModel, componentName) => {
		return componentModel === app.router.currentStateObject ? 'navState' : componentName;
	};
	const {
		watch: watch$2,
		demand: demand$3,
		utility: {
			each: each$8, isFunction: isFunction$1
		}
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
		localStorage[filePath] = html;
		if (app.debug) {
			console.log(type, filePath, html);
		}
		if (isFunction$1(componentName)) {
			componentName(html);
		} else {
			each$8(app.view.findAllComponents(componentName), (item) => {
				if (app.debug) {
					console.log(item);
				}
				item.resetTemplate(html);
			});
		}
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
			each: each$7
		}
	} = app;
	const importPartials = (componentName, componentModel, asset) => {
		if (asset.partials) {
			each$7(asset.partials, (item, key) => {
				watchHtml(item.includes('.html') ? item : `${item}.html`, (html) => {
					const realName = getComponentName(componentModel, componentName);
					each$7(app.view.findAllComponents(realName), (subItem) => {
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
			each: each$6, isString: isString$3, isArray, apply: apply$2
		}
	} = app;
	const logMulti = console;
	function debugMultiEvent(...args) {
		if (app.debug || app.debugMultiEvent) {
			apply$2(logMulti.log, logMulti, args);
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
				each$6(events.split(','), (subItem) => {
					if (subItem) {
						currentView.fire(subItem.trim(), componentEvent, ...args);
					}
				});
			} else if (isArray(events)) {
				each$6(events, (item) => {
					if (item) {
						each$6(item.split(','), (subItem) => {
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
			each: each$5, assign: assign$4, querySelector: querySelector$1
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
			each$5(css, render);
		}
	};
	const cssUnrender = (css) => {
		if (css) {
			each$5(css, unrender);
		}
	};
	const componentsWithCss = {};
	const registerCssComponent = (css, componentConfig) => {
		if (!css) {
			return;
		}
		each$5(css, (item, key) => {
			if (!componentsWithCss[key]) {
				componentsWithCss[key] = [];
			}
			componentsWithCss[key].push(componentConfig);
		});
	};
	assign$4(app, {
		componentsWithCss,
		importedCss,
		importedCssCount
	});
	const {
		watch: watch$1,
		utility: {
			each: each$4, get, apply: apply$1
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
		each$4(currentView.watchers, (item, key) => {
			item.stop();
			item[key] = null;
		});
	};
	const onrenderInstance = function(currentView, css) {
		cssRender(css);
		if (currentView.watchers) {
			each$4(currentView.watchers, (item) => {
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
			each$4(thisComponent.watchers, (item, key) => {
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
	const {
		utility: {
			cnsl: cnsl$1, assign: assign$3
		}
	} = app;
	cnsl$1('viewSetup Module', 'notify');
	const initializeComponent = (componentConfig) => {
		componentConfig.decorators = assign$3(componentConfig.decorators || {}, {});
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
			omit: omit$1
		}
	} = app;
	const buildComponent = (componentConfig) => {
		initializeComponent(componentConfig);
		const {
			name: componentName, model
		} = componentConfig;
		const cmpntConfigClean = omit$1(componentConfig, ['css', 'asset']);
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
			assign: assign$2, each: each$3, ensureArray, isString: isString$2
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
				assign$2(componentConfig.partials, await demandHtml(asset.partials));
			}
			if (asset.css) {
				const assetCss = asset.css;
				const loadCss = await demandCss(assetCss);
				each$3(ensureArray(loadCss), (item, index) => {
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
	const component = (componentName, componentConfigOption) => {
		let method;
		const componentConfig = componentConfigOption ? componentConfigOption : componentName;
		if (isString$1(componentName)) {
			componentConfig.name = componentName;
		}
		if (componentConfig.asset) {
			method = asyncComponent;
		} else {
			method = buildComponent;
		}
		return method(componentConfig);
	};
	app.component = component;
	app.getComponent = getComponent;
	const {
		demand: demand$1,
		watch,
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
			const content = await demand$1(filePath);
			if (isDom(node)) {
				node.innerHTML = content;
			}
			if (componentsUsingCss) {
				each$2(componentsUsingCss, (item) => {
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
			assign: assign$1, each: each$1, isFunction
		}
	} = app;
	const view = new Ractive({
		data() {
			return {
				components: {
					dynamic: {},
					layout: {},
					main: {}
				},
				notification: [],
				pageTitle: '',
				screenSize: ''
			};
		},
		template: `{{#components.main:key}}{{>getComponent(key)}}{{/}}`
	});
	view.on({
		async '*.loadComponent'(componentEvent) {
			const imported = await demand(componentEvent.get('demand'));
			const afterDemand = componentEvent.get('afterDemand');
			if (afterDemand) {
				const afterDemandEvents = afterDemand[componentEvent.original.type];
				each$1(afterDemandEvents, (item, key) => {
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
		await app.view.set(`components.${type}.${componentName}`, true);
		await view.update('components.${type}');
	};
	const pageTitleComponent = new Ractive({
		append: true,
		data() {
			return {
				text() {
					return view.get('pageTitle');
				}
			};
		},
		template: `<title>{{text()}}</title>`
	});
	assign$1(app, {
		async render() {
			await view.render('body');
			await pageTitleComponent.render('head');
		},
		view
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
		demandJs,
		demandLang,
		utility: {
			cnsl, assign, each, map, isString, rest, camelCase, omit, last, batch, eventAdd, apply
		}
	} = app;
	const router = {};
	const hostname = window.location.hostname;
	router.historyIndex = 0;
	const logRouter = console;
	function debugRouter(...args) {
		if (app.debug || app.debugRouter) {
			apply(logRouter.log, logRouter, args);
		}
	}
	Ractive.sharedSet('historyIndex', router.historyIndex);
	cnsl('ROUTER ONLINE', 'important');
	assign(router, {
		add(item) {
			each(item, router.addObject);
		},
		addObject(item, key) {
			const reg = new RegExp(key);
			router.routes.push(async () => {
				return router.routeChecker(item, reg);
			});
		},
		attachEvents() {
			eventAdd(
				window,
				'popstate',
				async (eventArg) => {
					debugRouter('popstate', eventArg);
					router.saveState();
					router.updateLocation();
					await router.loadState();
					eventArg.preventDefault();
				},
				true
			);
		},
		async closeState(previousStateObject) {
			debugRouter('closeState', previousStateObject);
			if (previousStateObject) {
				if (!previousStateObject.closed) {
					debugRouter('forceClose', previousStateObject);
					return router.forceClose(previousStateObject);
				}
				return debugRouter('Previous State Marked As Closed', previousStateObject);
			}
		},
		async forceClose(sourceState) {
			app.view.set('navState', false);
			debugRouter('forceClose', sourceState);
			if (sourceState) {
				if (sourceState.watchers) {
					sourceState.watchers.stop();
				}
				if (sourceState.close) {
					debugRouter('MODEL Close STATE', sourceState);
					await sourceState.close();
				}
				sourceState.closed = true;
			}
		},
		go(route) {
			if (router.analytics) {
				router.analytics();
			}
			return router.openState(route);
		},
		isCurrentModel(model, success, failure) {
			const check = router.currentStateObject ? router.currentStateObject === model : false;
			if (check) {
				if (success) {
					success();
				}
			} else if (failure) {
				failure();
			}
			return check;
		},
		async loadState() {
			cnsl('Router Loading State', 'notify');
			const routesLength = router.routes.length;
			let index = 0;
			while (index < routesLength) {
				const item = router.routes[index];
				const result = Boolean(await item()) === false;
				index++;
				if (result === false) {
					debugRouter('LOAD STATE', item, result);
					break;
				}
			}
		},
		location: {
			previous: {}
		},
		objectRoutes: {},
		async openState(openModel) {
			// close event
			const previousStateObject = router.currentStateObject;
			if (openModel) {
				debugRouter('OPENING STATE', openModel);
				router.currentStateObject = openModel;
				if (previousStateObject === openModel) {
					debugRouter('STATE IS SAME MODEL', openModel);
					debugRouter('NAVSTATE REFRESH COMPONENT');
					await app.view.set('navState', false);
					await app.view.set('navState', true);
					return;
				}
				debugRouter('MODEL CLOSED STATE', openModel.closed);
				if (openModel.closed || openModel.closed === undefined) {
					debugRouter('MODEL CLOSED', openModel);
					openModel.closed = false;
				}
				if (!openModel.panel) {
					await router.closeState(previousStateObject);
				}
			} else {
				debugRouter('CLOSE PREVIOUS PAGE COMPONENT NO CURRENT ONE GIVEN');
				router.currentStateObject = null;
				await router.closeState(previousStateObject);
			}
			debugRouter('CURRENT STATE OBJECT HASH COMPONENT?');
			const currentStateObject = router.currentStateObject;
			if (currentStateObject && currentStateObject.component) {
				if (currentStateObject.open) {
					debugRouter('MODEL OPEN STATE', router.currentStateObject);
					currentStateObject.open();
				}
				if (app.debug) {
					debugRouter('NAVSTATE LOAD NEW COMPONENT');
				}
				await app.view.set('navState', false);
				Ractive.components.navState = currentStateObject.component;
				await app.view.set('navState', true);
				if (currentStateObject.watchers) {
					currentStateObject.watchers.start();
				}
				return;
			}
		},
		async pushState(url) {
			if (url) {
				router.saveState();
				router.setState(url, url);
				router.updateLocation();
				await router.loadState();
			}
		},
		reloadState(sourceState) {
			const currentStateObject = sourceState || router.currentStateObject;
			if (currentStateObject) {
				if (currentStateObject.reload) {
					batch(currentStateObject.reload);
				}
			}
		},
		async routeChecker(data, reg) {
			const matching = router.location.pathname.match(reg);
			if (matching) {
				router.match = matching;
				const route = data.route();
				let routePath = last(route.path) === '/' ? route.path : `${route.path}/`;
				routePath = routePath[0] === '/' ? routePath : `/${routePath}`;
				route.path = routePath;
				const routeRequire = data.require;
				debugRouter('routeChecker MATCHED', routePath);
				if (router.objectRoutes[routePath]) {
					await router.go(router.objectRoutes[routePath]);
				} else {
					(async () => {
						debugRouter('routeChecker ASYNC');
						if (!data.loaded && routeRequire) {
							debugRouter('routeChecker demandJS');
							await demandJs(routeRequire);
						}
						const object = await demandJs(`routes${routePath}`);
						if (!object) {
							return;
						}
						const lang = await demandLang(routePath);
						if (object.component && object.component.then) {
							await object.component;
						}
						object.assets = object.assets || {};
						if (lang) {
							object.assets.language = lang;
						}
						if (object.compile) {
							await object.compile();
						}
						router.objectRoutes[routePath] = object;
						await router.go(object);
						data.loaded = true;
					})();
				}
			}
			return matching;
		},
		routes: [],
		saveState() {
			assign(router.location.previous, omit(router.location, ['previous']));
		},
		setState(url, title, object) {
			// pushState
			if (hostname + url === hostname + window.location.pathname) {
				router.reloadState();
			} else {
				history.pushState(object, title, url);
			}
		},
		async setup() {
			router.updateLocation();
			router.attachEvents();
			await router.loadState();
		},
		updateLocation() {
			map(top.location, (item, index) => {
				if (isString(item)) {
					router.location[index] = item;
				}
			});
			router.location.pathScored = router.location.pathname.replace(/\//g, '_');
			router.location.paths = rest(router.location.pathname.split('/'));
			router.location.pathCamel = camelCase(router.location.paths.join('_'));
			Ractive.sharedSet('currentPath', router.location.pathname);
		}
	});
	Ractive.routerLoad = (componentView) => {
		componentView.on({
			'*.routerBack'(eventArg) {
				debugRouter('Router back State', eventArg);
				router.historyIndex--;
				Ractive.sharedSet('historyIndex', router.historyIndex);
				debugRouter(router.historyIndex);
				if (router.location.previous.hostname) {
					window.history.back();
				} else {
					return;
				}
			},
			'*.routerForward'(eventArg) {
				debugRouter('Router forward State', eventArg);
				if (router.location.previous.hostname) {
					window.history.forward();
				} else {
					return;
				}
			},
			'*.routerLoad'(eventArg) {
				const href = eventArg.get('href');
				debugRouter('Router Load State', eventArg.get('href'), eventArg);
				router.historyIndex++;
				Ractive.sharedSet('historyIndex', router.historyIndex);
				debugRouter(router.historyIndex);
				if (href) {
					router.pushState(href);
				} else {
					const node = eventArg.node;
					const hrefAttribute = node.href || node.getAttribute('data-href');
					eventArg.original.preventDefault();
					router.pushState(hrefAttribute);
				}
				return false;
			}
		});
	};
	assign(app, {
		router
	});
})();
