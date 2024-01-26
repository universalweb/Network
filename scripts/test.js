import { Kyber1024, Kyber512, Kyber768 } from 'crystals-kyber-js';
import {
	authenticatedBox,
	authenticatedBoxOpen,
	decrypt,
	encrypt,
	encryptKeypair,
	signKeypair,
} from '#utilities/crypto';
import { decode, encode } from 'msgpackr';
async function doKyber() {
	// A recipient generates a key pair.
	const recipient = new Kyber768();
	const [
		pkR,
		skR
	] = await recipient.generateKeyPair();
	/// / Deterministic key generation is also supported
	// const seed = new Uint8Array(64);
	// globalThis.crypto.getRandomValues(seed); // node >= 19
	// const [pkR, skR] = await recipient.deriveKeyPair(seed);
	// A sender generates a ciphertext and a shared secret with pkR.
	const sender = new Kyber768();
	console.log(sender);
	const [
		ct,
		ssS
	] = await sender.encap(pkR);
	const sen = encryptKeypair();
	const rec = encryptKeypair();
	const a = authenticatedBox(encode([
		1,
		0,
		sen.publicKey
	]), rec, sen);
	const h = encode([
		ct,
		encrypt(a, ssS),
	]);
	console.log(h.length, pkR.length, ssS.length);
	// console.log(encode([
	// 	ct,
	// 	encrypt(authenticatedBox(encode([
	// 		1,
	// 		0,
	// 		encryptKeypair().publicKey
	// 	]), encryptKeypair(), encryptKeypair()), ssS),
	// ]).length, pkR.length, ssS.length);
	// The recipient decapsulates the ciphertext and generates the same shared secret with skR.
	const ssR = await recipient.decap(ct, skR);
	console.log(ssR, ssS);
	const m = decrypt(decode(h)[1], ssR);
	console.log(m.length);
	console.log(decode(authenticatedBoxOpen(a, rec, sen)));
	return;
}
try {
	doKyber();
} catch (err) {
	console.log('failed: ', err.message);
}
