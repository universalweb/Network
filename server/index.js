/*
  * socket ID: SID
*/
module.exports = async (configure) => {
	const dgram = require('dgram');
	const server = {
		async initialize(serverConfiguration) {
			console.log('-------SERVER INITIALIZING-------');
			await require('../state')('Server', {
				bufferSize: configure.bufferSize || 2 ** 30
			}, server);
			server.profile = await server.certificate.get(serverConfiguration.profile);
			console.log(server.profile);
			require('../utilities/cleanPath/')(server);
			require('../utilities/propertyAccess/')(server);
			require('../utilities/watch/')(server);
			require('../utilities/pluckBuffer')(server);
			require('../utilities/buildPacketSize')(server);
			require('../utilities/buildStringSize')(server);
		  require('./configuration')(server, serverConfiguration);
			require('./onError')(server);
			require('./api')(server);
			await require('./app')(server);
			require('./parseMessage')(server);
			require('./chunkMessage')(server);
			require('./send')(server);
			require('./emit')(server);
			require('./socket')(server);
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
      * All created sockets that represent a client to server bi-directional connection.
    */
		sockets: new Map(),
		utility: require('Lucy')
	};
	return server.initialize(configure);
};
