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
	omit
} from 'Acid';
import {
	encrypt,
	nonceBox,
	randomize,
	toBase64,
	signDetached,
	boxSeal,
} from '#crypto';
export async function encodePacket(config) {
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
		isServerClient
	} = source;
	const destination = source.destination || config.destination;
	const id = destination.id || source.id;
	const nonce = nonceBox();
	let encryptConnectionId;
	if (isServer) {
		encryptConnectionId = source.certificate.encryptConnectionId;
	} else if (isClient) {
		encryptConnectionId = destination.encryptConnectionId;
	} else if (isServerClient) {
		encryptConnectionId = source.encryptConnectionId;
	}
	if (id) {
		if (encryptConnectionId) {
			// Would be interesting to see if none-deterministic signatures could be a better fit
			headers.id = boxSeal(id, destination.encryptKeypair.publicKey);
		} else {
			headers.id = id;
		}
	} else {
		return console.error(`ID IS'T ASSIGNED`);
	}
	headers.nonce = nonce;
	message.t = Date.now();
	if (isClient) {
		if (state === 0) {
			console.log('DESTINATION ENCRYPT PUBLIC KEY', toBase64(destination.encryptKeypair.publicKey));
			headers.key = boxSeal(source.keypair.publicKey, destination.encryptKeypair.publicKey);
		}
	}
	success(`PROCESSING MESSAGE TO SEND`);
	if (options) {
		console.log('Packet Options', options);
	}
	const headersEncoded = encode(headers);
	const messageEncoded = encode(message);
	const ad = (footer) ? Buffer.concat([headersEncoded, footer]) : headersEncoded;
	const encryptedMessage = encrypt(messageEncoded, ad, nonce, source.sessionKeys.transmitKey);
	if (!encryptedMessage) {
		return failed('Encryption failed');
	}
	const packet = encode([headersEncoded, encryptedMessage]);
	if (footer) {
		packet[2] = encode(footer);
	}
	info(`clientId: ${toBase64(headers.id)}`);
	info(`Transmit Key ${toBase64(source.sessionKeys.transmitKey)}`);
	info(`Nonce Size: ${headers.nonce.length} ${toBase64(headers.nonce)}`);
	const packetSize = packet.length;
	info(`encoded Packet Size ${packetSize}`);
	if (packetSize >= 1280) {
		console.log(packet);
		failed(`WARNING: Packet size is larger than max allowed size 1280 -> ${packetSize} over by ${packetSize - 1280}`);
	}
	return packet;
}
