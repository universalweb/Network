import {
	construct, each, assign, UniqID
} from 'Acid';
import {
	success, failed, imported, msgSent, info, msgReceived
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
		this.configuration = seal(assign({}, configuration));
		console.log(this.configuration);
		assign(this, this.configuration);
		this.server = dgram.createSocket(this.ipVersion);
		// convert some to just using them as modules with arguments instead of bind/this
		console.log(this.description);
		this.bindMethods({
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
		this.bindActions(actions);
		if (configuration.profile) {
			this.profile = await getCertificate(configuration.profile);
		}
		configure(this);
		this.server.on('error', this.onError);
		this.server.on('listening', this.onListen);
		this.server.on('message', this.onPacket);
		await this.bindServer();
		console.log('-------SERVER INITIALIZED-------');
		return this;
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
