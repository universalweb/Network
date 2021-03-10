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
	console.time('0RTT with app data');
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
	console.timeEnd('0RTT with app data');
	console.log('Connected', connected);
	console.log('INTRO =>', connected.response.body);
	console.log('Request state', connected.response.body.data.toString('UTF8'));
})();
