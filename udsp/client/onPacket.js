import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { decode } from '#utilities/serialize';
import { decrypt, createSessionKey } from '#crypto';
import { decodePacket, decodePacketHeaders } from '#udsp/encoding/decodePacket';
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
		console.log(config.packet);
		return console.trace('Error failed to decode packet headers');
	}
	const wasDecoded = await decodePacket(config);
	if (!wasDecoded) {
		return console.trace('Error when decoding the packet but header was decoded');
	}
	const {
		header,
		message,
		footer,
	} = config.packetDecoded;
	if (hasValue(message?.id)) {
		processMessage(config.packetDecoded, this);
	} else {
		this.proccessProtocolPacket(message, header, footer);
	}
}

