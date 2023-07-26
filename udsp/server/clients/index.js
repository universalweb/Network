import { connected } from './connected.js';
import { initialize } from './initialize.js';
import { created } from './created.js';
import { destroy } from './destroy.js';
import { reKey } from './reKey.js';
import { connectionStatus } from './connectionStatus.js';
import { received } from './received.js';
import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import {
	UniqID, construct, assign, promise
} from '@universalweb/acid';
import { keypair, toBase64 } from '#crypto';
import { encodePacket } from '#udsp/encodePacket';
import { sendPacket } from '#udsp/sendPacket';
import { cryptography } from '#udsp/cryptography';
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
	async generateNewSessionKeys() {
		const server = this.server();
		const newKeypair = keypair();
		this.newKeys = newKeypair;
		info(`socket EVENT -> reKey - ID:${this.id}`);
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
	async sendIntro() {
		info(`Client Intro Sent -> - ID:${this.id}`);
		this.generateNewSessionKeys();
		const message = {
			intro: true,
			scid: this.id,
			reKey: this.newKeys.publicKey
		};
		await this.send(message);
		this.encryptKeypair = this.newKeys;
	}
	chunkCertificate(certificate) {
	}
	proccessProtocolPacket(message) {
		info(`Client Intro -> - ID:${this.id}`);
		const {
			intro,
			certRequest
		} = message;
		if (intro) {
			this.state = 1;
			this.sendIntro(message);
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
}
export async function createClient(config) {
	const client = await construct(Client, [config]);
	console.log('Client has been created with sever connection id', toBase64(client.id));
	return client;
}
