import {
	bufferFrom,
	clearBuffer,
	clearBuffers,
	hexString,
	int32,
	int512,
	int64
} from '#utilities/cryptography/utils';
import { createBLAKE3, blake3 as hash } from 'hash-wasm';
import { hashScheme } from './hashScheme.js';
export async function hash256(source) {
	return bufferFrom(await hash(source), hexString);
}
export async function hash512(source) {
	return bufferFrom(await hash(source, int512), hexString);
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
});
export default blake3;
// console.log((await hash512('hello world')));
