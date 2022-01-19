import app from '../app';
const {
	demandJs,
	demandLang,
	utility: {
		cnsl,
		assign,
		each,
		map,
		isString,
		rest,
		camelCase,
		omit,
		last,
		batch,
		eventAdd,
	},
} = app;
const router = {};
const hostname = window.location.hostname;
router.historyIndex = 0;
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
		eventAdd(window, 'popstate', async (eventArg) => {
			console.log('popstate', eventArg);
			router.saveState();
			router.updateLocation();
			await router.loadState();
			eventArg.preventDefault();
		}, true);
	},
	async closeState(previousStateObject) {
		console.log('closeState', previousStateObject);
		if (previousStateObject) {
			if (!previousStateObject.closed) {
				console.log('forceClose', previousStateObject);
				return router.forceClose(previousStateObject);
			}
			return console.log('Previous State Marked As Closed', previousStateObject);
		}
	},
	async forceClose(sourceState) {
		app.view.set('navState', false);
		console.log('forceClose', sourceState);
		if (sourceState) {
			if (sourceState.watchers) {
				sourceState.watchers.stop();
			}
			if (sourceState.close) {
				console.log('MODEL Close STATE', sourceState);
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
		const check = (router.currentStateObject) ? router.currentStateObject === model : false;
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
				console.log('LOAD STATE', item, result);
				break;
			}
		}
	},
	location: {
		previous: {},
	},
	objectRoutes: {},
	async openState(openModel) {
		// close event
		const previousStateObject = router.currentStateObject;
		if (openModel) {
			console.log('OPENING STATE', openModel);
			router.currentStateObject = openModel;
			if (previousStateObject === openModel) {
				console.log('STATE IS SAME MODEL', openModel);
				console.log('NAVSTATE REFRESH COMPONENT');
				await app.view.set('navState', false);
				await app.view.set('navState', true);
				return;
			}
			console.log('MODEL CLOSED STATE', openModel.closed);
			if (openModel.closed || openModel.closed === undefined) {
				console.log('MODEL CLOSED', openModel);
				openModel.closed = false;
			}
			if (!openModel.panel) {
				await router.closeState(previousStateObject);
			}
		} else {
			console.log('CLOSE PREVIOUS PAGE COMPONENT NO CURRENT ONE GIVEN');
			router.currentStateObject = null;
			await router.closeState(previousStateObject);
		}
		console.log('CURRENT STATE OBJECT HASH COMPONENT?');
		const currentStateObject = router.currentStateObject;
		if (currentStateObject && currentStateObject.component) {
			if (currentStateObject.open) {
				console.log('MODEL OPEN STATE', router.currentStateObject);
				currentStateObject.open();
			}
			console.log('NAVSTATE LOAD NEW COMPONENT');
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
			let routePath = (last(route.path) === '/') ? route.path : `${route.path}/`;
			routePath = (routePath[0] === '/') ? routePath : `/${routePath}`;
			route.path = routePath;
			const routeRequire = data.require;
			console.log('routeChecker MATCHED', routePath);
			if (router.objectRoutes[routePath]) {
				await router.go(router.objectRoutes[routePath]);
			} else {
				(async () => {
					console.log('routeChecker ASYNC');
					if (!data.loaded && routeRequire) {
						console.log('routeChecker demandJS');
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
			console.log('Router back State', eventArg);
			router.historyIndex--;
			Ractive.sharedSet('historyIndex', router.historyIndex);
			console.log(router.historyIndex);
			if (router.location.previous.hostname) {
				window.history.back();
			} else {
				return;
			}
		},
		'*.routerForward'(eventArg) {
			console.log('Router forward State', eventArg);
			if (router.location.previous.hostname) {
				window.history.forward();
			} else {
				return;
			}
		},
		'*.routerLoad'(eventArg) {
			const href = eventArg.get('href');
			console.log('Router Load State', eventArg.get('href'), eventArg);
			router.historyIndex++;
			Ractive.sharedSet('historyIndex', router.historyIndex);
			console.log(router.historyIndex);
			if (href) {
				router.pushState(href);
			} else {
				const node = eventArg.node;
				const hrefAttribute = node.href || node.getAttribute('data-href');
				eventArg.original.preventDefault();
				router.pushState(hrefAttribute);
			}
			return false;
		},
	});
};
assign(app, {
	router,
});
