import app from './app.js';
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
		// console.log(bindThis, this.events[eventName], eventName, args);
		return eachAsync(bindThis.events[eventName], async (eventItem) => {
			await (apply(eventItem, optionalBind, args));
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
		role: false,
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
			route,
			secured,
			role,
			path,
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
				path,
				route
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
					onrender && await (apply(onrender, this, args));
					cnsl('onrender END', 'notify');
					await routerThis.triggerEvents('render', this, args);
				};
				stateModel.component.oninit = async function(...args) {
					cnsl('oninit', 'notify');
					await routerThis.triggerEvents('beforeInit', this, args);
					oninit && await (apply(oninit, this, args));
					cnsl('oninit END', 'notify');
					if (this.rendered) {
						await (apply(compiledRender, this, args));
					} else {
						this.on('onrender', compiledRender);
					}
				};
			}
			// this.log(stateModel);
			const initializeComponent = await component(stateModel.component);
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
			original,
			node
		} = componentEvent;
		let url = componentEvent.get('href') || componentEvent.get('url') || node.getAttribute('href') || node.getAttribute('data-href');
		url = isFunction(url) && url() || url;
		original.preventDefault();
		app.router.log(componentEvent, url);
		app.router.pushState(url);
		return false;
	},
});
