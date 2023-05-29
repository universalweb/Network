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
	hashSignDetached,
	boxSeal,
	boxUnseal,
	crypto_box_keypair,
	crypto_box_PUBLICKEYBYTES,
	crypto_box_SECRETKEYBYTES
} from '#crypto';
export async function encodePacket(data) {
	const {
		nonce: nonceBuffer,
		transmitKey,
		id,
		state,
		options,
		message,
		headers = {},
		footer,
		client,
		keypair,
		profile,
		ephemeralPublic,
		destination,
		isClient
	} = data;
	const nonce = randomize(nonceBuffer);
	if (id) {
		headers.id = boxSeal(id, destination.publicKey);
	} else {
		return console.error(`ID IS'T ASSIGNED`);
	}
	headers.nonce = nonce;
	message.t = Date.now();
	if (isClient) {
		if (state === 0) {
			console.log('DESTINATION PUBLIC KEY', destination.publicKey);
			headers.key = boxSeal(keypair.publicKey, destination.publicKey);
			const profileKeypairSignature = hashSignDetached(Buffer.concat([nonce, keypair.publicKey]), profile.ephemeral.private);
			message.sig = profileKeypairSignature;
			message.idc = ephemeralPublic;
			console.log(`Sig Size:${message.sig.length}`);
			console.log(`Setting ephemeral random public key to header & profile cert to message.body`);
		}
	}
	success(`PROCESSING MESSAGE TO SEND`);
	if (options) {
		console.log('Packet Options', options);
	}
	const headersEncoded = encode(headers);
	const messageEncoded = encode(message);
	const ad = (footer) ? Buffer.concat([headersEncoded, footer]) : headersEncoded;
	const encryptedMessage = encrypt(messageEncoded, ad, nonce, transmitKey);
	if (!encryptedMessage) {
		return failed('Encryption failed');
	}
	const packet = encode([headersEncoded, encryptedMessage]);
	if (footer) {
		packet[2] = encode(footer);
	}
	info(`clientId: ${toBase64(headers.id)}`);
	info(`Transmit Key ${toBase64(transmitKey)}`);
	info(`Nonce Size: ${headers.nonce.length} ${toBase64(headers.nonce)}`);
	const packetSize = packet.length;
	info(`encode Packet Size ${packetSize}`);
	if (packetSize >= 1280) {
		console.log(packet);
		failed(`WARNING: Packet size is larger than max allowed size 1280 -> ${packetSize} over by ${packetSize - 1280}`);
	}
	return packet;
}
