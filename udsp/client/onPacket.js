import { decode, encode } from '#utilities/serialize';
import { decodePacket, decodePacketHeaders } from '#udsp/encoding/decodePacket';
import {
	hasValue,
	isArray,
	isFalse,
	isNumber
} from '@universalweb/acid';
import { onFrame } from '../processFrame.js';
import { onProtocolHeader } from '#udsp/proccessProtocol';
export async function onPacket(packet, rinfo) {
	this.logInfo('Packet Received');
	const config = {
		destination: this,
		source: this.destination,
		packet,
	};
	const wasHeadersDecoded = await decodePacketHeaders(config);
	if (!wasHeadersDecoded || !config.packetDecoded.header) {
		this.logInfo(config.packet);
		this.logError('Error failed to decode packet headers');
		return;
	}
	const { header, } = config.packetDecoded;
	if (isFalse(config.isShortHeaderMode)) {
		await onProtocolHeader(this, header, config.packetDecoded, rinfo);
	}
	const wasDecoded = await decodePacket(config);
	if (!wasDecoded) {
		this.logError('Error when decoding the frame but header was decoded');
		return;
	}
	const {
		message,
		footer
	} = config.packetDecoded;
	if (message) {
		onFrame(message, header, this, this.requestQueue, rinfo);
	}
	return;
}

