import { connected } from './connected.js';
import { connection } from './connection.js';
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
export class Client {
	descriptor = 'client';
	client = true;
	pending = false;
	replyQueue = construct(Map);
	packetIdGenerator = construct(UniqID);
	constructor(server, connectionInfo, receiveKey, transmitKey, clientId) {
		this.server = function() {
			return server;
		};
		return initialize(this, server, connectionInfo, receiveKey, transmitKey, clientId);
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
	async connection(connectionInfo) {
		const server = this.server();
		await connection(this, connectionInfo, server);
		info(`socket EVENT -> connection - ID:${this.id}`);
	}
	async reKey(clientKeypair) {
		const server = this.server();
		await reKey(this, clientKeypair, server);
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
