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
import dgram from 'dgram';
import { on, off } from './events.js';
import { bindServer } from './bind.js';
import { emit } from './emit.js';
import { onError } from './onError.js';
import { onListen } from './onListen.js';
import { onPacket } from './onPacket.js';
import { sendPacket } from '#udsp/sendPacket';
import { actions } from './actions/index.js';
import { getCertificate, parseCertificate } from '#certificate';
import { randomConnectionId, signKeypairToEncryptKeypair } from '#crypto';
import { cryptography } from '#udsp/cryptography';
const { seal } = Object;
/*
  * socket ID: SID
*/
export class Server {
	constructor(configuration) {
		return this.initialize(configuration);
	}
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
			certificate,
			connectionIdSize
		} = this.configuration;
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
	async setupServer() {
		const ipVersion = this.ipVersion;
		const serverThis = this;
		const socket = dgram.createSocket(ipVersion);
		this.socket = socket;
		// Make sure there is as graceful as possible shutdown
		process.on('beforeExit', (code) => {
			socket.close();
		});
	}
	async calculatePacketOverhead() {
		const packetOverhead = 2;
		this.encryptOverhead = this.cryptography.encryptOverhead;
		this.packetOverhead = packetOverhead + this.encryptOverhead + this.connectionIdSize;
		this.packetMaxPayload = this.maxPacketSize - this.packetOverhead;
		this.packetMaxPayloadSafeEstimate = this.packetMaxPayload - 52;
		console.log(`Packet Overhead: ${this.packetOverhead} bytes`);
		console.log(`connectionIdSize Overhead: ${this.connectionIdSize} bytes`);
	}
	async initialize(configuration) {
		console.log('-------SERVER INITIALIZING-------');
		assign(this, configuration);
		this.configuration = seal(assign({}, configuration));
		info(this.configuration);
		if (!this.id) {
			this.id = randomConnectionId(4);
		} else if (isFunction(this.id)) {
			this.id = await this.id();
		}
		await this.setCertificate();
		await this.configureNetwork();
		await this.calculatePacketOverhead();
		await this.setupServer();
		await this.attachEvents();
		await this.bindServer();
		console.log('-------SERVER INITIALIZED-------');
		return this;
	}
	async send(packet, destination) {
		const config = {
			source: this,
			destination,
			packet
		};
		return sendPacket(config);
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
	description = `The Universal Web's UDSP server module.`;
	descriptor = 'UWServer';
	isServer = true;
	isServerEnd = true;
	defaultExtension = 'js';
	port = 80;
	ip = '::1';
	realTime = true;
	gracePeriod = 30000;
	maxPacketSize = 1328;
	connectionIdSize = 8;
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
      	* Generate crypto currency or compute work.
    */
	puzzleFlag = false;
	/*
		* IPv6 preferred.
	*/
	ipVersion = 'udp6';
	/*
		* All created clients (clients) represent a client to server bi-directional connection until it is closed by either party.
	*/
	clients = construct(Map);
	clientEvents = construct(Map);
	events = construct(Map);
	streamIdGenerator = construct(UniqID);
}
export async function server(...args) {
	return construct(Server, args);
}
