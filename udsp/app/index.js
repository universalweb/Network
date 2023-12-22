import * as routers from '../router/index.js';
import * as servers from '#server';
import { assign, hasValue, isUndefined } from '@universalweb/acid';
import { decode, encode } from '#utilities/serialize';
import cluster from 'node:cluster';
import { decodePacketHeaders } from '#udsp/encoding/decodePacket';
import { getCoreCount } from '#utilities/hardware/cpu';
import { initialize } from '#server/clients/initialize';
import { msgReceived } from '#logs';
import { onPacket } from '../server/onPacket.js';
import { requestMethods } from './methods/index.js';
const {
	router: createRouter,
	Router
} = routers;
const {
	Server,
	server: createServer,
} = servers;
const numCPUs = getCoreCount();
function workerReady(worker) {
	worker.ready = true;
	worker.process.send('registered');
	console.log('worker is READY:', worker.id);
}
function workerOnMessage(workers, worker, msg) {
	const decodedMessage = decode(msg);
	const [eventName, data] = decodedMessage;
	console.log('Worker Message Received', eventName, data);
	switch (eventName) {
		case 'state': {
			const testing = 0;
			assign(worker.state, data);
			console.log('Worker State Update', worker.state);
			break;
		}
		default: {
			break;
		}
	}
}
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
		msgReceived('Message Received');
		const config = {
			packet,
			connection,
			destination: this,
		};
		const wasHeadersDecoded = await decodePacketHeaders(config);
		if (isUndefined(wasHeadersDecoded)) {
			return console.trace('Invalid Packet Headers');
		}
		const id = config.packetDecoded.id;
		const key = config.packetDecoded.key;
		const idString = id.toString('hex');
		const reservedSmartRoute = idString.substring(0, this.reservedConnectionIdSize);
		console.log(`Loadbalancer got an id ${idString}`);
		if (key) {
			console.log(`Loadbalancer has a new client ${idString}`);
		}
		const worker = this.workers[1];
		const passMessage = encode([packet, connection]);
		if (worker && passMessage) {
			worker.process.send(passMessage);
		}
	}
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
		const {
			rootRouter,
			router,
		} = this;
		if (rootRouter) {
			console.log('Root Router Running');
			await rootRouter.handle(request, response, client);
		}
		if (router) {
			console.log('Router Running');
			return router.handle(request, response, client);
		}
	}
	data = new Map();
	rootRouter = new Router();
	listen(port) {
		return this.server.listen(port);
	}
	all(path, callback) {
		return this.rootRouter.all(path, callback);
	}
	get(path, callback) {
		return this.rootRouter.get(path, callback);
	}
	post(path, callback) {
		return this.rootRouter.post(path, callback);
	}
	api(path, callback) {
		return this.rootRouter.api(path, callback);
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
export async function app(config, ...args) {
	if (config.scale) {
		const {
			scale,
			scale: { size, }
		} = config;
		let {
			ip,
			port
		} = scale;
		if (!ip) {
			ip = '::1';
			scale.ip = ip;
		}
		if (!port) {
			port = '::1';
			scale.port = port + 1;
		}
		const coreCount = (size && size <= numCPUs) ? size : numCPUs;
		config.coreCount = coreCount;
		if (cluster.isPrimary) {
			cluster.settings.serialization = 'advanced';
			console.log(`Primary ${process.pid} is running spawning ${coreCount} instances.`);
			config.isPrimary = true;
			config.workerId = String(0);
			const masterLoadBalancer = await new App(config, ...args);
			masterLoadBalancer.server.onPacket = function(packet, connection) {
				return masterLoadBalancer.onLoadbalancer(packet, connection);
			};
			const workers = [];
			masterLoadBalancer.workers = workers;
			for (let index = 0; index < coreCount; index++) {
				const worker = cluster.fork();
				worker.state = {};
				worker.port = port + worker.id;
				workers[worker.id] = worker;
				worker.on('message', (msg) => {
					if (msg === 'ready') {
						workerReady(worker);
						return;
					}
					workerOnMessage(workers, worker, msg);
				});
			}
			cluster.on('online', (worker) => {
				console.log('worker is online:', worker.id);
			});
			cluster.on('exit', (worker, code, signal) => {
				console.log('worker is dead:', worker.isDead(), code);
				workers[worker.id] = null;
			});
			// console.log(cluster.settings);
			return masterLoadBalancer;
		} else {
			console.log(`Worker ${cluster.worker.id} started`);
			config.isPrimary = false;
			config.port = (scale.port || (config.port + 1)) + cluster.worker.id;
			config.workerId = String(cluster.worker.id);
			config.isWorker = true;
			const serverWorker = await new App(config, ...args);
			process.on('message', (message) => {
				if (message === 'registered') {
					return console.log('Worker ACK REG', config.workerId);
				}
				const messageDecoded = decode(message);
				console.log('MESSAGE FROM LOAD BALANCER');
				if (hasValue(message)) {
					return serverWorker.onPacket(messageDecoded[0], messageDecoded[1]);
				} else {
					console.log('Invalid Message decode failed from load balancer');
				}
			});
			process.send('ready');
			return serverWorker;
		}
	} else {
		return new App(config, ...args);
	}
}
