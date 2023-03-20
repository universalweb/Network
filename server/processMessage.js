import {
	success, failed, imported, msgReceived, info
} from '../utilities/logs.js';
import {
	encode,
	decode
} from 'msgpackr';
import { promise } from 'Acid';
import {
	toBase64,
	decrypt
} from '../utilities/crypto.js';
export async function processMessage(connection, headersBuffer, headers, packet) {
	const clientId = headers.id;
	const client = clients.get(toBase64(clientId));
	if (!client) {
		return false;
	}
	const nonce = headers.nonce;
	const decrypted = decrypt(packet, headersBuffer, nonce, client.receiveKey);
	if (!decrypted) {
		return failed(`Decrypt Failed`);
	}
	const message = this.parseMessage(decrypted);
	if (!message) {
		return failed('MSGPack ERROR', connection);
	}
	msgReceived(message);
	this.count++;
	await this.api.onMessage(client, message);
	success(`Messages Received: ${this.count}`);
}
