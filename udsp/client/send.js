import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise } from 'Acid';
import { encodePacket } from '#udsp/encodePacket';
imported('Client Send');
export async function send(message, priority) {
	info(`Send to server`);
	const {
		server,
		ip,
		port,
		nonce,
		state,
		ephemeralPublic,
		profile,
		transmitKey,
		serverId,
		keypair,
		clientId,
		destination
	} = this;
	const id = serverId || clientId;
	const packet = await encodePacket({
		nonce,
		transmitKey,
		id,
		state,
		message,
		ephemeralPublic,
		profile,
		keypair,
		client: true,
		destination
	});
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
