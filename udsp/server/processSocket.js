import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import {
	encode,
	decode
} from 'msgpackr';
import {
	decrypt, sessionKeys, signOpen, hash, signVerifyHash, toBase64, boxUnseal
} from '#crypto';
import { createClient } from './createClient.js';
import { processPacketEvent } from './processPacketEvent.js';
// headers (ad) are the main UDSP headers. It may be called headers at times or headers.
export async function processSocket(server, connection, packet) {
	server.socketCount++;
	if (packet.headers.key) {
		msgReceived(`Signature is valid`);
		const client = await createClient(server, connection);
		console.log(client);
		await processPacketEvent(server, client, packet.message);
	} else {
		console.log('NO SOCKET CREATED NO public key', packet);
		return;
	}
	success(`Socket Count: ${server.socketCount}`);
}
