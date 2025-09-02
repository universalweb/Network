/**
 * @NAME x25519
 * @alias x25519_SHAKE256
 * @DESCRIPTION Key exchange with x25519 & hashing is done with SHAKE256.
 */
import hash from '../hash/shake256.js';
import x25519KeyExchange from './X25519KeyExchange.js';
export const x25519 = x25519KeyExchange({
	name: 'x25519',
	alias: 'x25519_SHAKE256',
	id: 0,
	hash,
});
export default x25519;
// const client = await x25519.keyExchangeKeypair();
// const server = await x25519.keyExchangeKeypair();
// await x25519.clientInitializeSession(client, server);
// await x25519.serverInitializeSession(server, client, client.publicKey);
// console.log('client', client);
// console.log('server', server);
// // Copy used because of cleanup
// const clientPublicKey = Buffer.from(client.publicKey);
// await x25519.clientSetSession(client, server, server.nextSession.publicKey);
// console.log('client', client);
// await x25519.serverSetSession(server, {
// 	publicKey: clientPublicKey
// }, server);
// console.log('server', server);
