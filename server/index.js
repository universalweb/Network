/*
  * Stream ID: SID
*/
module.exports = async (configure) => {
	const dgram = require('dgram');
	const state = {
		async initialize(serverConfiguration) {
			console.log('-------SERVER INITIALIZING-------');
			await require('../state')('Server', {
				bufferSize: configure.bufferSize || 2 ** 30
			}, state);
			state.profile = await state.certificate.get(serverConfiguration.profile);
			console.log(state.profile);
			require('../utilities/cleanPath/')(state);
			require('../utilities/propertyAccess/')(state);
			require('../utilities/watch/')(state);
			await require('./configuration')(state, serverConfiguration);
			require('../utilities/pluckBuffer')(state);
			require('./buildPacketSize')(state);
			require('./buildStringSize')(state);
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
		statusDescriptions: ['off', 'on', 'failed to initialize'],
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
      * All created streams that represent a client to server bi-directional connection.
    */
		streams: new Map(),
		utility: require('Lucy')
	};
	return state.initialize(configure);
};
