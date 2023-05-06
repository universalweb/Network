import {
	success, failed, imported, msgSent, info
} from '#logs';
import { encodePacket } from '#udsp/encodePacket';
export async function send(client, message, options) {
	const {
		address,
		port,
		nonce,
		transmitKey,
		clientId: id,		state
	} = client;
	const packet = await encodePacket({
		nonce,
		transmitKey,
		id,
		state,
		message,
		options
	});
	return this.sendPacket(packet, address, port, nonce, transmitKey, id);
}
