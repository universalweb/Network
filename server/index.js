import {
	construct, each, assign, UniqID
} from 'Acid';
import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { currentPath } from '#utilities/directory.js';
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
/*
  * socket ID: SID
*/
export class Server {
	constructor(serverConfiguration) {
		return this.initialize(serverConfiguration);
	}
	bindMethods(methods) {
		const thisContext = this;
		console.log(methods);
		each(methods, (method, methodName) => {
			console.log();
			thisContext[methodName] = method.bind(thisContext);
		});
	}
	bindActions(methods) {
		const thisContext = this;
		each(methods, (method, methodName) => {
			thisContext.actions.set(methodName, method.bind(thisContext));
		});
	}
	async initialize(configuration) {
		console.log('-------SERVER INITIALIZING-------');
		this.configuration = configuration;
		console.log(this.configuration);
		this.server = dgram.createSocket(this.ipVersion);
		// convert some to just using them as modules with arguments instead of bind/this
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
		this.profile = await getCertificate(configuration.profile);
		configure(this);
		this.server.on('error', this.onError);
		this.server.on('listening', this.onListen);
		this.server.on('message', this.onPacket);
		await this.bindServer();
		console.log('-------SERVER INITIALIZED-------');
		return this;
	}
	id = '0';
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
	ipVersion = 'udp4';
	/*
		* All created clients (nodes) represent a client to server bi-directional connection until it is closed by either party.
	*/
	// clients are referred to as nodes
	nodes = construct(Map);
	nodeEvents = construct(Map);
	setNodeEvent(eventName, callback) {
		this.nodeEvents.set(eventName, callback);
	}
	nodeEvent(eventName, socket) {
		success(`Client Node Event: ${eventName} -> SocketID: ${socket.id}`);
		const foundEvent = this.nodeEvents.get(eventName);
		if (foundEvent) {
			foundEvent(this, socket);
		}
	}
	events = construct(Map);
	packetIdGenerator = construct(UniqID);
	streamIdGenerator = construct(UniqID);
}
export async function createServer(...args) {
	return construct(Server, args);
}
