import { construct, UniqID } from 'Acid';
import {
	success, failed, imported, msgSent, info, msgReceived
} from '../utilities/logs.js';
import { currentPath } from '../utilities/directory.js';
import dgram from 'dgram';
import { configure } from './configure.js';
import { onError } from './onError.js';
import { onMessage } from './onMessage.js';
import { onListen } from './onListen.js';
import { sendPacket } from './sendPacket.js';
import { processSocket } from './processSocket.js';
import { processMessage } from './processMessage.js';
import { bind } from './bind.js';
import { parseMessage } from './parseMessage.js';
import { chunkMessage } from './chunkMessage.js';
import { emit } from './emit.js';
/*
  * socket ID: SID
*/
// require('./api/index.js')(server);
// require('./app/index.js')(server);
// require('./clients/index.js')(server);
class Server {
	constructor(serverConfiguration) {
		return this.initialize(serverConfiguration);
	}
	configure = configure;
	onError = onError;
	onMessage = onMessage;
	onListen = onListen;
	sendPacket = sendPacket;
	async initialize(serverConfiguration) {
		console.log('-------SERVER INITIALIZING-------');
		this.configure(serverConfiguration);
		this.profile = await this.certificate.get(serverConfiguration.profile);
		console.log(this.profile);
		this.status = 1;
		this.server.on('error', this.onError.bind(this));
		this.server.on('listening', this.onListen.bind(this));
		this.server.on('message', this.onMessage.bind(this));
		console.log('-------SERVER INITIALIZED-------');
		return this;
	}
	serverPath = currentPath(import.meta);
	app = {
		api: {}
	};
	count = 0;
	api = {};
	statusDescriptions = ['initializing', 'initialized', 'failed to initialize'];
	state = 0;
	/*
      		* A puzzle used to challenge clients to ensure authenticity, connection liveliness, and congestion control.
      		* Slow down account creation.
      		* Generate crypto currency for the Identity Registrar.
    	*/
	puzzleFlag = false;
	/*
			* IPv6 preferred.
		*/
	server = dgram.createSocket('udp4');
	/*
			* All created clients represent a client to server bi-directional connection.
		*/
	clients = new Map();
	packetIdGenerator = construct(UniqID);
	streamIdGenerator = construct(UniqID);
}
