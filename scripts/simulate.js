module.exports = (async () => {
	console.clear();
	console.log('STARTING CLIENT');
	const client = await require('../client');
	const service = await client.getCertificate(`${__dirname}/../services/universal.web.cert`);
	const profile = await client.getCertificate(`${__dirname}/../profiles/default.cert`);
	// Universal Web Socket
	const uws = await client({
		service,
		profile,
		servicePort: 8888
	});
	console.time('Full');
	const connected = await uws.connect({
		agent: 'node',
		entity: 'bot',
		req: {
			n: 'state',
			d: {
				state: '/'
			}
		}
	});
	console.log('Connected', connected);
	console.log('INTRO =>', connected.response.body);
	console.time('Request');
	return;
	const state = await uws.request('state', {
		state: '/'
	});
	console.timeEnd('Request');
	console.timeEnd('Full');
	console.log('Request state', state.response.body.data.toString('UTF8'));
})();
