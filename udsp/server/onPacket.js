import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import {
	encode,
	decode
} from 'msgpackr';
import { boxUnseal, decrypt } from '#crypto';
import { processPacket } from './processPacket.js';
import { processSocket } from './processSocket.js';
import { isEmpty } from 'Acid';
import { decodePacket } from '#udsp/decodePacket';
export async function onPacket(packetEncoded, connection) {
	const thisServer = this;
	const {
		receiveKey,
		nonce,
		keypair
	} = thisServer;
	msgReceived('Message Received');
	const packet = await decodePacket({
		receiveKey,
		nonce,
		packetEncoded
	});
	if (packet.headers.key) {
		success(`Public Key is given -> Processing handshake`);
		await processSocket(thisServer, connection, packet);
	} else {
		success(`No Public Key is given -> Processing as a message`);
		await processPacket(thisServer, connection, packet);
	}
}
