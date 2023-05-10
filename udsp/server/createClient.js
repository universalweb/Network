import { construct, each, UniqID } from 'Acid';
import { created } from './clients/created.js';
import { Client } from './clients/index.js';
import {
	toBase64,
	decrypt
} from '#crypto';
// make client creation an async non-blocking process
export async function createClient(server, connectionInfo, receiveKey, transmitKey, ephemeralKeypair, clientId) {
	console.log('Creating Client Object', toBase64(clientId));
	const client = await construct(Client, [server, connectionInfo, receiveKey, transmitKey, ephemeralKeypair, clientId]);
	console.log('Client has been created', toBase64(clientId));
	return client;
}
