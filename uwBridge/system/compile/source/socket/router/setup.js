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
		whileArray,
	},
} = app;
const router = {};
const hostname = window.location.hostname;
cnsl('ROUTER ONLINE', 'important');
assign(router, {
	add(item) {
		each(item, router.addObject);
	},
	addObject(item, key) {
		const reg = new RegExp(key);
		router.routes.push(() => {
			return router.routeChecker(item, reg);
		});
	},
	attachEvents() {
		eventAdd(window, 'popstate', (eventArg) => {
			console.log('popstate', eventArg);
			router.saveState();
			router.updateLocation();
			router.loadState();
			eventArg.preventDefault();
		}, true);
	},
	closeState(previousStateObject) {
		console.log('closeState', previousStateObject);
		if (previousStateObject) {
			if (!previousStateObject.closed) {
				console.log('forceClose', previousStateObject);
				return router.forceClose(previousStateObject);
			}
			return console.log('Previous State Marked As Closed', previousStateObject);
		}
	},
	forceClose(sourceState) {
		app.view.set('navState', false);
		console.log('forceClose', sourceState);
		if (sourceState) {
			if (sourceState.watchers) {
				sourceState.watchers.stop();
			}
			sourceState.closed = true;
			if (sourceState.close) {
				batch(sourceState.close);
			}
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
		console.log('isCurrentModel', check);
		if (check) {
			if (success) {
				success();
			}
		} else if (failure) {
			failure();
		}
		return check;
	},
	loadState() {
		cnsl('Router Loading State', 'notify');
		whileArray(router.routes, (item) => {
			const result = Boolean(item()) === false;
			console.log('LOAD STATE', item, result);
			return result;
		});
	},
	location: {
		previous: {},
	},
	objectRoutes: {},
	openState(openModel) {
		// close event
		const previousStateObject = router.currentStateObject;
		if (openModel) {
			console.log('OPENING STATE', openModel);
			router.currentStateObject = openModel;
			if (previousStateObject === openModel) {
				console.log('STATE IS SAME MODEL', openModel);
				return (async () => {
					console.log('NAVSTATE REFRESH COMPONENT');
					await app.view.set('navState', false);
					await app.view.set('navState', true);
				})();
			}
			if (!openModel.panel) {
				router.closeState(previousStateObject);
			}
			console.log('MODEL CLOSED STATE', openModel.closed);
			if (openModel.closed || openModel.closed === undefined) {
				if (openModel.open) {
					console.log('MODEL OPEN STATE BACKUP', openModel.closed);
					openModel.open();
				}
				console.log('MODEL CLOSED STATE SET', false);
				openModel.closed = false;
			}
		} else {
			console.log('CLOSE PREVIOUS PAGE COMPONENT NO CURRENT ONE GIVEN');
			router.currentStateObject = null;
			router.closeState(previousStateObject);
		}
		console.log('CURRENT STATE OBJECT HASH COMPONENT?s', router.currentStateObject, router.currentStateObject.component);
		if (router.currentStateObject && router.currentStateObject.component) {
			return (async () => {
				console.log('NAVSTATE LOAD NEW COMPONENT');
				await app.view.set('navState', false);
				Ractive.components.navState = router.currentStateObject.component;
				await app.view.set('navState', true);
				if (router.currentStateObject.watchers) {
					router.currentStateObject.watchers.start();
				}
			})();
		}
	},
	async pushState(url) {
		console.log(url);
		if (url) {
			router.saveState();
			router.setState(url, url);
			router.updateLocation();
			router.loadState();
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
	routeChecker(data, reg) {
		const matching = router.location.pathname.match(reg);
		console.log('routeChecker', router.location.pathname, matching, reg);
		if (matching) {
			router.match = matching;
			const route = data.route();
			let routePath = (last(route.path) === '/') ? route.path : `${route.path}/`;
			routePath = (routePath[0] === '/') ? routePath : `/${routePath}`;
			route.path = routePath;
			const routeRequire = data.require;
			console.log('routeChecker MATCHED', route);
			console.log(routePath);
			if (router.objectRoutes[routePath]) {
				router.go(router.objectRoutes[routePath]);
			} else {
				(async () => {
					console.log('routeChecker ASYNC', data);
					if (!data.loaded && routeRequire) {
						console.log('routeChecker demandJS', data);
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
					router.go(object);
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
	setup() {
		router.updateLocation();
		router.attachEvents();
		router.loadState();
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
	}
});
Ractive.routerLoad = (componentView) => {
	componentView.on({
		'*.routerBack'(eventArg) {
			console.log('Router back State', eventArg);
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
