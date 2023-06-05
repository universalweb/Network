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
} from 'Acid';
import { keypair, toBase64 } from '#crypto';
import { encodePacket } from '#udsp/encodePacket';
import { sendPacket } from '#udsp/sendPacket';
export class Client {
	constructor(config) {
		const { server } = config;
		const client = this;
		this.server = function() {
			return server;
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
	async reKey() {
		const server = this.server();
		const newKeypair = keypair();
		this.newKeys = newKeypair;
		info(`socket EVENT -> reKey - ID:${this.id}`);
	}
	updateState(state) {
		this.state = state;
	}
	async sendPacket(packet) {
		msgSent(`socket Sent -> ID: ${this.id}`);
		const { destination } = this;
		const config = {
			destination,
			source: this,
			packet
		};
		return sendPacket(config);
		// await this.server().clientEvent('send', this);
	}
	async send(packetConfig) {
		return this.sendPacket(packetConfig);
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
	descriptor = `Server's client`;
	type = 'serverClient';
	isServerClient = true;
	pending = false;
	replyQueue = construct(Map);
	packetIdGenerator = construct(UniqID);
	state = 0;
	encryptConnectionId = false;
}
export async function createClient(config) {
	const { id } = config;
	console.log('Creating Client with id', toBase64(id));
	const client = await construct(Client, [config]);
	console.log('Client has been created with sever connection id', toBase64(client.id));
	return client;
}
