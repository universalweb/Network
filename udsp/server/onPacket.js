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
	const idString = id.toString('hex');
	console.log(thisServer.clients, idString);
	let client = thisServer.clients.get(idString);
	if (client) {
		config.destination = client;
		if (client.state === 1) {
			client.attachNewClientKeys();
		}
	}
	if (!client) {
		client = await createClient({
			server: thisServer,
			connection,
			packet: config.packetDecoded
		});
		if (!client) {
			return console.trace('Failed to create client', idString);
		}
		config.destination = client;
		if (this.isWorker) {
			this.updateWorkerState(client);
		}
	}
	if (!client) {
		// Send error message back to origin or not
		return console.trace('Invalid Client id given', idString);
	}
	const wasDecoded = await decodePacket(config);
	if (!wasDecoded) {
		return console.trace('When decoding the packet but header passed');
	}
	const {
		header,
		message
	} = config.packetDecoded;
	if (!hasValue(message)) {
		return console.trace('Error no message found in packet');
	}
	console.log(config);
	if (isFalse(config.isShortHeaderMode)) {
		await proccessProtocolPacketHeader(client, message, header);
	}
	return client.reply(message, header);
}
