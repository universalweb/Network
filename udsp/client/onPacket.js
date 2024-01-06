import { createSessionKey, decrypt } from '#crypto';
import { decode, encode } from '#utilities/serialize';
import { decodePacket, decodePacketHeaders } from '#udsp/encoding/decodePacket';
import {
	failed,
	imported,
	info,
	msgReceived,
	msgSent,
	success
} from '#logs';
import {
	hasValue,
	isArray,
	isFalse,
	isNumber
} from '@universalweb/acid';
import { proccessProtocolPacketHeader } from '#udsp/proccessProtocolPacket';
import { processFrame } from '../processFrame.js';
export async function onPacket(packet, rinfo) {
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
	// console.log(config);
	if (!hasValue(message)) {
		return console.trace('Error no message found in packet');
	}
	if (isFalse(config.isShortHeaderMode)) {
		await proccessProtocolPacketHeader(this, message, header, rinfo);
	}
	await processFrame(message, header, this, this.requestQueue, rinfo);
	this.trigger(this.events, 'socket.onPacket', this, [message, header, rinfo]);
	return;
}

