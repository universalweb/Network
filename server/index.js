/*
  * Stream ID: SID
*/
module.exports = async (configure) => {
	const dgram = require('dgram');
	const state = {
		async initialize(serverConfiguration) {
			console.log('-------SERVER INITIALIZING-------');
			await require('../utilities/console/')(state);
			await require('../utilities/file/')(state);
			await require('../utilities/crypto/')(state);
			await require('../utilities/cleanPath/')(state);
			await require('../utilities/propertyAccess/')(state);
			await require('../utilities/watch/')(state);
			await require('./configuration')(state, serverConfiguration);
			await require('../utilities/pluckBuffer')(state);
			await require('../utilities/certificate/')(state);
			await require('./coreCertificates')(state);
			await require('./onError')(state);
			await require('./onMessage')(state);
			await require('./onListen')(state);
			await require('./bind')(state);
			state.status = 1;
			console.log('-------SERVER INITIALIZED-------');
			return state;
		},
		app: {
			api: {}
		},
		api: {},
		type: 'server',
		statusDescriptions: ['off', 'on', 'failed to initialize'],
		status: 0,
		/*
      * A puzzle used to challenge clients to ensure authenticity, connection liveliness, and congestion control.
      * Slow down account creation.
      * Generate crypto currency for the Identity Registrar.
    */
		puzzleFlag: Buffer.from('0'),
		/*
      * IPv6 preferred.
    */
		server: dgram.createSocket('udp4'),
		/*
      * All created streams that represent a client to server bi-directional connection.
    */
		streams: new Map(),
		utility: require('Lucy')
	};
	return state.initialize(configure);
};
