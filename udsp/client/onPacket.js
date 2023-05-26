import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { decode } from 'msgpackr';
import { decrypt, createSessionKey } from '#crypto';
import { decodePacket, decodePacketHeaders } from '#udsp/decodePacket';
imported('Server onMessage');
import { reKey } from '#udsp/reKey';
import { processMessage } from './processMessage.js';
export async function onMessage(packetEncoded) {
	const {
		receiveKey,
		nonce,
		keypair,
		connectionIdKey
	} = this;
	msgReceived('Message Received');
	const config = {
		client: this,
		receiveKey,
		nonce,
		packetEncoded,
		isClient: true,
		connectionIdKey
	};
	const headers = decodePacketHeaders(config);
	const packet = await decodePacket(config);
	console.log(packet);
	processMessage(packet, this);
}

