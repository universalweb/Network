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
import { x25519 } from '@noble/curves/ed25519';
import zlib from 'node:zlib';
async function doKyber() {
	// A recipient generates a key pair.
	const recipient = new Kyber512();
	const [
		pkR,
		skR
	] = await recipient.generateKeyPair();
	const sender = new Kyber512();
	console.log(sender);
	const [
		ct,
		ssS
	] = await sender.encap(pkR);
	console.log(encode([
		ct,
		ssS
	]).length);
	const ssR = await recipient.decap(ct, skR);
	console.log(ssR.length, createSessionKey().length, ssS);
	return;
}
try {
	doKyber();
} catch (err) {
	console.log('failed: ', err.message);
}
// Hybrid Post Quantum Key Exchange ckx25519
// C-K KeyExchange 0-RTT Initial (data encrypted with shared post quantum key)
// x25519 Forward Secrecy Response Re-Key Event
// Alternative - Encrypt with 0-RTT the x25519 publicKey - throw away the first CK key
