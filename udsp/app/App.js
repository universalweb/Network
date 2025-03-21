import * as routers from '../router/index.js';
import * as servers from '#server';
import {
	logError,
	logInfo,
	logVerbose,
	logWarning
} from '../consoleLog.js';
import { decodePacketHeaders } from '#udsp/encoding/decodePacket';
import { encode } from '#utilities/serialize';
import { getConnectionIdReservedSpaceString } from '../connectionId.js';
import { initialize } from '#server/clients/initialize';
import { isUndefined } from '@universalweb/acid';
import { onPacket } from '../server/onPacket.js';
const {
	router: createRouter,
	Router
} = routers;
const {
	Server,
	server: createServer,
} = servers;
export class App {
	constructor(options) {
		return this.initialize(options);
	}
	async initialize(options) {
		const { router: routerOptions } = options;
		if (options) {
			if (options.constructor === Server) {
				this.use(options);
			} else {
				this.server = await createServer(options);
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
		const passMessage = encode([
			packet,
			connection
		]);
		if (worker && passMessage) {
			worker.process.send(passMessage);
		}
	}
	logError = logError;
	logWarning = logWarning;
	logInfo = logInfo;
	logVerbose = logVerbose;
	async onPacket(packet, connection) {
		return this.server.onPacket(packet, connection);
	}
	use(primaryArg, ...args) {
		if (primaryArg.constructor === Router) {
			this.router = primaryArg;
		} else if (primaryArg.constructor === Server) {
			this.useServer(primaryArg);
		} else {
			this.router.all(primaryArg, ...args);
		}
		return this;
	}
	addMiddleware() {
	}
	useServer(createdServer) {
		this.server = createdServer;
		const thisApp = this;
		createdServer.onRequest = function(request, response, client) {
			return thisApp.onRequest(request, response, client);
		};
	}
	async onRequest(request, response, client) {
		const { router, } = this;
		if (router) {
			this.logInfo('Root Router Running');
			await router.handle(request, response, client);
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
