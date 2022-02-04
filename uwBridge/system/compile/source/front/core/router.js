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
		ifInvoke,
		hasValue,
		last
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
			route,
			secured,
			role,
			path
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
		this.log(this.pathState.path);
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
			this.log('Checking if Model Loaded', match.model);
			if (match.assets) {
				if (match.assets.scripts) {
					await demandJs(match.assets.scripts);
				}
			}
			this.log('match model', pathState.path);
			const stateModel = await demandJs(pathState.path);
			this.log(stateModel);
			const initializeComponent = await component(stateModel.component);
			this.log('component made', initializeComponent);
			Ractive.components.navstate = initializeComponent;
			ifInvoke(stateModel.open);
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
			original,
			node
		} = componentEvent;
		const url = componentEvent.get('href') || node.getAttribute('href') || node.getAttribute('data-href');
		original.preventDefault();
		app.router.log(componentEvent, url);
		app.router.pushState(url);
		return false;
	},
});
