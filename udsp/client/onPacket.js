import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { decode, encode } from '#utilities/serialize';
import { decrypt, createSessionKey } from '#crypto';
import { decodePacket, decodePacketHeaders } from '#udsp/encoding/decodePacket';
import { processFrame } from './processFrame.js';
import { hasValue, isArray, isNumber } from '@universalweb/acid';
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
	if (header && isArray(header)) {
		const headerRPC = header[1];
		if (isNumber(headerRPC)) {
			await this.proccessProtocolPacket(message, header);
		}
	}
	if (message && isArray(message)) {
		const messageRPC = message[1];
		if (hasValue(messageRPC)) {
			return processFrame(message, header, this);
		}
	}
}

