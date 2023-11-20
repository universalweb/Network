import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { decode, encode } from '#utilities/serialize';
import { decrypt, createSessionKey } from '#crypto';
import { decodePacket, decodePacketHeaders } from '#udsp/encoding/decodePacket';
import { processFrame } from '../processFrame.js';
import {
	hasValue, isArray, isFalse, isNumber
} from '@universalweb/acid';
import { proccessProtocolPacketHeader } from '#udsp/proccessProtocolPacket';
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
	console.log(config);
	if (isFalse(config.isShortHeaderMode)) {
		await proccessProtocolPacketHeader(this, message, header);
	}
	processFrame(message, header, this, this.requestQueue);
	return;
}

