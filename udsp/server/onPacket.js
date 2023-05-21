import {
	success, failed, imported, msgSent, info, msgReceived
} from '#logs';
import {
	boxUnseal, decrypt, toBase64, sessionKeys
} from '#crypto';
import { isEmpty } from 'Acid';
import { decodePacket, decodePacketHeaders } from '#udsp/decodePacket';
import { createClient } from './clients/index.js';
import { reply } from '#udsp/reply';
const isServer = true;
export async function onPacket(packetEncoded, connection) {
	const thisServer = this;
	const { keypair } = thisServer;
	msgReceived('Message Received');
	const config = {
		packetEncoded,
		connection,
		server: thisServer,
		isServer: true
	};
	const headers = await decodePacketHeaders(config);
	const {
		id,
		key,
		nonce
	} = headers;
	console.log(headers);
	let client = thisServer.clients.get(toBase64(id));
	if (key && !client) {
		client = await createClient({
			server: thisServer,
			connection,
			id,
			nonce,
			key
		});
		config.receiveKey = client.receiveKey;
	} else if (!client) {
		return failed('Invalid Client id given', toBase64(id));
	}
	const packet = await decodePacket(config);
	await reply(packet, client);
}
