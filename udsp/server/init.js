import {
	construct, each, assign, UniqID, isFunction, currentPath, isTrue, hasValue
} from '@universalweb/acid';
import {
	success,
	failed,
	imported,
	msgSent,
	info,
	msgReceived
} from '#logs';
import { on, off } from './events.js';
import { listen } from './listen.js';
import { onError } from './onError.js';
import { onListen } from './onListen.js';
import { onPacket } from './onPacket.js';
import { sendPacket } from '#udsp/sendPacket';
import { requestMethods } from './methods/index.js';
import { getCertificate, parseCertificate, loadCertificate } from '#certificate';
import { randomBuffer, toBase64 } from '#crypto';
import { UDSP } from '#udsp/base';
import { processPublicKey, getAlgorithm, getPublicKeyAlgorithm } from '../cryptoMiddleware/index.js';
import { decode } from '#utilities/serialize';
const { seal } = Object;
// The Universal Web's UDSP server module.
export class Server extends UDSP {
	constructor(configuration) {
		super(configuration);
		// console.log = () => {};
		return this.initialize(configuration);
	}
	static description = 'UW Server Module';
	static type = 'server';
	isServer = true;
	isServerEnd = true;
	onLoadbalancer(packet, addressInfo) {
		const message = decode(packet);
		if (message) {
			console.log(message, decode(message[0]), addressInfo);
		}
	}
	off = off;
	attachEvents() {
		const thisServer = this;
		this.addRequestMethod(requestMethods);
		this.socket.on('error', (err) => {
			return thisServer.onError(err);
		});
		this.socket.on('listening', () => {
			return thisServer.onListen();
		});
		if (this.isPrimary) {
			this.socket.on('message', (packet, rinfo) => {
				// return thisServer.onLoadbalancer(packet, rinfo);
				return thisServer.onPacket(packet, rinfo);
			});
		} else {
			this.socket.on('message', (packet, rinfo) => {
				return thisServer.onPacket(packet, rinfo);
			});
		}
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
			configuration,
			configuration: {
				certificatePath,
				certificatePublicPath
			}
		} = this;
		if (certificatePath) {
			this.certificate = await parseCertificate(certificatePath);
			console.log(this.certificate);
			this.keypair = {
				publicKey: this.certificate.publicKey,
				privateKey: this.certificate.privateKey,
			};
			if (this.certificate.ipVersion) {
				this.ipVersion = this.certificate.ipVersion;
			}
		}
		if (certificatePublicPath) {
			this.certificatePublic = await loadCertificate(certificatePublicPath);
			this.certificatePublicSize = this.certificatePublic.length;
			this.chunkCertificate();
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
		const { configuration } = this;
		const port = configuration.port;
		const ip = configuration.ip;
		if (configuration.ip) {
			this.ip = ip;
		}
		this.port = port;
		console.log('Config Network', this.ip, this.port);
	}
	configConnectionId() {
		const {
			reservedConnectionIdSize,
			isWorker,
			coreCount
		} = this;
		if (isWorker) {
			if (!reservedConnectionIdSize) {
				this.reservedConnectionIdSize = (coreCount);
			}
		}
		if (!this.id) {
			this.id = randomBuffer(4);
		} else if (isFunction(this.id)) {
			this.id = this.id();
		}
	}
	async initialize(configuration) {
		console.log('-------SERVER INITIALIZING-------');
		assign(this, configuration);
		this.configuration = seal(assign({}, configuration));
		info(this.configuration);
		this.configConnectionId();
		await this.setCertificate();
		await this.configureNetwork();
		await this.calculatePacketOverhead();
		await this.setupSocket();
		await this.attachEvents();
		console.log('-------SERVER INITIALIZED-------');
		return this;
	}
	async send(packet, destination) {
		return sendPacket(packet, this, this.socket, destination);
	}
	addRequestMethod(methods) {
		const thisServer = this;
		each(methods, (method, methodName) => {
			thisServer.requestMethods.set(methodName, method.bind(thisServer));
		});
	}
	setClientEvent(eventName, callback) {
		this.clientEvents.set(eventName, callback);
	}
	clientEvent(eventName, client) {
		success(`Client Client Event: ${eventName} -> SocketID: ${client.idString}`);
		const foundEvent = this.clientEvents.get(eventName);
		if (foundEvent) {
			foundEvent(this, client);
		}
	}
	on = on;
	listen = listen;
	onError = onError;
	onListen = onListen;
	onPacket = onPacket;
	requestMethods = construct(Map);
	realTime = true;
	socketCount = 0;
	clientCount = 0;
	port = 80;
	ip = '::1';
	connectionIdSize = 8;
	/*
		* All created clients (clients) represent a client to server bi-directional connection until it is closed by either party.
	*/
	clients = construct(Map);
	clientEvents = construct(Map);
}
export async function server(...args) {
	return construct(Server, args);
}
