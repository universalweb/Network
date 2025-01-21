import { decode, encode } from 'msgpackr';
import { ml_kem1024, ml_kem512, ml_kem768 } from '@noble/post-quantum/ml-kem';
import { encrypt } from '../cryptoMiddleware/encryption/XChaCha.js';
import { randomBuffer } from '#crypto';
import { slh_dsa_sha2_128f as sph } from '@noble/post-quantum/slh-dsa';
import { x25519 } from '@noble/curves/ed25519';
import zlib from 'node:zlib';
const seed = randomBuffer(64);
async function doKyber() {
	// const aliceSigKeys = sph.keygen();
	// const msg = new Uint8Array(1);
	// const sig = sph.sign(aliceSigKeys.secretKey, msg);
	// const isValid = sph.verify(aliceSigKeys.publicKey, msg, sig);
	// console.log('SLH-DSA', isValid);
	const aliceKeys = ml_kem768.keygen(seed);
	const bobKeys = ml_kem768.keygen();
	const alicePub = aliceKeys.publicKey;
	console.log(aliceKeys);
	const {
		cipherText, sharedSecret: bobShared
	} = ml_kem768.encapsulate(aliceKeys.publicKey);
	const aliceShared = ml_kem768.decapsulate(cipherText, aliceKeys.secretKey);
	const emptyBuffer = Buffer.alloc(0);
	const encrypted = await encrypt(emptyBuffer, aliceShared, emptyBuffer);
	console.log('ENCRYPTED', encrypted.length);
	console.log('ALICE', aliceShared, 'BOB', bobShared);
	console.log('ESTIMATED PACKET HELLO', 104 + cipherText.length, 'KYBER-OVERHEAD', cipherText.length, 'PublicKey', aliceKeys.publicKey.length);
	return;
}
doKyber();
// Hybrid Post Quantum Key Exchange ckx25519
// C-K KeyExchange 0-RTT Initial (data encrypted with shared post quantum key)
// x25519 Forward Secrecy Response Re-Key Event
// Alternative - Encrypt with 0-RTT the x25519 publicKey - throw away the first CK key
