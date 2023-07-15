import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise, isFunction } from '@universalweb/acid';
import { encodePacket } from '#udsp/encodePacket';
export async function sendPacket(packet, source, socket, destination = source.destination) {
	success(`SENDING MESSAGE`);
	// console.log(packetConfig);
	const {
		server,
		isClient,
		isServer,
		isServerClient
	} = source;
	const {
		message,
		header,
		footer
	} = packet;
	const {
		ip,
		port,
	} = destination;
	// console.log(packetConfig.packet);
	if (header) {
		info(`Sending Packet with header`);
	}
	if (message) {
		info(`Sending Packet with message`);
		if (message.method) {
			info(`Sending Packet with act ${message.method}`);
		}
	}
	if (footer) {
		info(`Sending Packet with footer`);
	}
	const packetEncoded = await encodePacket(packet, source, destination);
	console.log(`Packet Encoded Size ${packetEncoded.length} Sending to ip: ${ip} Port: ${port}`);
	return promise((accept, reject) => {
		socket.send(packetEncoded, port, ip, (error) => {
			if (error) {
				reject(error);
				return failed(error);
			}
			success('Packet Sent Out', packetEncoded.length);
			accept();
		});
	});
}
