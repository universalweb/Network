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
import { calculatePacketOverhead } from '../../calculatePacketOverhead.js';
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
			encryptServerConnectionId,
			connectionIdSize,
		} = server;
		this.events = events;
		this.requestMethods = requestMethods;
		this.cipherSuites = cipherSuites;
		this.publicKeyCryptography = publicKeyCryptography;
		this.connectionIdSize = connectionIdSize;
		if (hasValue(encryptClientConnectionId)) {
			this.encryptClientConnectionId = encryptClientConnectionId;
		}
		if (hasValue(encryptServerConnectionId)) {
			this.encryptServerConnectionId = encryptServerConnectionId;
		}
		return this.initialize(config);
	}
	description = `Server's client`;
	type = 'serverClient';
	isServerClient = true;
	isServerEnd = true;
	initialize = initialize;
	async calculatePacketOverhead() {
		return calculatePacketOverhead(this.cipherSuite, this.destination.connectionIdSize, this.destination);
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
	async send(frame, headers, footer) {
		msgSent(`socket Sent -> ID: ${this.idString}`);
		return sendPacket(frame, this, this.socket(), this.destination, headers, footer);
	}
	async received(frame, frameHeaders) {
		const server = this.server();
		await received(this, frame, frameHeaders, server);
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
	async processIntro(frame) {
		info(`Client Intro -> - ID:${this.idString}`, frame);
		this.sendIntro(frame);
	}
	// SERVER HELLO
	async sendIntro() {
		if (!this.newKeypair) {
			this.generateSessionKeypair();
		}
		const frame = [false, 0, this.id, this.newKeypair.publicKey, this.randomId];
		this.updateState(1);
		await this.send(frame);
	}
	async attachNewClientKeys() {
		this.updateState(2);
		this.encryptionKeypair = this.newKeypair;
		await this.setSessionKeys();
		this.newSessionKeysAssigned = true;
	}
	proccessProtocolPacket(frame) {
		info(`Server:Client proccessProtocolPacket -> - ID:${this.idString}`);
		console.log(frame);
		if (!frame || !isArray(frame)) {
			console.trace('No frame given');
			return;
		}
		const [streamid, rpc] = frame;
		if (rpc === 0) {
			this.processIntro(frame);
		} else {
			console.log(frame);
			console.trace('RPC Code missing or incorrect');
			return;
		}
	}
	async reply(frame, header) {
		const id = frame[0];
		console.log('Reply Client', id, this.replyQueue.has(id), frame);
		if (hasValue(id)) {
			if (this.replyQueue.has(id)) {
				return this.replyQueue.get(id).onFrame(frame, header);
			}
		}
		reply(frame, header, this).onFrame(frame, header);
	}
	pending = false;
	state = 0;
	encryptConnectionId = false;
	randomId = randomBuffer(8);
	data = construct(Map);
	replyQueue = construct(Map);
	destination = {
		overhead: {},
	};
}
export async function createClient(config) {
	info('Creating Client');
	console.log(config.packet?.id?.toString('base64'));
	const client = await construct(Client, [config]);
	success(`Client has been created with sever connection id ${toBase64(client.id)}`);
	return client;
}
