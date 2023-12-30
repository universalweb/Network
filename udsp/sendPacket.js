import {
	failed,
	imported,
	info,
	msgSent,
	success
} from '#logs';
import { isFunction, promise } from '@universalweb/acid';
import { encodePacket } from '#udsp/encoding/encodePacket';
export async function sendEncodedPacket(socket, packetEncoded, port, ip, destroyed) {
	if (destroyed) {
		return;
	}
	return promise((accept, reject) => {
		socket.send(packetEncoded, port, ip, (error) => {
			if (error) {
				reject(error);
				return console.trace(error);
			}
			success('Packet Sent Out', packetEncoded.length);
			accept();
		});
	});
}
export async function sendPacket(message, source, socket, destination = source.destination, headers, footer, repeat) {
	if (source.destroyed) {
		return;
	}
	// console.log(`sendPacket`, source);
	const {
		server,
		isClient,
		isServer,
		isServerClient
	} = source;
	const {
		ip,
		port,
	} = destination;
	if (headers) {
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
	// console.log('sendPacket', message, headers);
	const packetEncoded = await encodePacket(message, source, destination, headers, footer);
	console.log(`Packet Encoded Size ${packetEncoded.length} Worker ${source.workerId || 'Master'} sending to ip: ${ip} Port: ${port}`);
	if (repeat) {
		return Promise.all([sendEncodedPacket(socket, packetEncoded, port, ip, source.destroyed),
			sendEncodedPacket(socket, packetEncoded, port, ip, source.destroyed)]);
	}
	return sendEncodedPacket(socket, packetEncoded, port, ip, source.destroyed);
}
