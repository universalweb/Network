import cluster from 'node:cluster';
import { assign, construct, hasValue } from '@universalweb/acid';
import { getCoreCount } from '#utilities/hardware/cpu';
import { Server } from './init.js';
import { decode } from '#utilities/serialize';
import { onPacket } from './onPacket.js';
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
	case 'state':
		assign(worker.state, data);
		console.log('Worker State Update', worker.state);
		break;
	default:
		break;
	}
}
export async function server(config, ...args) {
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
			const masterLoadBalancer = await new Server(config, ...args);
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
			const serverWorker = await new Server(config, ...args);
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
		return new Server(config, ...args);
	}
}
export { Server };
