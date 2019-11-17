module.exports = (async () => {
	console.log('STARTING CLIENT');
	const client = await require('../client');
	const service = await client.getCertificate(`${__dirname}/../services/universal.web.cert`);
	const profile = await client.getCertificate(`${__dirname}/../profiles/default.cert`);
	// Universal Web Socket
	const uws = await client({
		service,
		profile
	});
	const connected = await uws.connect({
		agent: 'node',
		entity: 'bot'
	});
	console.log('Connected', connected);
	console.log('INTRO =>', connected.response.body);
	const state = await uws.request('state', {
		state: '/'
	});
	console.log('Request state', state.response.body.data.toString('UTF8'));
})();
