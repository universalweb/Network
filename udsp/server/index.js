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
		const coureCount = (size && size <= numCPUs) ? size : numCPUs;
		config.coreCount = coureCount;
		if (cluster.isPrimary) {
			console.log(`Primary ${process.pid} is running spawning ${coureCount} instances.`);
			config.isPrimary = true;
			const masterLoadBalancer = await new Server(config, ...args);
			const workers = new Map();
			masterLoadBalancer.workers = workers;
			for (let index = 0; index < coureCount; index++) {
				const worker = cluster.fork();
				workers.set(worker.id, worker);
			}
			cluster.on('online', (worker) => {
				console.log('worker is online:', worker.id);
				workers.set(worker.id, worker);
				worker.port = port + worker.id;
			});
			cluster.on('exit', (worker, code, signal) => {
				console.log('worker is dead:', worker.isDead(), code);
				workers.delete(worker.id, worker);
			});
		} else {
			console.log(`Worker ${cluster.worker.id} started`);
			config.isPrimary = false;
			config.port = scale.port + cluster.worker.id;
			config.workerId = cluster.worker.id;
			config.isWorker = true;
			// await new Server(config, ...args);
		}
	} else {
		return new Server(config, ...args);
	}
}
export { Server };
