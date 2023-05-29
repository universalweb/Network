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
import { UniqID, construct, assign } from 'Acid';
import { sessionKeys, keypair, toBase64 } from '#crypto';
export class Client {
	descriptor = 'client';
	client = true;
	pending = false;
	replyQueue = construct(Map);
	packetIdGenerator = construct(UniqID);
	state = 0;
	constructor(config) {
		const { server } = config;
		const client = this;
		this.server = function() {
			return server;
		};
		config.client = client;
		this.sendPacket = async function(packetConfigObject) {
			packetConfigObject.client = client;
			await server.send(packetConfigObject);
			await server.clientEvent('send', client);
			msgSent(`socket Sent -> ID: ${client.id}`);
		};
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
		this.cachePacketSendConfig();
	}
	cachePacketSendConfig() {
		const client = this;
		const {
			address,
			port,
			nonce,
			transmitKey,
			clientId,
			state,
		} = client;
		this.packetConfig = {
			address,
			port,
			nonce,
			transmitKey,
			id: clientId,
			state,
		};
	}
	async send(packetConfig) {
		const preparePacketObject = assign(packetConfig, this.packetConfig);
		return this.sendPacket(preparePacketObject);
	}
	async received(message, frameHeaders) {
		const server = this.server();
		await received(this, message, frameHeaders, server);
		info(`socket EVENT -> send - ID:${this.id}`);
	}
	async authenticate(packet) {
		const nonce = packet.headers.nonce;
		success(`idc: ${toBase64(packet.message.idc)}`);
		success(`sig: ${toBase64(packet.message.sig)}`);
		const idc = packet.message.idc;
		const sig = packet.message.sig;
		if (!idc) {
			return failed('No Identity Provided', this.id);
		}
		if (!sig) {
			return failed('No Sig Provided', this.id);
		}
		const sigVerify = signVerifyHash(sig, Buffer.concat([nonce, this.publicKey]), idc.key);
		console.log('Concat Sig', Buffer.concat([nonce, this.publicKey]));
		console.log('SIGNature Hash', sig);
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
