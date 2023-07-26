/*
	* App server example
*/
import { server } from '#udsp';
import { info } from '#logs';
import { currentPath } from '@universalweb/acid';
import path from 'path';
const appServer = await server({
	encryptConnectionId: true,
	randomId: true,
	// realtime mode - to keep the connection alive for bidirectional communication
	realtime: false,
	gracePeriod: 30000,
	// Source Verification to ensure that data coming from a client is coming from that source
	sourceVerification: true,
	// Max packet retries for a singular request before restarting the request
	maxPacketRetries: 5,
	// Max retries for a singular request before giving up
	maxRequestRetries: 3,
	// Max retries for a singular request before giving up
	maxResponseRetries: 3,
	// Max size of packets
	// maxPacketSize: 1100,
	// Max size of body and head data sections in a single packet
	// maxPayloadSize: 1000,
	// max file size
	maxFileSize: 9000,
	// Max size of a Response
	maxResponseSize: 10000,
	// Max size of a Packet for Responses
	maxResponsePacketSize: 10000,
	// default file extension default is .js but WWW default is www
	defaultExtension: 'html',
	// Domain certificate to be loaded used for connection encryption
	certificate: path.join(currentPath(import.meta), '../services/universal.web-Ephemeral.cert'),
	// Public Domain certificate to be sent in its raw format for validation when a client connects but doesn't have a certificate
	certificatePublic: path.join(currentPath(import.meta), '../services/universal.web-EphemeralPublic.cert'),
	// Where to load app resources from
	resourceDirectory: path.join(currentPath(import.meta), 'resources'),
	// Server ID used for load balancing and attaching to the end of connection IDs
	// id: Buffer.from('alpha'),
	// on connect message to respond with when a connection is established
	onConnectMessage: `Welcome to the Universal Web.`,
	// Port to listen on for connections
	// port: 8888,
	// ip: '::1'
	rootDirectory: currentPath(import.meta)
});
// info('App Server Status', appServer);
