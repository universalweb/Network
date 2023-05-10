import {
	construct,
	each,
	assign,
	UniqID
} from 'Acid';
import {
	success,
	failed,
	imported,
	msgSent,
	info,
	msgReceived
} from '#logs';
import { currentPath } from '#utilities/directory';
import dgram from 'dgram';
import { on, off } from './events.js';
import { bindServer } from './bind.js';
import { chunkMessage } from './chunkMessage.js';
import { configure } from './configure.js';
import { emit } from './emit.js';
import { onError } from './onError.js';
import { onListen } from './onListen.js';
import { onPacket } from './onPacket.js';
import { sendPacket } from './sendPacket.js';
import { send } from './send.js';
import { actions } from './actions/index.js';
import { getCertificate } from '#certificate';
const { seal } = Object;
/*
  * socket ID: SID
*/
export class Server {
	description = 'Server';
	constructor(serverConfiguration) {
		return this.initialize(serverConfiguration);
	}
	bindMethods(methods) {
		const thisServer = this;
		each(methods, (method, methodName) => {
			thisServer[methodName] = method.bind(thisServer);
		});
	}
	bindActions(methods) {
		const thisServer = this;
		each(methods, (method, methodName) => {
			thisServer.actions.set(methodName, method.bind(thisServer));
		});
	}
	async initialize(configuration) {
		console.log('-------SERVER INITIALIZING-------');
		const thisServer = this;
		thisServer.configuration = seal(assign({}, configuration));
		console.log(thisServer.configuration);
		assign(thisServer, thisServer.configuration);
		thisServer.server = dgram.createSocket(thisServer.ipVersion);
		thisServer.bindMethods({
			on,
			bindServer,
			onError,
			onListen,
			onPacket,
			off,
			sendPacket,
			emit,
			send
		});
		thisServer.bindActions(actions);
		if (configuration.profile) {
			thisServer.profile = await getCertificate(configuration.profile);
		}
		configure(thisServer);
		thisServer.server.on('error', thisServer.onError);
		thisServer.server.on('listening', thisServer.onListen);
		thisServer.server.on('message', thisServer.onPacket);
		await thisServer.bindServer();
		process.on('beforeExit', (code) => {
			thisServer.server.close();
		});
		process.on('exit', (code) => {
			thisServer.server.close();
		});
		console.log('-------SERVER INITIALIZED-------');
		return thisServer;
	}
	realTime = true;
	gracePeriod = 30000;
	id = 0;
	maxMTU = 1000;
	encoding = 'utf8';
	max = 1000;
	maxPayloadSize = 1000;
	serverPath = currentPath(import.meta);
	packetCount = 0;
	messageCount = 0;
	socketCount = 0;
	clientCount = 0;
	actions = construct(Map);
	stateCodeDescriptions = ['initializing', 'initialized', 'failed to initialize'];
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
	ipVersion = 'udp6';
	/*
		* All created clients (clients) represent a client to server bi-directional connection until it is closed by either party.
	*/
	// clients are referred to as clients
	clients = construct(Map);
	clientEvents = construct(Map);
	setClientEvent(eventName, callback) {
		this.clientEvents.set(eventName, callback);
	}
	clientEvent(eventName, client) {
		success(`Client Client Event: ${eventName} -> SocketID: ${client.id}`);
		const foundEvent = this.clientEvents.get(eventName);
		if (foundEvent) {
			foundEvent(this, client);
		}
	}
	events = construct(Map);
	streamIdGenerator = construct(UniqID);
	// default file extension default is .js but WWW default is www
	defaultExtension = 'js';
	port = 80;
	ip = '::1';
}
export async function createServer(...args) {
	return construct(Server, args);
}
