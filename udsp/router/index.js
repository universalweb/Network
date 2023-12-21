import { requestMethods } from './methods/index.js';
export class Router {
	constructor(options) {
	}
	requestMethods = [...requestMethods];
	routesAll = [];
	routesMethods = [[], [], []];
	matchRoute(routeArray, fullPath) {
		const routeArrayLength = routeArray.length;
		const routes = [];
		for (let i = 0; i < routeArrayLength; i++) {
			const route = routeArray[i];
			if (fullPath.match(route[0])) {
				routes.push(route[1]);
			}
		}
		return routes;
	}
	async executeRoutes(routes, path, req, res, client) {
		const routesLength = routes.length;
		for (let i = 0; i < routesLength; i++) {
			if (!res.sent) {
				const route = routes[i];
				const result = await route(req, res, client);
			}
		}
		if (!res.sent) {
			res.send();
		}
	}
	async processRouteArray(routeArray, fullPath, req, res, client) {
		const routes = this.matchRoute(routeArray, fullPath);
		return this.executeRoutes(routes, req, res, client);
	}
	async processByMethod(method, path, req, res, client) {
		const routes = this.matchRoute(this.routesMethods[method], path);
		return this.executeRoutes(routes, req, res, client);
	}
	async processRoute(req, res, client) {
		const {
			path,
			method
		} = req;
		await this.executeRoutes(this.routes.all, req, res, client);
		return this.processByMethod(method, path, req, res, client);
	}
	all(method) {
		this.routes.all.push(method);
	}
	get(route, method) {
		this.routesMethods[0].push([route, method]);
	}
	post(route, method) {
		this.routes.post.push([route, method]);
	}
	delete(route, method) {
		this.routes.delete.push([route, method]);
	}
	api(route, method) {
		this.routes.api.push([route, method]);
	}
	update(route, method) {
		this.routes.update.push([route, method]);
	}
}
export function router(...args) {
	return new Router(...args);
}
