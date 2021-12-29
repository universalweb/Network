module.exports = async (config) => {
	const cluster = require('cluster');
	if (cluster.isMaster) {
		console.log('\n---------------------MASTER SETUP STARTED---------------------\n');
		config.role = 'master';
		await require('./setup/master')(config);
		console.log('\n---------------------MASTER SETUP ENDED---------------------\n');
	} else {
		console.log('\n---------------------Client SETUP STARTED---------------------\n');
		console.log(config);
		await require('./setup/client')(config);
		console.log('\n---------------------Client SETUP ENDED---------------------\n');
	}
};
