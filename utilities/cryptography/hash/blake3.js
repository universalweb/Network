import {
	bufferFrom,
	clearBuffer,
	clearBuffers,
	hexString,
	hexToBuffer,
	int256,
	int32,
	int512,
	int64,
} from '#utilities/cryptography/utils';
import { createBLAKE3, blake3 as hash } from 'hash-wasm';
import { hashScheme } from './hashScheme.js';
export async function hash256(source) {
	return hexToBuffer(await hash(source, int256));
}
export async function hash512(source) {
	return hexToBuffer(await hash(source, int512));
}
export async function hashXOF(source, outputLength) {
	return hexToBuffer(await hash(source, outputLength));
}
export const blake3 = hashScheme({
	name: 'blake3',
	alias: 'blake3',
	id: 1,
	security: 0,
	preferred: false,
	hash256,
	hash: hash256,
	hash512,
	hashXOF,
});
export default blake3;
// console.log((await hash(Buffer.from('hello world'), int256)));
