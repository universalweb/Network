import {
	success, failed, imported, msgSent, info
} from '#logs';
import {
	encode,
	decode
} from 'msgpackr';
import {
	assign,
	chunk,
	omit,
	objectSize
} from '@universalweb/acid';
import { toBase64 } from '#crypto';
export async function encodePacket(config) {
	success(`PROCESSING ENCODE PACKET`);
	const {
		source,
		packet: {
			headers = {},
			message,
			footer,
			options
		}
	} = config;
	const {
		state,
		isClient,
		isServer,
		isServerEnd,
		isServerClient
	} = source;
	const destination = source.destination || config.destination;
	let id = destination.id || source.id;
	const { cryptography } = source;
	let encryptConnectionId;
	if (isServerEnd) {
		encryptConnectionId = cryptography.config.encryptClientConnectionId;
	} else {
		encryptConnectionId = cryptography.config.encryptServerConnectionId;
	}
	if (!id) {
		return console.error(`ID IS'T ASSIGNED`);
	}
	if (encryptConnectionId) {
		// console.log(destination);
		if (encryptConnectionId === 'sealedbox') {
			if (isServerEnd) {
				id = cryptography.encryptClientConnectionId(id, destination.connectionIdKeypair);
			} else {
				id = cryptography.encryptServerConnectionId(id, destination.connectionIdKeypair);
			}
		}
		if (!id) {
			return console.error(`Connection ID Encrypt failed method given ${encryptConnectionId}`);
		}
	}
	headers.id = id;
	message.t = Date.now();
	if (isClient) {
		if (state === 0) {
			console.log('DESTINATION ENCRYPT PUBLIC KEY', toBase64(destination.encryptKeypair.publicKey));
			if (!headers.key) {
				headers.key = source.encryptKeypair.publicKey;
			}
		}
	}
	if (headers.key) {
		const {
			encryptClientKey,
			encryptServerKey
		} = cryptography.config;
		if (isClient) {
			if (encryptClientKey === 'sealedbox') {
				headers.key = cryptography.encryptClientKey(headers.key, destination.encryptKeypair);
			}
		}
		if (isServerEnd) {
			if (encryptServerKey === 'sealedbox') {
				headers.key = cryptography.encryptServerKey(headers.key, destination.encryptKeypair);
			}
		}
	}
	if (options) {
		console.log('Packet Options', options);
	}
	const headersEncoded = (objectSize(headers) === 1 && headers.id) ? encode(id) : encode(headers);
	const messageEncoded = encode(message);
	const ad = (footer) ? Buffer.concat([headersEncoded, footer]) : headersEncoded;
	const encryptedMessage = cryptography.encrypt(messageEncoded, source.sessionKeys, ad);
	if (!encryptedMessage) {
		return failed('Encryption failed');
	}
	const packetStructure = [headersEncoded, encryptedMessage];
	if (footer) {
		packetStructure[2] = encode(footer);
	}
	const packet = encode(packetStructure);
	info(`clientId: ${toBase64(headers.id)}`);
	info(`Transmit Key ${toBase64(source.sessionKeys.transmitKey)}`);
	const packetSize = packet.length;
	info(`encoded Packet Size ${packetSize}`);
	if (packetSize >= 1280) {
		console.log(packet);
		failed(`WARNING: Packet size is larger than max allowed size 1280 -> ${packetSize} over by ${packetSize - 1280}`);
	}
	success(`PROCESSED ENCODE PACKET`);
	return packet;
}
