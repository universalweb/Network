import { Kyber1024, Kyber512, Kyber768 } from 'crystals-kyber-js';
import {
	authenticatedBox,
	authenticatedBoxOpen,
	createSessionKey,
	decrypt,
	encrypt,
	keypair,
	signKeypair
} from '#utilities/crypto';
import { decode, encode } from 'msgpackr';
import { randomBuffer } from '#crypto';
import { x25519 } from '@noble/curves/ed25519';
import zlib from 'node:zlib';
// TODO: Implement Kyber1024, Kyber512, Kyber768 into one option for encryption
const seed = randomBuffer(64);
async function doKyber() {
	// A recipient generates a key pair.
	const recipient = new Kyber1024();
	console.log(recipient);
	const [
		pkR,
		skR
	] = await recipient.deriveKeyPair(seed);
	console.log(
		pkR,
		skR
	);
	console.log(await recipient.deriveKeyPair(seed));
	const sender = new Kyber1024();
	const [
		ct,
		ssS
	] = await sender.encap(pkR);
	console.log('KYBER KEY SIZE:', pkR.length);
	const ssR = await recipient.decap(ct, skR);
	const encrypted = encrypt(encode([
		[
			Buffer.alloc(0), 0, 0, 0
		]
	]), ssS);
	console.log('ESTIMATED PACKET HELLO', 90 + ct.length, 'KYBER-OVERHEAD', ct.length);
	console.log(recipient, sender);
	return;
}
doKyber();
// Hybrid Post Quantum Key Exchange ckx25519
// C-K KeyExchange 0-RTT Initial (data encrypted with shared post quantum key)
// x25519 Forward Secrecy Response Re-Key Event
// Alternative - Encrypt with 0-RTT the x25519 publicKey - throw away the first CK key
