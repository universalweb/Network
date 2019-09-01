(async () => {
	const server = await require('../server/index.js')({
		maxMTU: 1000,
		encoding: 'utf8',
		max: 900,
		profile: `${__dirname}/../services/universal.web.cert`,
		resourceDirectory: `${__dirname}/resources`,
	});
	const {
		status,
		cnsl,
	} = server;
	cnsl('App Server Status', status);
	console.log('Server Status', server.status);
})();
