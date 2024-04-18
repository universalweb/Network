/*
	* App server example
*/
import { app } from '#udsp';
import { currentPath } from '@universalweb/acid';
import { get } from '../udsp/app/methods/get.js';
import { info } from '#logs';
import { listen } from '../udsp/server/listen.js';
import path from 'node:path';
const uwApp = await app({
	// Cluster Mode
	// The main server will be the only server that will be able to accept new connections and will forward them to the relevant server in the cluster acting in part as a load balancer
	// However, the load balancer mode can be turned off and only the clusters will be setup
	scale: {
		// Include thread's ip & port in intro (this ensures the client directly contacts the server instead of the loadbalancer which avoids the need for smart ids)
		updateAddress: true,
		smartIds: true,
		// Each server in the cluster will have a unique port that is incremented by 1 but starting at the clusterPort number connection IDs are modified to include the relevant cluster
		port: 8000,
		// The amount of servers to spawn in the cluster
		size: 1,
		// Amount of connections per server
		connections: 5000,
		// use the default port for the cluster's main point of contact & as the loadbalancer/router
		// default is true when cluster mode is enabled
		// exclusive roundrobin loadbalancer
		// ipc or proxy
		// mode: 'proxy',
	},
	// will listen on ipv4 and ipv6 default is '::1'
	ip: '::',
	// default port or the loadbalancer port
	port: 443,
	// realtime mode - permits establishing a bidirectional real-time connection to clients
	// Must be requested so that it can be denied if the client doesn't meet the requirements
	// realtime: true,
	gracePeriod: 30000,
	// heartbeat is an interval check for when a client must send something to the server to remain connected
	heartbeat: 5000,
	// Max packet retries for a singular request before restarting the request
	maxPacketRetries: 5,
	// max file size in bytes
	maxFileSize: 9000,
	// Max size of a Response
	maxResponseSize: 10000,
	// default file extension default is .js but WWW default is www
	defaultExtension: 'html',
	// Domain certificate to be loaded used for connection encryption
	certificatePath: path.join(currentPath(import.meta), '/certs/universalWeb.cert'),
	publicCertificatePath: path.join(currentPath(import.meta), '/certs/universalWebPublic.cert'),
	// Where to load app resources from
	resourceDirectory: path.join(currentPath(import.meta), 'resources'),
	rootDirectory: currentPath(import.meta),
	clientConnectionIdSize: 4,
});
if (uwApp) {
	uwApp.get((req, resp, client) => {
		info('GET REQUEST APP LEVEL');
		return get(req, resp, client);
	});
	uwApp.listen();
}
// info('App Server Status', appServer);
