import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { toBase64 } from '#crypto';
import {
	isEmpty, hasValue, isArray, eachAsyncArray, eachArray, isUndefined, isNumber, isFalse
} from '@universalweb/acid';
import { decodePacket, decodePacketHeaders } from '#udsp/encoding/decodePacket';
import { createClient } from './clients/index.js';
import { reply } from '#udsp/request/reply';
import { processFrame } from '../client/processFrame.js';
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
		if (header && isArray(header)) {
			const headerRPC = header[1];
			if (isNumber(headerRPC)) {
				await client.proccessProtocolPacketHeader(message, header);
			}
		}
	}
	if (message && isArray(message)) {
		const streamId = message[0];
		const messageRPC = message[1];
		if (hasValue(streamId)) {
			if (streamId === false) {
				return client.proccessProtocolPacketFrame(message, header);
			}
			if (isNumber(messageRPC)) {
				console.log('Message Client.reply', message, header);
				return client.reply(message, header);
			}
		}
	}
}
