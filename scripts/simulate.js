module.exports = (async () => {
	console.log('STARTING CLIENT');
	const client = await require('../client');
	const service = await client.getCertificate(`${__dirname}/../services/universal.web.cert`);
	const profile = await client.getCertificate(`${__dirname}/../profiles/default.cert`);
	const connection = await client.udsp({
		service,
		profile
	});
	const {
		request,
		logImprt,
	} = connection;
	logImprt('Simulation', __dirname);
	const defaultState = await request('state', {
		state: '/'
	});
	console.log(defaultState[0].data.toString());
})();
