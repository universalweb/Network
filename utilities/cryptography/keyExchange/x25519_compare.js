// Compare x25519 for compatability and correctness
import { clientSetSession, keyExchangeKeypair, serverSetSession } from './x25519_blake2b.js';
import { blake2b as b2 } from 'hash-wasm';
import { blake2b } from '@noble/hashes/blake2b';
import { bufferAlloc } from '#utilities/cryptography/utils';
import { getSharedSecret } from './X25519KeyExchange.js';
console.log('x25519 START');
const sodium = await import('sodium-native');
const libsodium = sodium?.default || sodium;
const cl = await keyExchangeKeypair();
const sr = await keyExchangeKeypair();
const cS = clientSetSession(cl, sr);
const ss = serverSetSession(sr, cl);
console.log(cS);
console.log(ss);
const q = bufferAlloc(32);
const ssc = libsodium.crypto_scalarmult(q, cl.privateKey, sr.publicKey);
const sharedSecret = getSharedSecret(cl?.privateKey, sr?.publicKey);
console.log(sharedSecret, q);
const b = Buffer.concat([
	sharedSecret,
	cl.publicKey,
	sr.publicKey
]);
console.log(b);
const hashSharedSecret = Buffer.from(await blake2b(b, 256));
const g = bufferAlloc(64);
libsodium.crypto_generichash(g, b);
console.log('hash', Buffer.from(await b2(b, 512), 'hex'), Buffer.from(await b2(b, 512), 'hex').length);
console.log('hash', hashSharedSecret, hashSharedSecret.length);
console.log('hash', g, g.length);
const transmitKey = hashSharedSecret.subarray(32);
const receiveKey = hashSharedSecret.subarray(0, 32);
console.log(transmitKey);
console.log(receiveKey);
