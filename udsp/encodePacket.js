import {
	success,
	failed,
	imported,
	msgSent,
	info
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
		options,
		packet: message
	} = config;
	const {
		state,
		isClient,
		isServer,
		isServerEnd,
		isServerClient
	} = source;
	const header = options?.header || {};
	const footer = options?.footer;
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
	header.id = id;
	// console.log(config);
	message.t = Date.now();
	if (isClient) {
		if (state === 0) {
			console.log('DESTINATION ENCRYPT PUBLIC KEY', toBase64(destination.encryptKeypair.publicKey));
			if (!header.key) {
				header.key = source.encryptKeypair.publicKey;
			}
		}
	}
	if (header.key) {
		const {
			encryptClientKey,
			encryptServerKey
		} = cryptography.config;
		if (isClient) {
			if (encryptClientKey === 'sealedbox') {
				header.key = cryptography.encryptClientKey(header.key, destination.encryptKeypair);
			}
		}
		if (isServerEnd) {
			if (encryptServerKey === 'sealedbox') {
				header.key = cryptography.encryptServerKey(header.key, destination.encryptKeypair);
			}
		}
	}
	if (options) {
		console.log('Packet Options', options);
	}
	const headerEncoded = (objectSize(header) === 1 && header.id) ? encode(id) : encode(header);
	const messageEncoded = encode(message);
	const ad = (footer) ? Buffer.concat([headerEncoded, footer]) : headerEncoded;
	const encryptedMessage = cryptography.encrypt(messageEncoded, source.sessionKeys, ad);
	if (!encryptedMessage) {
		return failed('Encryption failed');
	}
	const packetStructure = [headerEncoded, encryptedMessage];
	if (footer) {
		packetStructure[2] = encode(footer);
	}
	const packet = encode(packetStructure);
	info(`clientId: ${toBase64(header.id)}`);
	info(`Transmit Key ${toBase64(source.sessionKeys.transmitKey)}`);
	const packetSize = packet.length;
	console.log('Size Unencrypted', encode([headerEncoded, messageEncoded]).length);
	info(`encoded Packet Size ${packetSize}`);
	if (packetSize >= 1328) {
		console.log(packet);
		failed(`WARNING: Packet size is larger than max allowed size 1328 -> ${packetSize} over by ${packetSize - 1328}`);
	}
	success(`PROCESSED ENCODE PACKET`);
	return packet;
}
