import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise } from 'Acid';
import { encodePacket } from '#udsp/encodePacket';
imported('Client Send');
export async function send(message, headers, footer, options) {
	info(`Send to server`);
	const client = this;
	const {
		destination,
		ephemeralPublic,
		id,
		ip,
		keypair,
		nonce,
		port,
		profile,
		server,
		serverId,
		state,
		transmitKey
	} = client;
	const packet = await encodePacket({
		client,
		destination,
		ephemeralPublic,
		footer,
		headers,
		id,
		isClient: true,
		keypair,
		message,
		nonce,
		options,
		profile,
		state,
		transmitKey
	});
	msgSent(`Packet Size ${packet.length}`);
	return promise((accept, reject) => {
		server.send(packet, port, ip, (error) => {
			if (error) {
				failed(error);
				return reject(error);
			}
			msgSent(packet.length);
			accept();
		});
	});
}
