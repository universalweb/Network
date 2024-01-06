// The Universal Web's UDSP server module.
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
import { getAlgorithm, getPublicKeyAlgorithm, processPublicKey } from '../cryptoMiddleware/index.js';
import { getCertificate, loadCertificate, parseCertificate } from '#certificate';
import { randomBuffer, toBase64 } from '#crypto';
import { UDSP } from '#udsp/base';
import { createClient } from './clients/index.js';
import { decodePacketHeaders } from '#udsp/encoding/decodePacket';
import { listen } from './listen.js';
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
	chunkCertificate() {
		const certificate = this.publicCertificate;
		let currentBytePosition = 0;
		let index = 0;
		const size = this.publicCertificateSize;
		const chunks = [];
		const maxSize = 1000;
		while (currentBytePosition < size) {
			const message = {};
			const endIndex = currentBytePosition + maxSize;
			const safeEndIndex = endIndex > size ? size : endIndex;
			message.head = certificate.subarray(currentBytePosition, safeEndIndex);
			message.headSize = message.head.length;
			chunks[index] = message;
			if (safeEndIndex === size) {
				message.last = true;
				break;
			}
			index++;
			currentBytePosition += maxSize;
		}
		this.certificateChunks = chunks;
	}
	async setCertificate() {
		const {
			options,
			options: { certificatePath, }
		} = this;
		if (certificatePath) {
			this.certificate = await parseCertificate(certificatePath);
			console.log(this.certificate);
			this.certificatePublic = this.certificate.certificate;
			this.keypair = {
				publicKey: this.certificate.publicKey,
				privateKey: this.certificate.privateKey,
			};
			if (this.certificate.ipVersion) {
				this.ipVersion = this.certificate.ipVersion;
			}
		}
		if (this.certificate) {
			this.publicKeyCryptography = getPublicKeyAlgorithm(this.certificate.publicKeyAlgorithm);
			const convertSignKeypairToEncryptionKeypair = processPublicKey(this.certificate);
			if (convertSignKeypairToEncryptionKeypair) {
				this.encryptionKeypair = convertSignKeypairToEncryptionKeypair;
			}
			const { encryptConnectionId } = this.certificate;
			if (encryptConnectionId) {
				const {
					server: encryptServerCid,
					client: encryptClientCid,
					keypair: connectionIdKeypair
				} = encryptConnectionId;
				let encryptServer = hasValue(encryptServerCid);
				let encryptClient = hasValue(encryptClientCid);
				if (!encryptServer && !encryptClient) {
					encryptServer = true;
					encryptClient = true;
				}
				if (encryptServer) {
					this.encryptServerConnectionId = true;
					if (connectionIdKeypair) {
						this.connectionIdKeypair = connectionIdKeypair;
					} else {
						this.connectionIdKeypair = this.encryptionKeypair;
					}
				}
				if (encryptClient) {
					this.encryptClientConnectionId = true;
				}
				console.log(`Encrypt Connection ID Server ${encryptServer} Client ${encryptClient}`);
			}
		}
		console.log('publicKeyCryptography', this.publicKeyCryptography);
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
		info(this.options);
		this.configConnectionId();
		await this.setCertificate();
		await this.configureNetwork();
		await this.setupSocket();
		await this.attachEvents();
		console.log('-------SERVER INITIALIZED-------');
		return this;
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
		process.send(encode(['state', {
			clientCount
		}]));
	}
	on(eventName, eventMethod) {
		return createEvent(this.events, eventName, eventMethod);
	}
	off(eventName, eventMethod) {
		return removeEvent(this.events, eventName, eventMethod);
	}
	triggerEvent(eventName, arg) {
		success(`SERVER EVENT -> ${eventName} - ID:${this.connectionIdString}`);
		return triggerEvent(this.events, eventName, this, arg);
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
	async client(config, id, idString, connection) {
		if (id.length === this.connectionIdSize) {
			const existingClient = this.clients.get(idString);
			if (existingClient) {
				config.destination = existingClient;
				if (existingClient.state === 1) {
					await existingClient.attachNewClientKeys();
				}
				return existingClient;
			}
			if (config.packetDecoded.headerRPC === 0) {
				return this.createClient(config, idString, connection);
			}
			return false;
		}
		return this.createClient(config, idString, connection);
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
	connectionIdSize = 8;
	events = new Map();
	/*
		* All created clients (clients) represent a client to server bi-directional connection until it is closed by either party.
	*/
	clients = construct(Map);
}
export async function server(...args) {
	return construct(Server, args);
}
