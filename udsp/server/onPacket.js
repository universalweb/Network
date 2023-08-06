import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { toBase64 } from '#crypto';
import { isEmpty, hasValue } from '@universalweb/acid';
import { decodePacket, decodePacketHeaders } from '#udsp/decodePacket';
import { createClient } from './clients/index.js';
import { reply } from '#udsp/request/reply';
import { processMessage } from '../client/processMessage.js';
const isServer = true;
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
		return failed('Invalid Packet Headers');
	}
	const {
		id,
		key,
		reKey
	} = config.packetDecoded.header;
	let client = thisServer.clients.get(toBase64(id));
	if (client) {
		config.destination = client;
		if (reKey) {
			client.attachNewKey();
		}
	}
	if (key && !client) {
		client = await createClient({
			server: thisServer,
			connection,
			packet: config.packetDecoded
		});
		if (!client) {
			return failed('Failed to create client', toBase64(id));
		}
		config.destination = client;
	}
	if (!client) {
		// Send error message back to origin or not
		return failed('Invalid Client id given', toBase64(id));
	}
	const wasDecoded = await decodePacket(config);
	if (!wasDecoded) {
		return failed('When decoding the packet but header passed');
	}
	const {
		header,
		message
	} = config.packetDecoded;
	if (hasValue(message?.sid)) {
		client.reply(config.packetDecoded);
	} else {
		client.proccessProtocolPacket(message, header);
	}
}
