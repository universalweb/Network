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
import { ml_kem1024, ml_kem512, ml_kem768 } from '@noble/post-quantum/ml-kem';
import { randomBuffer } from '#crypto';
import { slh_dsa_sha2_128f as sph } from '@noble/post-quantum/slh-dsa';
import { x25519 } from '@noble/curves/ed25519';
import zlib from 'node:zlib';
// TODO: Implement Kyber1024, Kyber512, Kyber768 into one option for encryption
const seed = randomBuffer(64);
async function doKyber() {
	const aliceSigKeys = sph.keygen();
	const msg = new Uint8Array(1);
	const sig = sph.sign(aliceSigKeys.secretKey, msg);
	const isValid = sph.verify(aliceSigKeys.publicKey, msg, sig);
	console.log('SLH-DSA', isValid);
	const aliceKeys = ml_kem768.keygen();
	const alicePub = aliceKeys.publicKey;
	const {
		cipherText, sharedSecret: bobShared
	} = ml_kem768.encapsulate(alicePub);
	const aliceShared = ml_kem768.decapsulate(cipherText, aliceKeys.secretKey);
	console.log('ALICE', aliceShared, 'BOB', bobShared);
	// A recipient generates a key pair.
	const recipient = new Kyber768();
	// console.log(recipient);
	const [
		pkR,
		skR
	] = await recipient.deriveKeyPair(seed);
	console.log(
		pkR,
		skR
	);
	// console.log(await recipient.deriveKeyPair(seed));
	const sender = new Kyber768();
	const [
		ct,
		ssS
	] = await sender.encap(pkR);
	console.log('KYBER KEY SIZE:', pkR.length, skR.length);
	const ssR = await recipient.decap(ct, skR);
	const encrypted = encrypt(encode([
		[
			Buffer.alloc(0), 0, 0, 0
		]
	]), ssS);
	console.log('ESTIMATED PACKET HELLO', 90 + ct.length, 'KYBER-OVERHEAD', ct.length);
	// console.log(recipient, sender);
	return;
}
doKyber();
// Hybrid Post Quantum Key Exchange ckx25519
// C-K KeyExchange 0-RTT Initial (data encrypted with shared post quantum key)
// x25519 Forward Secrecy Response Re-Key Event
// Alternative - Encrypt with 0-RTT the x25519 publicKey - throw away the first CK key
