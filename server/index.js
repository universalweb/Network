/*
  * socket ID: SID
*/
module.exports = async (configure) => {
	const dgram = require('dgram');
	const server = {
		async initialize(serverConfiguration) {
			console.log('-------SERVER INITIALIZING-------');
			require('../state')('Server', server);
			server.profile = await server.certificate.get(serverConfiguration.profile);
			console.log(server.profile);
			server.getUtil(['cleanPath', 'propertyAccess', 'watch', 'pluckBuffer', 'buildPacketSize', 'buildStringSize']);
			require('./configuration')(server, serverConfiguration);
			require('./onError')(server);
			require('./api')(server);
			await require('./app')(server);
			require('./parseMessage')(server);
			require('./chunkMessage')(server);
			require('./send')(server);
			require('./emit')(server);
			require('./client')(server);
			require('./processSocketCreation')(server);
			require('./processMessage')(server);
			require('./onMessage')(server);
			require('./onListen')(server);
			await require('./bind')(server);
			server.status = 1;
			console.log('-------SERVER INITIALIZED-------');
			return server;
		},
		app: {
			api: {}
		},
		api: {},
		statusDescriptions: ['initializing', 'initialized', 'failed to initialize'],
		status: 0,
		/*
      		* A puzzle used to challenge clients to ensure authenticity, connection liveliness, and congestion control.
      		* Slow down account creation.
      		* Generate crypto currency for the Identity Registrar.
    	*/
		puzzleFlag: false,
		/*
			* IPv6 preferred.
		*/
		server: dgram.createSocket('udp4'),
		/*
			* All created clients represent a client to server bi-directional connection.
		*/
		clients: new Map(),
		utility: require('Lucy')
	};
	return server.initialize(configure);
};
