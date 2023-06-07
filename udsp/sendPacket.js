import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise, isFunction } from '@universalweb/acid';
import { encodePacket } from '#udsp/encodePacket';
// clientId, nonce, encrypted message size, flags, packet size.
export async function sendPacket(packetConfig) {
	success(`SENDING MESSAGE`);
	console.log(packetConfig);
	const { source: { server } } = packetConfig;
	const destination = packetConfig.destination || packetConfig.source.destination;
	const {
		ip,
		port,
	} = destination;
	const packet = await encodePacket(packetConfig);
	console.log(`Packet Encoded Size ${packet.length} Sending to ip: ${ip} Port: ${port}`);
	const rawServer = isFunction(server) ? server().server : server;
	return promise((accept, reject) => {
		rawServer.send(packet, port, ip, (error) => {
			if (error) {
				reject(error);
				return failed(error);
			}
			msgSent('Message Sent', packet.length);
			accept();
		});
	});
}
