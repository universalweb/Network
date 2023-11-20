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
	eachArray,
	isPromise
} from '@universalweb/acid';
import {
	toBase64,
	randomBuffer
} from '#crypto';
import { encodePacket } from '#udsp/encoding/encodePacket';
import { sendPacket } from '#udsp/sendPacket';
import { Reply } from '#udsp/request/reply';
import { calculatePacketOverhead } from '#udsp/calculatePacketOverhead';
import { processFrame } from '#udsp/processFrame';
/**
	* @TODO
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
		info(`socket EVENT -> created - ID:${this.connectionIdString}`);
	}
	async connected() {
		const server = this.server();
		await connected(this, server);
		success(`socket EVENT -> connected - ID:${this.connectionIdString}`);
	}
	async generateSessionKeypair() {
		const newKeypair = this.cipherSuite.keypair();
		this.newKeypair = newKeypair;
		info(`socket EVENT -> reKey - ID:${this.connectionIdString}`);
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
		msgSent(`socket Sent -> ID: ${this.connectionIdString}`);
		return sendPacket(frame, this, this.socket(), this.destination, headers, footer);
	}
	async received(frame, frameHeaders) {
		const server = this.server();
		await received(this, frame, frameHeaders, server);
		info(`socket EVENT -> send - ID:${this.connectionIdString}`);
	}
	async authenticate(packet) {
	}
	async destroy(destroyCode) {
		const server = this.server();
		await destroy(this, destroyCode, server);
		info(`socket EVENT -> destroy - ID:${this.connectionIdString}`);
	}
	// CLIENT HELLO
	async intro(frame) {
		info(`Client Intro -> - ID:${this.connectionIdString}`, frame);
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
	async reply(frame, header) {
		const processingFrame = await processFrame(frame, header, this, this.requestQueue);
		if (processingFrame === false) {
			const replyObject = new Reply(frame, header, this);
			console.log('New reply object created', replyObject);
			if (isFalse(replyObject)) {
				failed('Reply creation failed');
				console.trace();
				return;
			}
			replyObject.onFrame(frame, header);
		}
	}
	pending = false;
	state = 0;
	encryptConnectionId = false;
	randomId = randomBuffer(8);
	data = construct(Map);
	requestQueue = construct(Map);
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
