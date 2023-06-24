import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { decode } from 'msgpackr';
import { decrypt, createSessionKey } from '#crypto';
import { decodePacket, decodePacketHeaders } from '#udsp/decodePacket';
imported('Server onMessage');
import { processMessage } from './processMessage.js';
export async function onPacket(packet) {
	const { destination: source } = this;
	msgReceived('Packet Received');
	const config = {
		destination: this,
		source,
		packet,
	};
	const wasHeadersDecoded = await decodePacketHeaders(config);
	if (!wasHeadersDecoded || !config.packetDecoded.header) {
		return failed('Invalid Packet Headers');
	}
	const wasDecoded = await decodePacket(config);
	if (!wasDecoded) {
		return failed('When decoding the packet but header passed');
	}
	processMessage(config.packetDecoded, this);
}

