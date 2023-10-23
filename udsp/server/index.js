import cluster from 'node:cluster';
import { construct } from '@universalweb/acid';
import { getCoreCount } from '#utilities/hardware/cpu';
import { Server } from './init.js';
const numCPUs = getCoreCount();
export async function server(config, ...args) {
	if (config.scale) {
		const {
			reservedConnectionIdSize,
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
			const masterLoadBalancer = await new Server(config, ...args);
			const workers = new Map();
			masterLoadBalancer.workers = workers;
			for (let index = 0; index < coreCount; index++) {
				const worker = cluster.fork();
				workers.set(worker.id, worker);
				worker.on('message', (msg) => {
					if (msg === 'ready') {
						workers.set(worker.id, worker);
						worker.port = port + worker.id;
						worker.process.send('world');
						console.log('worker is registered:', worker.id);
					}
				});
			}
			cluster.on('online', (worker) => {
				console.log('worker is online:', worker.id);
			});
			cluster.on('exit', (worker, code, signal) => {
				console.log('worker is dead:', worker.isDead(), code);
				workers.delete(worker.id, worker);
			});
			// console.log(cluster.settings);
			return masterLoadBalancer;
		} else {
			console.log(`Worker ${cluster.worker.id} started`);
			config.isPrimary = false;
			config.port = scale.port + cluster.worker.id;
			config.workerId = cluster.worker.id;
			config.isWorker = true;
			process.on('message', (message) => {
				console.log('MESSAGE FROM MAIN', message);
			});
			process.send('ready');
			// const serverWorker = await new Server(config, ...args);
			// return serverWorker;
		}
	} else {
		return new Server(config, ...args);
	}
}
export { Server };
