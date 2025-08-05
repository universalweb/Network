import { extendClass, isFunction, isZero } from '@universalweb/utilitylib';
import eventMethods from '#udsp/events';
import getMethod from '../../methods/get.js';
export class Router {
	constructor(options) {
		this.setupEventEmitter();
		return this;
	}
	routesAll = [];
	routesMethods = [
		[],
		[],
		[],
		[],
		[],
		[],
	];
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
	async executeRoutes(routes, req, res, appServer) {
		const routesLength = routes.length;
		for (let i = 0; i < routesLength; i++) {
			if (!res.sent) {
				const route = routes[i];
				if (route.handle) {
					await route.handle(req, res, appServer);
					continue;
				}
				await route(req, res, appServer);
				continue;
			}
		}
		if (!res.sent) {
			this.logInfo(res);
			res.send();
		}
	}
	async processRouteArray(routeArray, fullPath, req, res, appServer) {
		const routes = this.matchRoute(routeArray, fullPath);
		return this.executeRoutes(routes, req, res, appServer);
	}
	async processByMethod(method, path, req, res, appServer) {
		const methodsOnRoute = this.routesMethods[method];
		this.logInfo('processByMethod', methodsOnRoute, path, method);
		if (isZero(methodsOnRoute.length)) {
			return;
		}
		const routes = this.matchRoute(methodsOnRoute, path);
		return this.executeRoutes(routes, req, res, appServer);
	}
	async handle(req, res, appServer) {
		const {
			path,
			method,
		} = req;
		const { routesAll } = this;
		if (routesAll.length) {
			await this.executeRoutes(routesAll, req, res, appServer);
		}
		return this.processByMethod(method, path, req, res, appServer);
	}
	all(method) {
		this.routesAll.push(method);
	}
	get(route, method) {
		if (method) {
			this.routesMethods[getMethod.id].push([
				route,
				method,
			]);
		} else {
			this.routesAll.push(route);
		}
	}
	// NOT IMPLIMENTED PASSED THIS POINT
	// post(route, method) {
	// 	this.routesMethods[1].push([
	// 		route,
	// 		method
	// 	]);
	// }
	// delete(route, method) {
	// 	this.routesMethods[0].push([
	// 		route,
	// 		method
	// 	]);
	// }
	// api(route, method) {
	// 	this.routesMethods[0].push([
	// 		route,
	// 		method
	// 	]);
	// }
	// update(route, method) {
	// 	this.routesMethods[0].push([
	// 		route,
	// 		method
	// 	]);
	// }
}
export function router(...args) {
	return new Router(...args);
}
extendClass(Router, eventMethods);
