module.exports = (async () => {
	console.log('STARTING CLIENT');
	const client = await require('./client')('127.0.0.1', '8880');
	const {
		request,
		connect,
		logImprt,
		profile: {
			activate: activateProfile
		},
	} = client;
	logImprt('Simulation', __dirname);
	await activateProfile('default');
	await connect();
	const defaultState = await request('state', {
		state: '/'
	});
	console.log(defaultState);
})();
