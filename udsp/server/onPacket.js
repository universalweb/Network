import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import { toBase64 } from '#crypto';
import { isEmpty } from 'Acid';
import { decodePacket, decodePacketHeaders } from '#udsp/decodePacket';
import { createClient } from './clients/index.js';
import { reply } from '#udsp/reply';
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
	if (!wasHeadersDecoded || !config.decodePacket.headers) {
		return failed('Invalid Packet Headers');
	}
	const {
		id, key
	} = config.packetDecoded.headers;
	let client = thisServer.clients.get(toBase64(id));
	if (client) {
		config.destination = client;
	}
	const wasDecoded = await decodePacket(config);
	if (!wasDecoded) {
		return failed('When decoding the packet but headers passed');
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
	await reply(config.packetDecoded, client);
}
