import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { toBase64 } from '#crypto';
import {
	isEmpty, hasValue, isArray, eachAsyncArray, eachArray, isUndefined, isNumber
} from '@universalweb/acid';
import { decodePacket, decodePacketHeaders } from '#udsp/encoding/decodePacket';
import { createClient } from './clients/index.js';
import { reply } from '#udsp/request/reply';
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
	if (header && isArray(header)) {
		const headerRPC = header[1];
		if (isNumber(headerRPC)) {
			await client.proccessProtocolPacket(message, header);
		}
	}
	if (isArray(message)) {
		if (isUndefined(message[0])) {
			return;
		}
		console.log('Message Client.reply', message, header);
		client.reply(message, header);
	}
}
