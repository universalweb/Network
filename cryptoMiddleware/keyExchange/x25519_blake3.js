/**
 * @NAME x25519_blake3
 * @DESCRIPTION Cryptography middleware for X25519 with BLAKE3.
 * The shared secret is hashed with BLAKE3 to a 512bit (64 byte) output & then is split into two 32 byte session keys.
 */
import {
	combineSessionKeys,
	concatHash,
	concatHash512,
	hash256,
	hash512
} from '../hash/blake3.js';
import { x25519KeyExchange } from './X25519KeyExchange.js';
export const x25519_blake3 = x25519KeyExchange({
	name: 'x25519_blake3',
	alias: 'x25519_blake3',
	id: 0,
	hash256,
	hash512,
	concatHash512,
	concatHash,
	combineSessionKeys
});
export default x25519_blake3;
const keypair = x25519_blake3.keypair();
console.log(keypair);
console.log(keypair.publicKey.length);
