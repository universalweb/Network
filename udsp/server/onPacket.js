import { decodePacket, decodePacketHeaders } from '#udsp/encoding/decodePacket';
import {
	eachArray,
	eachAsyncArray,
	hasValue,
	isArray,
	isEmpty,
	isFalse,
	isNumber,
	isUndefined
} from '@universalweb/acid';
import {
	failed,
	imported,
	info,
	msgReceived,
	msgSent,
	success
} from '#logs';
import { createClient } from './clients/index.js';
import { proccessProtocolPacketHeader } from '#udsp/proccessProtocolPacket';
import { processFrame } from '../processFrame.js';
import { reply } from '#udsp/request/reply';
import { toBase64 } from '#crypto';
export async function onPacket(packet, connection) {
	const thisServer = this;
	msgReceived('Message Received');
	const config = {
		packet,
		connection,
		destination: thisServer,
	};
	const wasHeadersDecoded = await decodePacketHeaders(config);
	if (isUndefined(wasHeadersDecoded)) {
		return console.trace('Invalid Packet Headers');
	}
	const id = config.packetDecoded.id;
	if (!id) {
		return console.log('Invalid Client id given', id);
	}
	const idString = id.toString('hex');
	const client = await this.client(config, id, idString, connection);
	if (!client) {
		// Send error message back to origin or not
		return console.log('No matching Client id given', idString);
	}
	const wasDecoded = await decodePacket(config);
	if (!wasDecoded) {
		return console.log('When decoding the packet but header passed');
	}
	const {
		header,
		message
	} = config.packetDecoded;
	if (!hasValue(message)) {
		console.log('No message found in packet');
	}
	if (isFalse(config.isShortHeaderMode)) {
		await proccessProtocolPacketHeader(client, message, header);
	}
	return client.reply(message, header);
}
