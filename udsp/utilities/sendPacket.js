import { isArray, isFunction, promise } from '@universalweb/utilitylib';
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
			accept();
		});
	});
}
export async function sendPacket(frame, source, socket, destination = source.destination, headers, footer, repeat, rinfo) {
	if (source.destroyed) {
		return;
	}
	// source.logInfo(`sendPacket`, source);
	const {
		server,
		isClient,
		isServer,
		isServerClient
	} = source;
	const ip = rinfo ? rinfo.address : destination.ip;
	const port = rinfo ? rinfo.port : destination.port;
	// source.logInfo('sendPacket', message, headers);
	const packetEncoded = await encodePacket(frame, source, destination, headers, footer);
	source.logInfo(`Packet Encoded Size ${packetEncoded.length} Worker ${source.workerId || 'Master'} sending to ip: ${ip} Port: ${port}`);
	if (repeat) {
		const firstSent = sendEncodedPacket(socket, packetEncoded, port, ip, source.destroyed);
		const secondSent = sendEncodedPacket(socket, packetEncoded, port, ip, source.destroyed);
		const sentPromises = [firstSent, secondSent];
		return Promise.all(sentPromises);
	}
	return sendEncodedPacket(socket, packetEncoded, port, ip, source.destroyed);
}
export async function sendPacketWithDelay(frame, source, socket, destination, headers, footer, repeat, rinfo, delay) {
	if (source.destroyed) {
		return;
	}
	await new Promise((accept) => {
		setTimeout(() => {
			accept();
		}, delay);
	});
	return sendPacket(frame, source, socket, destination, headers, footer, repeat, rinfo);
}
export async function sendPacketIfAny(frame, source, socket, destination, headers, footer, repeat, rinfo) {
	if (source.destroyed) {
		return;
	}
	if (frame && isArray(frame) && frame.length === 0) {
		return sendPacket(undefined, source, socket, destination, headers, footer, repeat, rinfo);
	}
	return sendPacket(frame, source, socket, destination, headers, footer, repeat, rinfo);
}
