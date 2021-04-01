/*
		* App server example
*/
(async () => {
	const server = await require('../server/index.js')({
		maxMTU: 1100,
		max: 900,
		// Domain certificate to be loaded used for connection encryption
		profile: `${__dirname}/../services/universal.web.cert`,
		// Where to load app resources from
		resourceDirectory: `${__dirname}/resources`,
		// Server ID used for load balancing and attaching to the end of connection IDs
		id: '0',
		onConnectMessage: `Welcome to the Universal Web.`,
		port: 8888
	});
	const {
		status,
		cnsl,
	} = server;
	cnsl('App Server Status', status);
	console.log('Server Status', server.status);
})();
