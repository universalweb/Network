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
import cluster from 'node:cluster';
import { destroy } from './destroy.js';
import { encodePacket } from '#udsp/encoding/encodePacket';
import { initialize } from './initialize.js';
import { onConnected } from './onConnected.js';
import { processFrame } from '#udsp/processFrame';
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
	fire(eventName, ...args) {
		success(`CLIENT EVENT -> ${eventName} - ID:${this.connectionIdString}`);
		return triggerEvent(this.events, eventName, this, ...args);
	}
	onConnected = onConnected;
	async generateSessionKeypair() {
		const newKeypair = this.cipherSuite.keypair();
		this.newKeypair = newKeypair;
		info(`CLIENT EVENT -> reKey - ID:${this.connectionIdString}`);
	}
	async setSessionKeys() {
		console.log('Set session keys');
		const sessionKeys = this.publicKeyCryptography.serverSessionKeys(this.encryptionKeypair, this.destination.encryptionKeypair, this.sessionKeys);
		if (isUndefined(this.sessionKeys)) {
			this.sessionKeys = sessionKeys;
		}
		success(`receiveKey: ${toBase64(this.sessionKeys.receiveKey)}`);
		success(`transmitKey: ${toBase64(this.sessionKeys.transmitKey)}`);
	}
	updateState(state) {
		if (this.destroyed) {
			return;
		}
		console.log(`CLIENT State Updated -> ${this.state}`);
		this.state = state;
	}
	async send(frame, headers, footer) {
		msgSent(`socket Sent -> ID: ${this.connectionIdString}`);
		if (this.destroyed) {
			return;
		}
		return sendPacket(frame, this, this.socket, this.destination, headers, footer);
	}
	async authenticate(frame, frameHeaders) {
	}
	close(destroyCode) {
		this.sendEnd();
		this.destroy(destroyCode);
	}
	async destroy(destroyCode) {
		info(`socket EVENT -> destroy - ID:${this.connectionIdString}`);
		return destroy(this, destroyCode);
	}
	sendEnd() {
		if (this.state === 0) {
			return;
		}
		console.log('Sending CLIENT END');
		this.updateState(0);
		return this.send([
			false,
			1
		], false, null, true);
	}
	async end(frame, header) {
		console.log(`Destroying client ${this.connectionIdString}`, frame, header);
		await this.sendEnd();
		await this.destroy(0);
	}
	// CLIENT HELLO
	async intro(frame, header) {
		info(`Client Intro -> - ID:${this.connectionIdString}`, frame, header);
		this.sendIntro(frame, header);
	}
	// SERVER HELLO
	async sendIntro() {
		if (!this.newKeypair) {
			this.generateSessionKeypair();
		}
		const frame = [
			false,
			0,
			this.id,
			this.newKeypair.publicKey,
			this.randomId
		];
		if (cluster.worker) {
			frame.push(true);
		}
		this.updateState(1);
		this.send(frame);
	}
	// CLIENT DISCOVERY
	async discovery(frame, header) {
		info(`Client Discovery -> - ID:${this.connectionIdString}`, frame, header);
		this.sendDiscovery(frame, header);
	}
	// SERVER DISCOVERY
	async sendDiscovery() {
		if (!this.newKeypair) {
			this.generateSessionKeypair();
		}
		const frame = [
			false,
			2,
			this.id,
			this.newKeypair.publicKey,
			this.randomId
		];
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
	async reply(frame, header, rinfo) {
		const processingFrame = await processFrame(frame, header, this, this.requestQueue);
		if (processingFrame === false) {
			const replyObject = new Reply(frame, header, this);
			console.log('New reply object created', replyObject);
			if (isFalse(replyObject)) {
				failed('Reply creation failed');
				console.trace();
				return;
			}
			replyObject.onFrame(frame, header, rinfo);
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
