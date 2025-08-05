import * as routers from './router/index.js';
import * as servers from '#server';
import {
	assign,
	currentPath,
	hasValue,
	isUndefined,
} from '@universalweb/utilitylib';
import { bannerLog, infoLog } from '#utilities/logs/logs';
import { decode, encode } from '#utilities/serialize';
import { App } from './App.js';
import cluster from 'node:cluster';
import { decodePacketHeaders } from '#udsp/encoding/decodePacket';
import { getCoreCount } from '#utilities/hardware/cpu';
import { initialize } from '#server/clients/methods/initialize';
import { onPacket } from '../server/methods/onPacket.js';
const numCPUs = await getCoreCount();
function workerReady(worker) {
	worker.ready = true;
	worker.process.send('registered');
	infoLog('worker is READY:', worker.id);
}
async function workerOnMessage(workers, worker, msg) {
	const decodedMessage = await decode(msg);
	const [
		eventName,
		data,
	] = decodedMessage;
	infoLog('Worker Message Received', eventName, data);
	switch (eventName) {
		case 'state': {
			assign(worker.state, data);
			infoLog('Worker State Update', worker.state);
			break;
		}
		default: {
			break;
		}
	}
}
// TODO: Break up function try to put most as part of the class not the function
export async function app(config, ...args) {
	// if (config.scale && false) {
	if (config.scale === false) {
		const {
			scale,
			scale: { size },
		} = config;
		if (!scale.ip) {
			scale.ip = config.server.ip || '::1';
		}
		if (!scale.port) {
			scale.port = config.server.port + 1;
		}
		const coreCount = (size && size <= numCPUs) ? size : numCPUs;
		config.coreCount = coreCount;
		config.reservedConnectionIdSize = String(coreCount).length;
		if (cluster.isPrimary) {
			cluster.settings.serialization = 'advanced';
			infoLog(`Primary ${process.pid} is running spawning ${coreCount} instances.`);
			config.isPrimary = true;
			config.workerId = String(0);
			const masterLoadBalancer = await new App(config, ...args);
			masterLoadBalancer.server.onPacket = function(packet, connection) {
				infoLog('Loadbalancer Packet Received');
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
				infoLog('worker is online:', worker.id);
			});
			cluster.on('exit', (worker, code, signal) => {
				infoLog('worker is dead:', worker.isDead(), code);
				workers[worker.id] = null;
			});
			// infoLog(cluster.settings);
			return masterLoadBalancer;
		} else {
			infoLog(`Worker ${cluster.worker.id} started`);
			config.isPrimary = false;
			config.port = (scale.port || config.server.port) + cluster.worker.id;
			config.workerId = String(cluster.worker.id);
			config.isWorker = true;
			const serverWorker = await new App(config, ...args);
			process.on('message', (message) => {
				if (message === 'registered') {
					return infoLog('Worker ACK REG', config.workerId);
				}
				const messageDecoded = decode(message);
				infoLog('MESSAGE FROM LOAD BALANCER');
				if (hasValue(message)) {
					return serverWorker.onPacket(messageDecoded[0], messageDecoded[1]);
				} else {
					infoLog('Invalid Message decode failed from load balancer');
				}
			});
			process.send('ready');
			return serverWorker;
		}
	} else {
		bannerLog('SINGLE APP INSTANCE LAUNCHING');
		return (new App(config, ...args));
	}
}
