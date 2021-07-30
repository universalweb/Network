module.exports = (utility) => {
  const os = require('os');
  const cluster = require('cluster');
  const {
    times
  } = utility;
  const numCPUs = os.cpus()
    .length;
  const workers = times(numCPUs, () => {
    console.log('Worker Started');
    return cluster.fork();
  });
  utility.cluster = workers;
  console.log(`Workers initialized ${numCPUs}`);
  cluster.on('online', (worker) => {
    console.log(`Worker ${worker.process.pid} is online`);
  });
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`);
  });
  console.log(`Master cluster setting up ${numCPUs} workers.`);
};
