import {
	construct,
	each,
	assign,
	UniqID,
	isFunction,
	currentPath,
	isTrue
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
import { bindServer } from './bind.js';
import { emit } from './emit.js';
import { onError } from './onError.js';
import { onListen } from './onListen.js';
import { onPacket } from './onPacket.js';
import { sendPacket } from '#udsp/sendPacket';
import { actions } from './actions/index.js';
import { getCertificate, parseCertificate } from '#certificate';
import { randomBuffer } from '#crypto';
import { cryptography } from '#udsp/cryptography';
import { UDSP } from '#udsp/base';
const { seal } = Object;
/*
  * socket ID: SID
*/
export class Server extends UDSP {
	constructor(configuration) {
		super();
		return this.initialize(configuration);
	}
	description = `The Universal Web's UDSP server module.`;
	type = 'server';
	isServer = true;
	isServerEnd = true;
	on = on;
	bindServer = bindServer;
	onError = onError;
	onListen = onListen;
	onPacket = onPacket;
	off = off;
	emit = emit;
	attachEvents() {
		const thisServer = this;
		this.bindActions(actions);
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
			configuration,
			configuration: {
				certificate,
				connectionIdSize,
				maxPayloadSize,
				maxDataSize,
				maxHeadSize
			}
		} = this;
		if (certificate) {
			this.certificate = await parseCertificate(certificate);
			console.log(this.certificate);
			this.keypair = {
				publicKey: this.certificate.publicKey,
				privateKey: this.certificate.privateKey,
			};
			if (this.certificate.ipVersion) {
				this.ipVersion = this.certificate.ipVersion;
			}
		}
		if (!connectionIdSize) {
			if (this.certificate.connectionIdSize) {
				this.connectionIdSize = this.certificate.connectionIdSize;
			}
		}
		if (!maxPayloadSize) {
			if (this.certificate.maxPayloadSize) {
				this.maxPayloadSize = this.certificate.maxPayloadSize;
			}
		}
		if (!maxDataSize) {
			if (this.certificate.maxDataSize) {
				this.maxDataSize = this.certificate.maxDataSize;
			}
		}
		if (!maxHeadSize) {
			if (this.certificate.maxHeadSize) {
				this.maxHeadSize = this.certificate.maxHeadSize;
			}
		}
		if (this.certificate.cryptography) {
			const cryptoConfig = assign({
				keypair: this.keypair,
				connectionIdSize: this.connectionIdSize,
				connectionIdKeypair: this.connectionIdKeypair,
			}, this.certificate);
			this.cryptography = await cryptography(cryptoConfig);
			if (this.cryptography.encryptionKeypair) {
				this.encryptKeypair = this.cryptography.encryptionKeypair;
			}
			if (this.cryptography.connectionIdKeypair) {
				this.connectionIdKeypair = this.cryptography.connectionIdKeypair;
			}
		}
	}
	async configureNetwork() {
		const { configuration } = this;
		const {
			ip: certIp,
			port: certPort
		} = this.certificate;
		const port = configuration.port || certPort;
		const ip = configuration.ip || certIp;
		console.log('Config Network', ip, port);
		this.ip = ip;
		this.port = port;
	}
	async initialize(configuration) {
		console.log('-------SERVER INITIALIZING-------');
		assign(this, configuration);
		this.configuration = seal(assign({}, configuration));
		info(this.configuration);
		if (!this.id) {
			this.id = randomBuffer(4);
		} else if (isFunction(this.id)) {
			this.id = await this.id();
		}
		await this.setCertificate();
		await this.configureNetwork();
		await this.calculatePacketOverhead();
		await this.setupSocket();
		await this.attachEvents();
		await this.bindServer();
		console.log('-------SERVER INITIALIZED-------');
		return this;
	}
	async send(packet, destination) {
		return sendPacket(packet, this, this.socket, destination);
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
	realTime = true;
	socketCount = 0;
	clientCount = 0;
	port = 80;
	ip = '::1';
	/*
		* All created clients (clients) represent a client to server bi-directional connection until it is closed by either party.
	*/
	clients = construct(Map);
	clientEvents = construct(Map);
}
export async function server(...args) {
	return construct(Server, args);
}
