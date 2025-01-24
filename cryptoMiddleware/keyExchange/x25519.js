/**
 * @NAME x25519_SHAKE256
 * @DESCRIPTION Cryptography middleware for x25519 with SHAKE256.
 * The shared secret is hashed with x25519_SHAKE256 to a 512bit (64 byte) output & then is split into two 32 byte session keys.
 */
import {
	combineSessionKeys,
	concatHash,
	concatHash512,
	hash256,
	hash512
} from '../hash/shake256.js';
import { x25519KeyExchange } from './X25519KeyExchange.js';
export const x25519 = x25519KeyExchange({
	name: 'x25519',
	alias: 'x25519_SHAKE256',
	id: 0,
	hash256,
	hash512,
	concatHash512,
	concatHash,
	combineSessionKeys
});
export default x25519;
console.log(x25519);
// const keypair = await x25519.encryptionKeypair();
// console.log(keypair);
// console.log(keypair.publicKey.length);
