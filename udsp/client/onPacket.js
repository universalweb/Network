import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { decode, encode } from '#utilities/serialize';
import { decrypt, createSessionKey } from '#crypto';
import { decodePacket, decodePacketHeaders } from '#udsp/encoding/decodePacket';
import { processFrame } from './processFrame.js';
import { hasValue, isArray } from '@universalweb/acid';
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
	if (isArray(message)) {
		const rpc = message[1];
		if (rpc === 0) {
			this.proccessProtocolPacket(message, header);
		} else {
			processFrame(message, header, this);
		}
	}
}

