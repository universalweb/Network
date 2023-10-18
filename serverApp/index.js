/*
	* App server example
*/
import { server } from '#udsp';
import { info } from '#logs';
import { currentPath } from '@universalweb/acid';
import path from 'path';
const appServer = await server({
	// Cluster Mode
	// The main server will be the only server that will be able to accept new connections and will forward them to the relevant server in the cluster acting in part as a load balancer
	// However, the load balancer mode can be turned off and only the clusters will be setup
	scale: {
		// Each server in the cluster will have a unique port that is incremented by 1 but starting at the clusterPort number connection IDs are modified to include the relevant cluster
		// port: 8888,
		// The amount of servers to spawn in the cluster
		// size: 2,
		// use the default port for the cluster's main point of contact & as the loadbalancer/router
		// default is true when cluster mode is enabled
		// exclusive roundrobin loadbalancer
		mode: 'exclusive',
	},
	encryptConnectionId: false,
	randomId: true,
	// will listen on ipv4 and ipv6 default is '::1'
	ip: '::',
	// default port or the loadbalancer port
	port: 8888,
	// realtime mode - permits establishing a bidirectional real-time connection to clients
	// Must be requested so that it can be denied if the client doesn't meet the requirements
	// realtime: true,
	gracePeriod: 30000,
	// Max packet retries for a singular request before restarting the request
	maxPacketRetries: 5,
	// max file size in bytes
	maxFileSize: 9000,
	// Max size of a Response
	maxResponseSize: 10000,
	// default file extension default is .js but WWW default is www
	defaultExtension: 'html',
	// Domain certificate to be loaded used for connection encryption
	certificatePath: path.join(currentPath(import.meta), '../services/universal.web-Ephemeral.cert'),
	// Public Domain certificate to be sent in its raw format for validation when a client connects but doesn't have a certificate
	certificatePublicPath: path.join(currentPath(import.meta), '../services/universal.web-EphemeralPublic.cert'),
	// Where to load app resources from
	resourceDirectory: path.join(currentPath(import.meta), 'resources'),
	rootDirectory: currentPath(import.meta),
	// Reserve the first two bytes of the connection ID for smart routing on the server such as for load balancing and internal routing
	// reservedConnectionIdSize: 2
});
// info('App Server Status', appServer);
