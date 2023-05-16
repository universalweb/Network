import { connected } from './connected.js';
import { initialize } from './initialize.js';
import { created } from './created.js';
import { destroy } from './destroy.js';
import { reKey } from './reKey.js';
import { send } from './send.js';
import { state } from './state.js';
// import { createResponse } from './message.js';
import { received } from './received.js';
import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { UniqID, construct } from 'Acid';
import { sessionKeys, keypair, toBase64 } from '#crypto';
export class Client {
	descriptor = 'client';
	client = true;
	pending = false;
	replyQueue = construct(Map);
	packetIdGenerator = construct(UniqID);
	constructor(config) {
		const { server } = config;
		this.server = function() {
			return server;
		};
		config.client = this;
		return initialize(config);
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
		await state(this);
		info(`socket EVENT -> statusUpdate - ID:${this.id}`);
	}
	async reKey() {
		const server = this.server();
		const newKeypair = keypair();
		this.newKeys = newKeypair;
		info(`socket EVENT -> reKey - ID:${this.id}`);
	}
	async send(message, frameHeaders) {
		const server = this.server();
		console.log(server);
		await send(this, message, frameHeaders, server);
		info(`socket EVENT -> send - ID:${this.id}`);
	}
	async received(message, frameHeaders) {
		const server = this.server();
		await received(this, message, frameHeaders, server);
		info(`socket EVENT -> send - ID:${this.id}`);
	}
	async identity(socket) {
		const server = this.server();
		info(`socket EVENT -> identity - ID:${this.id}`);
	}
	async destroy(destroyCode) {
		const server = this.server();
		await destroy(this, destroyCode, server);
		info(`socket EVENT -> destroy - ID:${this.id}`);
	}
}
export async function createClient(config) {
	const { id } = config;
	console.log('Creating Client Object', toBase64(id));
	const client = await construct(Client, [config]);
	console.log('Client has been created', toBase64(id));
	return client;
}
