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
		connectionIdKeypair,
		service,
		service: { encryptConnectionId },
		destinationPublicKey
	} = client;
	const packet = await encodePacket({
		client,
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
		destination: service,
		connectionIdKeypair,
		encryptConnectionId,
		destinationPublicKey
	});
	msgSent(`Packet Size ${packet.length}`, message, port, ip);
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
