import {
	UniqID,
	assign,
	construct,
	eachArray,
	hasValue,
	isArray,
	isFalse,
	isFalsy,
	isPromise,
	isUndefined,
	promise
} from '@universalweb/acid';
import { createEvent, removeEvent, triggerEvent } from '../../events.js';
import {
	failed,
	imported,
	info,
	msgReceived,
	msgSent,
	success
} from '#logs';
import {
	randomBuffer,
	toBase64
} from '#crypto';
import { Reply } from '#udsp/request/reply';
import { calculatePacketOverhead } from '#udsp/calculatePacketOverhead';
import { connected } from './connected.js';
import { created } from './created.js';
import { destroy } from './destroy.js';
import { encodePacket } from '#udsp/encoding/encodePacket';
import { initialize } from './initialize.js';
import { processFrame } from '#udsp/processFrame';
import { received } from './received.js';
import { sendPacket } from '#udsp/sendPacket';
/**
 * @TODO
 */
export class Client {
	constructor(config) {
		const {
			server,
			app
		} = config;
		const client = this;
		const {
			requestMethods,
			cipherSuites,
			publicKeyCryptography,
			encryptClientConnectionId,
			encryptServerConnectionId,
			connectionIdSize,
		} = server;
		this.server = function() {
			return server;
		};
		this.app = function() {
			return app;
		};
		this.requestMethods = requestMethods;
		this.socket = server.socket;
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
	on(eventName, eventMethod) {
		return createEvent(this.events, eventName, eventMethod);
	}
	off(eventName, eventMethod) {
		return removeEvent(this.events, eventName, eventMethod);
	}
	triggerEvent(eventName, arg) {
		success(`CLIENT EVENT -> ${eventName} - ID:${this.connectionIdString}`);
		return triggerEvent(this.events, eventName, this, arg);
	}
	async created() {
		await created(this);
	}
	async connected() {
		await connected(this);
	}
	async generateSessionKeypair() {
		const newKeypair = this.cipherSuite.keypair();
		this.newKeypair = newKeypair;
		info(`CLIENT EVENT -> reKey - ID:${this.connectionIdString}`);
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
		console.log(`CLIENT State Updated -> ${this.state}`);
		this.state = state;
	}
	async send(frame, headers, footer) {
		msgSent(`socket Sent -> ID: ${this.connectionIdString}`);
		return sendPacket(frame, this, this.socket, this.destination, headers, footer);
	}
	async received(frame, frameHeaders) {
		info(`socket EVENT -> send - ID:${this.connectionIdString}`);
		return received(this, frame, frameHeaders);
	}
	async authenticate(frame, frameHeaders) {
	}
	async destroy(destroyCode) {
		info(`socket EVENT -> destroy - ID:${this.connectionIdString}`);
		return destroy(this, destroyCode);
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
	// PFS
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
