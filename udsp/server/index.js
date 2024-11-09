import {
	DomainCertificate,
	PublicDomainCertificate
} from '../certificate/domain.js';
// The Universal Web's UDSP server module
import {
	UniqID,
	assign,
	construct,
	currentPath,
	each,
	hasValue,
	isFunction,
	isTrue,
	isUndefined
} from '@universalweb/acid';
import { createEvent, removeEvent, triggerEvent } from '../events.js';
import { decode, encode } from '#utilities/serialize';
import {
	failed,
	imported,
	info,
	msgReceived,
	msgSent,
	success
} from '#logs';
import { introHeaderRPC, isIntroHeader } from '../protocolHeaderRPCs.js';
import { randomBuffer, toBase64 } from '#crypto';
import { UDSP } from '#udsp/base';
import { createClient } from './clients/index.js';
import { decodePacketHeaders } from '#udsp/encoding/decodePacket';
import { defaultServerConnectionIdSize } from '../../defaults.js';
import { listen } from './listen.js';
import { noStreamID } from '../utilities/hasConnectionID.js';
import { onError } from './onError.js';
import { onListen } from './onListen.js';
import { onPacket } from './onPacket.js';
import { requestMethods } from '../app/methods/index.js';
import { sendPacket } from '#udsp/sendPacket';
const { seal } = Object;
/*
	* TODO:
 	* - Add flood protection for spamming new connections with the same connection id
 	* - Add flood protection for spamming new connections from the same origin
	* - Add new loadbalancer algo to distribute connections to servers equally
 */
export class Server extends UDSP {
	constructor(options) {
		// console.log = () => {};
		super(options);
		return this.initialize(options);
	}
	static description = 'UW Server Module';
	static type = 'server';
	isServer = true;
	isServerEnd = true;
	attachEvents() {
		const thisServer = this;
		this.socket.on('error', (err) => {
			return thisServer.onError(err);
		});
		this.socket.on('listening', () => {
			return thisServer.onListen();
		});
		this.socket.on('message', (packet, rinfo) => {
			return thisServer.onPacket(packet, rinfo);
		});
	}
	async setCertificate() {
		const {
			options,
			options: {
				certificatePath,
				publicCertificatePath
			}
		} = this;
		if (certificatePath) {
			this.certificate = await new DomainCertificate(certificatePath);
			console.log(this.certificate);
			this.certificatePublic = await new PublicDomainCertificate(publicCertificatePath);
		}
	}
	async configureNetwork() {
		const { options } = this;
		const port = options.port;
		const ip = options.ip;
		if (options.ip) {
			this.ip = ip;
		}
		this.port = port;
		console.log('Config Network', this.ip, this.port);
	}
	configConnectionId() {
		const {
			isWorker,
			coreCount
		} = this;
		if (isFunction(this.id)) {
			this.id = this.id(this);
			return;
		}
		if (coreCount && this.workerId) {
			const reservedConnectionIdSize = String(coreCount).length;
			this.reservedConnectionIdSize = reservedConnectionIdSize;
			const compiledId = this.workerId.padStart(reservedConnectionIdSize, '0');
			this.id = compiledId;
		} else if (!this.id) {
			this.id = '0';
		}
		console.log('Config Server ID', this.id);
	}
	async initialize(options) {
		console.log('-------SERVER INITIALIZING-------');
		this.initializeBase(options);
		assign(this, options);
		this.options = seal(assign({}, options));
		console.log('OPTIONS', this.options);
		this.configConnectionId();
		await this.setCertificate();
		await this.configCryptography();
		await this.configureNetwork();
		await this.setupSocket();
		await this.attachEvents();
		console.log('-------SERVER INITIALIZED-------');
		return this;
	}
	configCryptography() {
		if (this.certificate) {
			const encryptionKeypair = this.certificate.get('encryptionKeypair');
			this.publicKey = encryptionKeypair.publicKey;
			this.privateKey = encryptionKeypair.privateKey;
			this.version = this.certificate.get('version');
			this.certificate.setCipherSuiteMethods();
		}
	}
	async send(packet, destination) {
		return sendPacket(packet, this, this.socket, destination);
	}
	addRequestMethod(methods) {
	}
	updateWorkerState() {
		this.syncWorkerState();
	}
	syncWorkerState() {
		const { clientCount } = this;
		console.log(`Client count ${clientCount}`);
		process.send(encode([
			'state',
			{
				clientCount
			}
		]));
	}
	on(eventName, eventMethod) {
		return createEvent(this.events, eventName, eventMethod);
	}
	off(eventName, eventMethod) {
		return removeEvent(this.events, eventName, eventMethod);
	}
	fire(eventName, ...args) {
		success(`SERVER EVENT -> ${eventName} - ID:${this.connectionIdString}`);
		return triggerEvent(this.events, eventName, this, ...args);
	}
	addClientCount() {
		this.clientCount++;
		this.updateWorkerState();
	}
	subtractClientCount() {
		this.clientCount--;
		this.updateWorkerState();
	}
	async createClient(config, idString, connection) {
		const client = await createClient({
			server: this,
			connection,
			packet: config.packetDecoded
		});
		if (!client) {
			return console.trace(`Failed to create client for client connection id with ${idString}`);
		}
		config.destination = client;
		this.clients.set(client.connectionIdString, client);
		if (this.isWorker) {
			this.addClientCount();
		}
		console.log('Client Created', this.clientCount);
		return client;
	}
	async client(config, id, idString, rinfo) {
		if (noStreamID(id)) {
			if (isIntroHeader(config.packetDecoded.headerRPC)) {
				return this.createClient(config, idString, rinfo);
			}
		}
		const existingClient = this.clients.get(idString);
		if (existingClient) {
			config.destination = existingClient;
			return existingClient;
		}
		return false;
	}
	async removeClient(client) {
		const { connectionIdString } = client;
		this.clients.delete(connectionIdString);
		this.subtractClientCount();
	}
	listen = listen;
	onError = onError;
	onListen = onListen;
	onPacket = onPacket;
	data = new Map();
	realTime = true;
	clientCount = 0;
	port = 80;
	ip = '::1';
	connectionIdSize = defaultServerConnectionIdSize;
	events = new Map();
	encryption = {};
	/*
		* All created clients (clients) represent a client to server bi-directional connection until it is closed by either party.
	*/
	// SWITCH TO BINARY SEARCH FOR CLIENTS FOR FASTER LOOKUP
	clients = construct(Map);
	initialGracePeriod = 5000;
}
export async function server(...args) {
	return construct(Server, args);
}
