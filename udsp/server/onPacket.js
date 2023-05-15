import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { boxUnseal, decrypt, toBase64 } from '#crypto';
import { processPacket } from './processPacket.js';
import { isEmpty } from 'Acid';
import { decodePacket } from '#udsp/decodePacket';
import { createClient } from './clients/index.js';
import { processPacketEvent } from './processPacketEvent.js';
import { reply } from '#udsp/reply';
const isServer = true;
export async function onPacket(packetEncoded, connection) {
	const thisServer = this;
	const {
		receiveKey,
		nonce,
		keypair
	} = thisServer;
	msgReceived('Message Received');
	const packetCompiled = await decodePacket({
		receiveKey,
		nonce,
		packetEncoded,
		connection,
		server: thisServer,
		isServer
	});
	if (packetCompiled.headers.key) {
		if (!packetCompiled.headers.key) {
			console.log('NO SOCKET CREATED NO public key', packetCompiled);
			return;
		}
	} else {
		success(`No Public Key is given -> Processing as a message`);
	}
	await reply(packetCompiled, packetCompiled.client);
}
