import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise } from 'Acid';
import { encodePacket } from '#udsp/encodePacket';
imported('Client Send');
export async function send(config) {
	const {
		message,
		headers,
		footer,
		options
	} = config;
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
		transmitKey,
		connectionIdKey
	} = client;
	const packet = await encodePacket({
		client,
		destination,
		ephemeralPublic,
		footer,
		headers,
		id: serverId || id,
		isClient: true,
		keypair,
		message,
		nonce,
		options,
		profile,
		state,
		transmitKey,
		connectionIdKey
	});
	msgSent(`Packet Size ${packet.length}`, message);
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
