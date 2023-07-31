import { connected } from './connected.js';
import { initialize } from './initialize.js';
import { created } from './created.js';
import { destroy } from './destroy.js';
import { connectionStatus } from './connectionStatus.js';
import { received } from './received.js';
import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import {
	UniqID, construct, assign, promise, isFalse, isUndefined, isFalsy
} from '@universalweb/acid';
import {
	keypair,
	toBase64,
	serverSessionKeys,
	randomBuffer
} from '#crypto';
import { encodePacket } from '#udsp/encodePacket';
import { sendPacket } from '#udsp/sendPacket';
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
		return initialize(config, client);
	}
	async created() {
		const server = this.server();
		await created(this, server);
		info(`socket EVENT -> created - ID:${this.id}`);
	}
	async connected() {
		const server = this.server();
		await connected(this, server);
		success(`socket EVENT -> connected - ID:${this.id}`);
	}
	async status() {
		const server = this.server();
		await connectionStatus(this);
		info(`socket EVENT -> statusUpdate - ID:${this.id}`);
	}
	async generateSessionKeypair() {
		const newKeypair = this.cryptography.keypair();
		this.newKeypair = newKeypair;
		info(`socket EVENT -> reKey - ID:${this.id}`);
	}
	async setSessionKeys() {
		console.log(this.destination);
		const sessionKeys = this.cryptography.serverSessionKeys(this.encryptKeypair, this.destination.encryptKeypair, this.sessionKeys);
		if (isUndefined(this.sessionKeys)) {
			this.sessionKeys = sessionKeys;
		}
		success(`receiveKey: ${toBase64(this.sessionKeys.receiveKey)}`);
		success(`transmitKey: ${toBase64(this.sessionKeys.transmitKey)}`);
	}
	updateState(state) {
		this.state = state;
	}
	async send(message, headers, footer) {
		msgSent(`socket Sent -> ID: ${this.id}`);
		return sendPacket(message, this, this.socket(), this.destination, headers, footer);
	}
	async received(message, frameHeaders) {
		const server = this.server();
		await received(this, message, frameHeaders, server);
		info(`socket EVENT -> send - ID:${this.id}`);
	}
	async authenticate(packet) {
	}
	async destroy(destroyCode) {
		const server = this.server();
		await destroy(this, destroyCode, server);
		info(`socket EVENT -> destroy - ID:${this.id}`);
	}
	async intro(message) {
		this.sendIntro(message);
	}
	// server intro to client with connection id and new keypair
	async sendIntro(introMessage) {
		info(`Client Intro Sent -> - ID:${this.id}`);
		if (isFalsy(this.newKeypairGenerated)) {
			this.generateSessionKeypair();
			this.newKeypairGenerated = true;
		}
		const message = {
			intro: true,
			scid: this.id,
			reKey: this.newKeypair.publicKey,
			randomId: this.randomId
		};
		await this.send(message);
	}
	// client confirmation of server intro
	async handshake(message) {
		if (isFalsy(this.newSessionKeysAssigned)) {
			await this.attachNewKey();
		}
		this.sendHandshake();
	}
	async attachNewKey() {
		this.encryptKeypair = this.newKeypair;
		await this.setSessionKeys();
		this.newSessionKeysAssigned = true;
	}
	// server confirmation of handshake to client
	async sendHandshake(originalMessage) {
		const message = {
			handshake: true
		};
		await this.send(message);
	}
	chunkCertificate(certificate) {
	}
	proccessProtocolPacket(message) {
		info(`Client Intro -> - ID:${this.id}`);
		const {
			intro,
			certRequest,
			handshake,
			handshakeFinale
		} = message;
		if (intro) {
			this.state = 1;
			this.intro(message);
		} else if (handshake) {
			this.handshake(message);
		}
	}
	description = `Server's client`;
	type = 'serverClient';
	isServerClient = true;
	isServerEnd = true;
	pending = false;
	packetIdGenerator = construct(UniqID);
	state = 0;
	encryptConnectionId = false;
	randomId = randomBuffer(8);
}
export async function createClient(config) {
	const client = await construct(Client, [config]);
	success(`Client has been created with sever connection id ${toBase64(client.id)}`);
	return client;
}
