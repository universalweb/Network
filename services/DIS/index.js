import { createServer } from '../udsp/server/index.js';
const server = await createServer({
	maxMTU: 1100,
	max: 900,
	// DIS server Domain certificate to be loaded used for connection encryption
	profile: `${__dirname}/../services/universal.web.cert`,
	// Where to load app resources from
	resourceDirectory: `${__dirname}/resources`,
	// DIS Server ID used for load balancing and attaching to the end of connection IDs
	id: '0',
	onConnectMessage: `Welcome to the Universal Web.`,
	port: 8888,
});
server.infoLog('DIS Server', server);
