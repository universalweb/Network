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
import { processPacketEvent } from './processPacketEvent.js';
export async function processPacket(server, connection, headersBuffer, headers, packet) {
	const clientId = headers.id;
	const { clients } = server;
	const client = clients.get(toBase64(clientId));
	if (!client) {
		return false;
	}
	const nonce = headers.nonce;
	if (headers.reKeyed) {
		client.reKey();
	}
	const decrypted = decrypt(packet, headersBuffer, nonce, client.receiveKey);
	if (!decrypted) {
		return failed(`Decrypt Failed`);
	}
	const message = decode(decrypted);
	if (!message) {
		return failed('MSGPack ERROR', connection);
	}
	msgReceived(message);
	server.packetCount++;
	info(`Packet Count: ${server.packetCount}`);
	await processPacketEvent(server, client, message);
	success(`Packet Count: ${server.packetCount}`);
}
