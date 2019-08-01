(async () => {
	const server = await require('../server/index.js')({
		ip: 'localhost',
		port: 8880,
		maxMTU: 1000,
		encoding: 'utf8',
		max: 900,
		certificates: `${__dirname}/certificates`,
		resourceDirectory: `${__dirname}/resource`
	});
	const {
		status,
		cnsl,
	} = server;
	cnsl('DIS Server Status', status);
	console.log('Server Status', server.status);
})();
