import {
	success, failed, imported, msgReceived, info
} from '#logs';
import {
	encode,
	decode
} from 'msgpackr';
import { promise } from 'Acid';
import {
	toBase64,
	decrypt
} from '#crypto';
import { parsePacket } from './parsePacket.js';
export async function processPacket(server, connection, headersBuffer, headers, packet) {
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
	const message = parsePacket(decrypted);
	if (!message) {
		return failed('MSGPack ERROR', connection);
	}
	msgReceived(message);
	server.packetCount++;
	await server.events.onMessage(client, message);
	success(`Messages Received: ${server.packetCount}`);
}
