module.exports = async (config) => {
	const cluster = require('cluster');
	if (cluster.isMaster) {
		console.log('Master setup started.');
		await require('./setup/master')(config);
	} else {
		console.log('Client setup started.');
		await require('./setup/client')(config);
	}
};
