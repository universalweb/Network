import {
	success, failed, imported, msgSent, info
} from '#logs';
import { encodePacket } from '#udsp/encodePacket';
export async function send(client, message, headers, options) {
	const {
		address,
		port,
		nonce,
		transmitKey,
		id,
		ephemeralKeypair: destination,
		state,
	} = client;
	const packet = await encodePacket({
		nonce,
		transmitKey,
		id,
		state,
		message,
		options,
		destination,
		headers
	});
	return this.sendPacket(packet, address, port, nonce, transmitKey, id);
}
