import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { toBase64 } from '#crypto';
import {
	isEmpty, hasValue, isArray, eachAsyncArray, eachArray
} from '@universalweb/acid';
import { decodePacket, decodePacketHeaders } from '#udsp/encoding/decodePacket';
import { createClient } from './clients/index.js';
import { reply } from '#udsp/request/reply';
import { processMessage } from '../client/processMessage.js';
import { decodeFrame } from '#udsp/frames/decodeFrame';
import { decodeSameIdFrames } from '#udsp/frames/decodeSameIdFrames';
import { decodeFrames } from '#udsp/frames/decodeFrames';
export async function onPacket(packet, connection) {
	const thisServer = this;
	msgReceived('Message Received');
	const config = {
		packet,
		connection,
		destination: thisServer,
	};
	const wasHeadersDecoded = await decodePacketHeaders(config);
	if (!wasHeadersDecoded || !config.packetDecoded.header) {
		return console.trace('Invalid Packet Headers');
	}
	const id = config.packetDecoded.id;
	let client = thisServer.clients.get(toBase64(id));
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
			return console.trace('Failed to create client', toBase64(id));
		}
		config.destination = client;
	}
	if (!client) {
		// Send error message back to origin or not
		return console.trace('Invalid Client id given', toBase64(id));
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
	if (isArray(message)) {
		if (message[0] === false) {
			client.proccessProtocolPacket(message, header);
		} else if (isArray(message[0])) {
			const messageFrames = decodeFrames(config.packetDecoded);
			eachArray(messageFrames, (frame) => {
				client.reply(frame, header);
			});
		} else if (isArray(message[1])) {
			const messageFrames = decodeSameIdFrames(config.packetDecoded);
			eachArray(messageFrames, (frame) => {
				client.reply(frame, header);
			});
		} else {
			const frame = decodeFrame(config.packetDecoded);
			if (hasValue(message.id)) {
				client.reply(frame, header);
			}
		}
	}
}
