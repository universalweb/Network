/*
		* App server example
*/
import { createServer } from 'server/index.js';
import { info } from 'utilities/logs.js';
const appServer = await createServer({
	// realtime mode - to keep the connection alive for bidirectional communication
	realtime: true,
	// Source Verification to ensure that data coming from a client is coming from that source
	sourceVerification: true,
	// Max packet retries for a singular request before restarting the request
	maxPacketRetries: 3,
	// Max retries for a singular request before giving up
	maxRequestRetries: 3,
	// Max retries for a singular request before giving up
	maxResponseRetries: 3,
	// Max size of packets
	maxPacketSize: 1100,
	// Max size of a message
	maxMessageSize: 10000,
	// Max size of body and head data sections in packets
	maxPayloadSize: 1000,
	// max data size in a singular packet
	maxFileSize: 900,
	// Domain certificate to be loaded used for connection encryption
	profile: `${__dirname}/../services/universal.web.cert`,
	// Where to load app resources from
	resourceDirectory: `${__dirname}/resources`,
	// Server ID used for load balancing and attaching to the end of connection IDs
	id: '0',
	// on connect message to respond with when a connection is established
	onConnectMessage: `Welcome to the Universal Web.`,
	// Port to listen on for connections
	port: 8888
});
info('App Server Status', appServer);
