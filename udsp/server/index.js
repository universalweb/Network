import cluster from 'node:cluster';
import { availableParallelism } from 'node:os';
import { construct } from '@universalweb/acid';
import { Server } from './init.js';
const numCPUs = availableParallelism();
export async function server(config, ...args) {
	if (config.cluster) {
		const {
			port,
			size,
			loadbalance
		} = config.cluster;
		if (cluster.isPrimary) {
			console.log(`Primary ${process.pid} is running`);
			const masterLoadBalancer = await new Server(config, ...args);
			const workers = [];
			masterLoadBalancer.workers = workers;
			// Fork workers.
			for (let i = 0; i < numCPUs; i++) {
				workers.push(cluster.fork());
			}
			cluster.on('fork', (worker) => {
				console.log(worker.id);
				console.log('worker is dead:', worker.isDead());
			});
			cluster.on('exit', (worker, code, signal) => {
				console.log('worker is dead:', worker.isDead(), code);
			});
		} else {
			// Workers can share any TCP connection. In this case, it is an HTTP server.
			console.log(`Worker ${process.id} started`);
			// await new Server(config, ...args);
		}
	} else {
		return new Server(config, ...args);
	}
}
export { Server };
