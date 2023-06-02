import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { decode } from 'msgpackr';
import { decrypt, createSessionKey } from '#crypto';
import { decodePacket, decodePacketHeaders } from '#udsp/decodePacket';
imported('Server onMessage');
import { processMessage } from './processMessage.js';
export async function onMessage(packet) {
	const { destination: source } = this;
	msgReceived('Message Received');
	const config = {
		destination: this,
		source,
		packet,
	};
	const headers = await decodePacketHeaders(config);
	const decodedPacket = await decodePacket(config);
	processMessage(decodedPacket, this);
}

