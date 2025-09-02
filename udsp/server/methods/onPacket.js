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
	isUndefined,
} from '@universalweb/utilitylib';
import { decodePacket, decodePacketHeaders } from '#udsp/encoding/decodePacket';
import { createClient } from '../clients/index.js';
import { onProtocolHeader } from '#udsp/onPacket/onProtocol';
import { reply } from '#udsp/request/reply';
import { toBase64 } from '#utilities/cryptography/utils';
export async function onPacket(packet, rinfo) {
	const thisServer = this;
	this.logInfo('Message Received WORKER ID:', this.workerId || 'No Worker ID');
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
	// TODO: Optimize lookup of client objects
	const idString = id.toString('hex');
	const client = await this.clientCheck(config, id, idString, rinfo);
	if (!client) {
		// Send error message back to origin or not
		return this.logInfo('No matching Client id given', idString);
	}
	const { header } = config.packetDecoded;
	if (isFalse(config.isShortHeaderMode)) {
		await onProtocolHeader(client, header, config.packetDecoded, rinfo);
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
