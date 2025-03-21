import {
	assign,
	eachArray,
	eachAsyncArray,
	hasValue,
	isArray,
	isBuffer,
	isEmpty,
	isFalse,
	isNumber,
	isUndefined
} from '@universalweb/acid';
import { decodePacket, decodePacketHeaders } from '#udsp/encoding/decodePacket';
import {
	failed,
	imported,
	info,
	msgReceived,
	msgSent,
	success
} from '#logs';
import { createClient } from './clients/index.js';
import { proccessProtocolPacketHeader } from '#udsp/proccessProtocol';
import { reply } from '#udsp/request/reply';
import { toBase64 } from '#crypto';
export async function onPacket(packet, rinfo) {
	const thisServer = this;
	msgReceived('Message Received WORKER ID:', this.workerId || 'No Worker ID');
	const config = {
		packet,
		connection: rinfo,
		destination: thisServer,
	};
	const wasHeadersDecoded = await decodePacketHeaders(config);
	if (isUndefined(wasHeadersDecoded)) {
		return console.trace('Invalid Packet Headers');
	}
	const id = config.packetDecoded.id;
	if (id !== false && !isBuffer(id)) {
		return this.logInfo('Invalid Client id given', id === false);
	}
	// TODO: Optimize lookup of client
	const idString = id.toString('hex');
	const client = await this.client(config, id, idString, rinfo);
	if (!client) {
		// Send error message back to origin or not
		return this.logInfo('No matching Client id given', idString);
	}
	const { header, } = config.packetDecoded;
	// TODO: Replace sessionCompleted with state ID
	//  TODO: Check if this can e re-written so that not relying on the header having a protocol RPC
	if (isFalse(client.handshakeStatus)) {
		if (isFalse(config.isShortHeaderMode)) {
			await proccessProtocolPacketHeader(client, header, config.packetDecoded, rinfo);
		}
	}
	const wasDecoded = await decodePacket(config);
	if (!wasDecoded) {
		return this.logInfo('Message failed to decode');
	}
	const { message } = config.packetDecoded;
	if (!hasValue(message)) {
		this.logInfo('No message found in packet');
		return;
	}
	return client.reply(message, header);
}
