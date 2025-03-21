/**
 * @NAME x25519_blake3
 * @DESCRIPTION Cryptography middleware for X25519 with BLAKE3.
 */
import hash from '../hash/blake3.js';
import { x25519KeyExchange } from './X25519KeyExchange.js';
export const x25519_blake3 = x25519KeyExchange({
	name: 'x25519_blake3',
	alias: 'x25519_blake3',
	id: 0,
	hash
});
export default x25519_blake3;
// const client = await x25519_blake3.keypair();
// const server = await x25519_blake3.keypair();
// console.log(client, server);
// console.log(await x25519_blake3.clientSetSessionAttach(client, server));
// console.log(await x25519_blake3.serverSetSessionAttach(server, client));
// console.log(keypair.publicKey.length);
