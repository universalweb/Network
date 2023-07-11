import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise, isFunction } from '@universalweb/acid';
import { encodePacket } from '#udsp/encodePacket';
// clientId, nonce, encrypted message size, flags, packet size.
export async function sendPacket(packetConfig) {
	success(`SENDING MESSAGE`);
	// console.log(packetConfig);
	const {
		source,
		source: {
			server,
			isClient,
			isServer,
			isServerClient
		}
	} = packetConfig;
	const destination = packetConfig.destination || packetConfig.source.destination;
	const {
		ip,
		port,
	} = destination;
	console.log(packetConfig.packet);
	const packet = await encodePacket(packetConfig);
	console.log(`Packet Encoded Size ${packet.length} Sending to ip: ${ip} Port: ${port}`);
	let rawSocket;
	if (isServerClient) {
		rawSocket = source.server().socket;
	} else {
		rawSocket = source.socket;
	}
	return promise((accept, reject) => {
		rawSocket.send(packet, port, ip, (error) => {
			if (error) {
				reject(error);
				return failed(error);
			}
			success('Packet Sent Out', packet.length);
			accept();
		});
	});
}
