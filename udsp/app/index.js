import * as routers from './router/index.js';
import * as servers from '#server';
import {
	assign,
	currentPath,
	hasValue,
	isUndefined,
	merge,
	omit,
} from '@universalweb/utilitylib';
import { bannerLog, infoLog, successLog } from '#utilities/logs/logs';
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
	successLog('worker', `READY:${worker.id}`);
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
async function workerInstance(config, ...args) {
	infoLog('WORKER', `${cluster.worker.id} started`);
	infoLog('WORKER', 'CONFIG', false, config);
	const freshConfig = omit(config, ['scale']);
	freshConfig.server = {};
	merge(freshConfig.server, config.server);
	freshConfig.isPrimary = false;
	freshConfig.port = (config?.scale.port || config?.server.port) + cluster.worker.id;
	freshConfig.workerId = String(cluster.worker.id);
	freshConfig.isWorker = true;
	// const freshConfig = omit(config, ['scale']);
	// assign(freshConfig, config.scale);
	const serverWorker = await new App(freshConfig, ...args);
	process.on('message', (message) => {
		if (message === 'registered') {
			return successLog('Worker', `REGISTERED ${config.workerId}`);
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
export async function app(config, ...args) {
	// if (config.scale && false) {
	if (config.scale) {
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
			cluster.on('online', (worker) => {
				infoLog('worker is online:', worker.id);
			});
			cluster.on('exit', (worker, code, signal) => {
				infoLog('worker is dead:', worker.isDead(), code);
				workers[worker.id] = null;
			});
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
				break;
			}
			// infoLog(cluster.settings);
			return masterLoadBalancer;
		} else {
			return workerInstance(config, ...args);
		}
	} else {
		bannerLog('SINGLE APP INSTANCE LAUNCHING');
		return (new App(config, ...args));
	}
}
