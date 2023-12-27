import { isFunction, isZero } from '@universalweb/acid';
export class Router {
	// constructor(options) {
	// }
	routesAll = [];
	routesMethods = [[], [], [], [], [], []];
	matchRoute(routeArray, fullPath) {
		const routeArrayLength = routeArray.length;
		const routes = [];
		for (let i = 0; i < routeArrayLength; i++) {
			const route = routeArray[i];
			if (isFunction(route)) {
				routes.push(route);
				continue;
			}
			if (fullPath.match(route[0])) {
				routes.push(route[1]);
			}
		}
		return routes;
	}
	async executeRoutes(routes, req, res, client) {
		const routesLength = routes.length;
		for (let i = 0; i < routesLength; i++) {
			if (!res.sent) {
				const route = routes[i];
				if (route.handle) {
					await route.handle(req, res, client);
					continue;
				}
				await route(req, res, client);
				continue;
			}
		}
		if (!res.sent) {
			console.log(res);
			res.send();
		}
	}
	async processRouteArray(routeArray, fullPath, req, res, client) {
		const routes = this.matchRoute(routeArray, fullPath);
		return this.executeRoutes(routes, req, res, client);
	}
	async processByMethod(method, path, req, res, client) {
		const methodsOnRoute = this.routesMethods[method];
		console.log('processByMethod', methodsOnRoute, path, method);
		if (isZero(methodsOnRoute.length)) {
			return;
		}
		const routes = this.matchRoute(methodsOnRoute, path);
		return this.executeRoutes(routes, req, res, client);
	}
	async handle(req, res, client) {
		const {
			path,
			method
		} = req;
		const { routesAll } = this;
		if (routesAll.length) {
			await this.executeRoutes(routesAll, req, res, client);
		}
		return this.processByMethod(method, path, req, res, client);
	}
	all(method) {
		this.routesAll.push(method);
	}
	get(route, method) {
		if (method) {
			this.routesMethods[0].push([route, method]);
		} else {
			this.routesAll.push(route);
		}
	}
	post(route, method) {
		this.routesMethods[1].push([route, method]);
	}
	delete(route, method) {
		this.routesMethods[0].push([route, method]);
	}
	api(route, method) {
		this.routesMethods[0].push([route, method]);
	}
	update(route, method) {
		this.routesMethods[0].push([route, method]);
	}
}
export function router(...args) {
	return new Router(...args);
}
