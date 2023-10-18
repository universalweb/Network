import { connected } from './connected.js';
import { initialize } from './initialize.js';
import { created } from './created.js';
import { destroy } from './destroy.js';
import { received } from './received.js';
import {
	success,
	failed,
	imported,
	msgSent,
	info,
	msgReceived
} from '#logs';
import {
	UniqID,
	construct,
	assign,
	promise,
	isFalse,
	isUndefined,
	isFalsy,
	hasValue,
	isArray,
	eachArray
} from '@universalweb/acid';
import {
	toBase64,
	randomBuffer
} from '#crypto';
import { encodePacket } from '#udsp/encoding/encodePacket';
import { sendPacket } from '#udsp/sendPacket';
import { reply } from '#udsp/request/reply';
/* TODO
	- Add support for changing connection id sizes for clients (char type limits int, string, both)
	- smaller cid size for clients
	- New stream id generation to keep them small but need better way to handle large amounts of ids for fatser selection
*/
export class Client {
	constructor(config) {
		const { server } = config;
		const client = this;
		this.server = function() {
			return server;
		};
		this.socket = function() {
			return server.socket;
		};
		const {
			events,
			requestMethods,
			cipherSuites,
			publicKeyCryptography,
			encryptClientConnectionId,
			encryptServerConnectionId
		} = server;
		this.events = events;
		this.requestMethods = requestMethods;
		this.cipherSuites = cipherSuites;
		this.publicKeyCryptography = publicKeyCryptography;
		if (hasValue(encryptClientConnectionId)) {
			this.encryptClientConnectionId = encryptClientConnectionId;
		}
		if (hasValue(encryptServerConnectionId)) {
			this.encryptServerConnectionId = encryptServerConnectionId;
		}
		return this.initialize(config);
	}
	initialize = initialize;
	async calculatePacketOverhead() {
		const server = this.server();
		const {
			maxPacketSize,
			maxPacketDataSize,
			maxPacketHeadSize,
			maxPacketPathSize,
			maxPacketParametersSize,
			packetMaxPayloadSafeEstimate
		} = server;
		const {
			cipherSuite,
			cipherSuiteName,
		} = this;
		const cachedCipherSuitePacketOverhead = server.cachedPacketSizes[cipherSuiteName];
		if (cachedCipherSuitePacketOverhead) {
			return assign(this, cachedCipherSuitePacketOverhead);
		}
		const encryptOverhead = cipherSuite?.encrypt?.overhead || 0;
		console.log('encryptOverhead', encryptOverhead);
		if (hasValue(encryptOverhead)) {
			this.encryptOverhead = encryptOverhead;
		}
		if (maxPacketSize) {
			this.maxPacketSize = maxPacketSize - encryptOverhead;
		}
		if (maxPacketDataSize) {
			this.maxPacketDataSize = maxPacketDataSize - encryptOverhead;
		}
		if (maxPacketHeadSize) {
			this.maxPacketHeadSize = maxPacketHeadSize - encryptOverhead;
		}
		if (maxPacketPathSize) {
			this.maxPacketPathSize = maxPacketPathSize - encryptOverhead;
		}
		if (maxPacketParametersSize) {
			this.maxPacketHeadSize = maxPacketParametersSize - encryptOverhead;
		}
		if (packetMaxPayloadSafeEstimate) {
			this.packetMaxPayloadSafeEstimate = packetMaxPayloadSafeEstimate - encryptOverhead;
		}
	}
	async created() {
		const server = this.server();
		await created(this, server);
		info(`socket EVENT -> created - ID:${this.idString}`);
	}
	async connected() {
		const server = this.server();
		await connected(this, server);
		success(`socket EVENT -> connected - ID:${this.idString}`);
	}
	async generateSessionKeypair() {
		const newKeypair = this.cipherSuite.keypair();
		this.newKeypair = newKeypair;
		info(`socket EVENT -> reKey - ID:${this.idString}`);
	}
	async setSessionKeys() {
		console.log(this.destination);
		console.log(this);
		const sessionKeys = this.publicKeyCryptography.serverSessionKeys(this.encryptionKeypair, this.destination.encryptionKeypair, this.sessionKeys);
		if (isUndefined(this.sessionKeys)) {
			this.sessionKeys = sessionKeys;
		}
		success(`receiveKey: ${toBase64(this.sessionKeys.receiveKey)}`);
		success(`transmitKey: ${toBase64(this.sessionKeys.transmitKey)}`);
	}
	updateState(state) {
		console.log(`State Updated -> ${this.state}`);
		this.state = state;
	}
	async send(message, headers, footer) {
		msgSent(`socket Sent -> ID: ${this.idString}`);
		return sendPacket(message, this, this.socket(), this.destination, headers, footer);
	}
	async received(message, frameHeaders) {
		const server = this.server();
		await received(this, message, frameHeaders, server);
		info(`socket EVENT -> send - ID:${this.idString}`);
	}
	async authenticate(packet) {
	}
	async destroy(destroyCode) {
		const server = this.server();
		await destroy(this, destroyCode, server);
		info(`socket EVENT -> destroy - ID:${this.idString}`);
	}
	// CLIENT HELLO
	async processIntro(message) {
		info(`Client Intro -> - ID:${this.idString}`, message);
		this.sendIntro(message);
	}
	// SERVER HELLO
	async sendIntro() {
		if (!this.newKeypair) {
			this.generateSessionKeypair();
		}
		const message = [0, this.id, this.newKeypair.publicKey, this.randomId];
		this.updateState(1);
		await this.send(message);
	}
	async attachNewClientKeys() {
		this.updateState(2);
		this.encryptionKeypair = this.newKeypair;
		await this.setSessionKeys();
		this.newSessionKeysAssigned = true;
	}
	proccessProtocolPacket(message) {
		info(`Server:Client proccessProtocolPacket -> - ID:${this.idString}`);
		console.log(message);
		if (!message || !isArray(message)) {
			console.trace('No message given');
			return;
		}
		const [streamid, rpc] = message;
		if (rpc === 0) {
			this.processIntro(message);
		} else {
			console.log(message);
			console.trace('RPC Code missing or incorrect');
			return;
		}
	}
	description = `Server's client`;
	type = 'serverClient';
	isServerClient = true;
	isServerEnd = true;
	pending = false;
	state = 0;
	encryptConnectionId = false;
	randomId = randomBuffer(8);
	data = construct(Map);
	replyQueue = construct(Map);
	async reply(frame, header) {
		const id = frame.id;
		console.log('Reply Client', id, this.replyQueue.has(id), frame);
		if (hasValue(id)) {
			if (this.replyQueue.has(id)) {
				return this.replyQueue.get(id).onFrame(frame, header);
			}
		}
		reply(frame, this).onFrame(frame, header);
	}
}
export async function createClient(config) {
	const client = await construct(Client, [config]);
	success(`Client has been created with sever connection id ${toBase64(client.id)}`);
	return client;
}
