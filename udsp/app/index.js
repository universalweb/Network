import * as routers from '../router/index.js';
import * as servers from '#server';
import {
	assign, currentPath, hasValue, isUndefined
} from '@universalweb/acid';
import { decode, encode } from '#utilities/serialize';
import { App } from './App.js';
import cluster from 'node:cluster';
import { decodePacketHeaders } from '#udsp/encoding/decodePacket';
import { getCoreCount } from '#utilities/hardware/cpu';
import { initialize } from '#server/clients/initialize';
import { msgReceived } from '#logs';
import { onPacket } from '../server/onPacket.js';
import { requestMethods } from './methods/index.js';
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
export async function app(config, ...args) {
	if (config.scale) {
		const {
			scale,
			scale: { size, }
		} = config;
		if (!scale.ip) {
			scale.ip = config.ip || '::1';
		}
		if (!scale.port) {
			scale.port = config.port + 1;
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
				worker.port = scale.port + worker.id;
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
			config.port = (scale.port || config.port) + cluster.worker.id;
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
