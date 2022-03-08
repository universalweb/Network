module.exports = async (config) => {
	const {
		assign
	} = require('Lucy');
	const cluster = require('cluster');
	if (cluster.isMaster) {
		console.log('\n---------------------MASTER SETUP STARTED---------------------\n');
		const masterConfig = assign({}, config);
		masterConfig.role = 'master';
		masterConfig.masterThread = true;
		await require('./setup/master')(masterConfig);
		console.log('\n---------------------MASTER SETUP ENDED---------------------\n');
		return masterConfig;
	} else {
		console.log('\n---------------------Client SETUP STARTED---------------------\n');
		const workerConfig = assign({}, config);
		workerConfig.role = 'worker';
		workerConfig.masterThread = false;
		console.log(workerConfig);
		await require('./setup/client')(workerConfig);
		console.log('\n---------------------Client SETUP ENDED---------------------\n');
		return workerConfig;
	}
};
