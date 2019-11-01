module.exports = (async () => {
	console.log('STARTING CLIENT');
	const client = await require('../client');
	const service = await client.getCertificate(`${__dirname}/../services/universal.web.cert`);
	const profile = await client.getCertificate(`${__dirname}/../profiles/default.cert`);
	const universalWebSocket = await client.udsp({
		service,
		profile
	});
	console.log(await universalWebSocket.connect({
		agent: 'node',
		entity: 'bot'
	}));
	return;
	universalWebSocket.logImprt('Simulation', __dirname);
	const defaultState = await universalWebSocket.request('state', {
		state: '/'
	});
	console.log(defaultState);
})();
