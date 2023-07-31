import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { decode } from 'msgpackr';
import { decrypt, createSessionKey } from '#crypto';
import { decodePacket, decodePacketHeaders } from '#udsp/decodePacket';
import { processMessage } from './processMessage.js';
import { hasValue } from '@universalweb/acid';
export async function onPacket(packet) {
	msgReceived('Packet Received');
	const config = {
		destination: this,
		source: this.destination,
		packet,
	};
	const wasHeadersDecoded = await decodePacketHeaders(config);
	if (!wasHeadersDecoded || !config.packetDecoded.header) {
		return failed('Error failed to decode packet headers');
	}
	const wasDecoded = await decodePacket(config);
	if (!wasDecoded) {
		return failed('Error when decoding the packet but header was decoded');
	}
	const {
		header,
		message,
		footer
	} = config.packetDecoded;
	if (hasValue(message?.sid)) {
		processMessage(config.packetDecoded, this);
	} else {
		this.proccessProtocolPacket(message, header, footer);
	}
}

