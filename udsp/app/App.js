import * as routers from './router/index.js';
import * as servers from '#server';
import { assign, extendClass, isUndefined } from '@universalweb/utilitylib';
import {
	logBanner,
	logError,
	logInfo,
	logSuccess,
	logVerbose,
	logWarning,
} from '../../utilities/logs/classLogMethods.js';
import { decodePacketHeaders } from '#udsp/encoding/decodePacket';
import { encode } from '#utilities/serialize';
import eventMethods from '#udsp/events';
import { getConnectionIdReservedSpaceString } from '../utilities/connectionId.js';
import { initialize } from '#server/clients/methods/initialize';
import logMethods from '#utilities/logs/classLogMethods';
import { onPacket } from '../server/methods/onPacket.js';
const {
	router: createRouter,
	Router,
} = routers;
const {
	Server,
	server: createServer,
} = servers;
export class App {
	constructor(options) {
		this.logBanner('APP INITIALIZING');
		return this.initialize(options);
	}
	async initialize(options) {
		const { router: routerOptions } = options;
		this.setupEventEmitter();
		if (options) {
			assign(this, options);
			if (options.server?.constructor === Server) {
				this.useServer(options.server);
			} else {
				this.server = await createServer(options.server);
				this.useServer(this.server);
			}
		}
		if (routerOptions) {
			if (routerOptions.constructor === Router) {
				this.use(routerOptions);
			} else {
				this.router = await createRouter(routerOptions);
			}
		}
		return this;
	}
	async onLoadbalancer(packet, connection) {
		this.logInfo('Message Received onLoadbalancer');
		const config = {
			packet,
			connection,
			destination: this.server,
		};
		const wasHeadersDecoded = await decodePacketHeaders(config);
		if (isUndefined(wasHeadersDecoded)) {
			return console.trace('Invalid Packet Headers');
		}
		const id = config.packetDecoded.id;
		// ADD ALGO TO CHOOSE ONLY VIABLE WORKERS
		let workerId = 1;
		const { reservedConnectionIdSize } = config.destination;
		if (id !== false) {
			const idString = id.toString('hex');
			const reservedSmartRoute = getConnectionIdReservedSpaceString(id, reservedConnectionIdSize);
			this.logInfo(`Loadbalancer got an id ${idString}`);
			this.logInfo(`Reserved Smart Route ${reservedSmartRoute}`, id.length, idString, reservedConnectionIdSize);
			workerId = reservedSmartRoute;
		}
		// ADD ALGO TO CHOOSE ONLY VIABLE WORKERS
		const worker = this.workers[workerId];
		const passMessage = await encode([
			packet,
			connection,
		]);
		if (worker && passMessage) {
			worker.process.send(passMessage);
		}
	}
	// async onPacket(packet, connection) {
	// 	throw new Error('onPacket sent to server?');
	// 	// return this.server.onPacket(packet, connection);
	// }
	use(primaryArg, ...args) {
		if (!primaryArg) {
			return this;
		}
		switch (primaryArg.constructor) {
			case Router: {
				this.useRouter(primaryArg);
				break;
			} case Server: {
				this.useServer(primaryArg);
				break;
			} default: {
				this.router.all(primaryArg, ...args);
			}
		}
		return this;
	}
	useRouter(router) {
		if (!router) {
			return this;
		}
		if (router.constructor === Router) {
			this.router = router;
		} else {
			this.router = createRouter(router);
		}
		return this;
	}
	// TODO: ADD MIDDLEWARE SUPPORT
	addMiddleware() {
	}
	// TODO: ADD MULTIPLE SERVER SUPPORT
	useServer(createdServer) {
		const app = this;
		this.server = createdServer;
		createdServer.app = app;
		return this;
	}
	async onRequest(request, response, server) {
		const { router } = this;
		this.logInfo('onRequest', request);
		if (this.onAppRequest) {
			await this.onAppRequest(request, response, this);
		}
		if (router) {
			return router.handle(request, response, this);
		} else {
			this.logError('No Router Found - Returning 404');
			return response.sendNotFound();
		}
	}
	data = new Map();
	router = new Router();
	listen(port) {
		return this.server.listen(port);
	}
	all(path, callback) {
		return this.router.all(path, callback);
	}
	get(path, callback) {
		return this.router.get(path, callback);
	}
	post(path, callback) {
		return this.router.post(path, callback);
	}
	api(path, callback) {
		return this.router.api(path, callback);
	}
	getItem(key) {
		return this.data.get(key);
	}
	hasItem(key) {
		return this.data.has(key);
	}
	has(...args) {
		return this.hasItem();
	}
	setItem(key, item) {
		return this.data.set(key, item);
	}
	set(key, item) {
		return this.setItem(key, item);
	}
	deleteItem(key) {
		return this.server.delete(key);
	}
	delete(key) {
		return this.deleteItem(key);
	}
}
extendClass(App, logMethods);
extendClass(App, eventMethods);
