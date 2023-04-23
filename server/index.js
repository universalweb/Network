import { construct, each, UniqID } from 'Acid';
import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { currentPath } from '#utilities/directory.js';
import dgram from 'dgram';
import { addApi, removeApi } from './api.js';
import { bindServer } from './bind.js';
import { chunkMessage } from './chunkMessage.js';
import { configure } from './configure.js';
import { emit } from './emit.js';
import { onError } from './onError.js';
import { onListen } from './onListen.js';
import { onPacket } from './onPacket.js';
import { sendPacket } from './sendPacket.js';
import { actions } from './actions/index.js';
/*
  * socket ID: SID
*/
export class Server {
	constructor(serverConfiguration) {
		return this.initialize(serverConfiguration);
	}
	bindMethods(methods) {
		const thisContext = this;
		each(methods, (methodName, method) => {
			thisContext[methodName] = method.bind(thisContext);
		});
	}
	bindActions(methods) {
		const thisContext = this;
		each(methods, (methodName, method) => {
			thisContext.actions[methodName] = method.bind(thisContext);
		});
	}
	async initialize(serverConfiguration) {
		console.log('-------SERVER INITIALIZING-------');
		// convert some to just using them as modules with arguments instead of bind/this
		this.bindMethods({
			addApi,
			bindServer,
			onError,
			onListen,
			onPacket,
			removeApi,
			sendPacket,
			emit,
		});
		this.bindActions(actions);
		this.profile = await this.certificate.get(serverConfiguration.profile);
		configure(this);
		console.log(this.profile);
		this.status = 1;
		this.server.on('error', this.onError);
		this.server.on('listening', this.onListen);
		this.server.on('message', this.onPacket);
		await this.bindServer(actions);
		console.log('-------SERVER INITIALIZED-------');
		return this;
	}
	configuration = {};
	serverPath = currentPath(import.meta);
	app = {
		api: new Map()
	};
	packetCount = 0;
	messageCount = 0;
	socketCount = 0;
	clientCount = 0;
	actions = {};
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
		* All created clients (nodes) represent a client to server bi-directional connection until it is closed by either party.
	*/
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
	events = {};
	packetIdGenerator = construct(UniqID);
	streamIdGenerator = construct(UniqID);
}
export async function createServer(...args) {
	return construct(Server, ...args);
}
