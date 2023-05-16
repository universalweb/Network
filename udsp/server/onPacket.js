import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { boxUnseal, decrypt, toBase64 } from '#crypto';
import { isEmpty } from 'Acid';
import { decodePacket } from '#udsp/decodePacket';
import { createClient } from './clients/index.js';
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
	await reply(packetCompiled.packet, packetCompiled.client);
}
