module.exports = (utility) => {
	const os = require('os');
	const cluster = require('cluster');
	const threads = [];
	const coreCount = os.cpus()
		.length;
	const workerCount = 0;
	utility.cluster = threads;
	console.log(`Master cluster setting up ${coreCount} workers.`);
	cluster.on('message', (msg) => {
		console.log('MESSAGE FROM WORKER');
		console.log(msg.state, coreCount, workerCount);
	});
	cluster.on('online', (worker) => {
		console.log(`Worker ${worker.process.pid} is online`);
	});
	cluster.on('exit', (worker, code, signal) => {
		console.log(`Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`);
	});
	const firstThread = cluster.fork();
	// threads[workerCount] = firstThread;
	// firstThread.on('online', () => {
	// 	console.log();
	// 	if (coreCount < workerCount) {
	// 		console.log('MESSAGE FROM WORKER', msg);
	// 		workerCount++;
	// 		console.log(workerCount);
	// 		threads.push(firstThread);
	// 	}
	// });
};
