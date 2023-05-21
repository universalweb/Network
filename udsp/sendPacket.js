import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise } from 'Acid';
import { encodePacket } from '#udsp/encodePacket';
// clientId, nonce, encrypted message size, flags, packet size.
export async function sendPacket(packetConfig, server) {
	success(`SENDING MESSAGE`);
	const {
		address,
		port,
	} = packetConfig;
	const packet = await encodePacket(packetConfig);
	console.log(`Packet Encoded Sending to Address: ${address} Port: ${port}`);
	return promise((accept, reject) => {
		server.send(packet, port, address, (error) => {
			if (error) {
				reject(error);
				return failed(error);
			}
			msgSent('Message Sent', packet.length);
			accept();
		});
	});
}
