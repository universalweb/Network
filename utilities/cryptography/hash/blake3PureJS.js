import {
	clearBuffer,
	clearBuffers,
	hash512Settings,
	int32,
	int64
} from '#utilities/cryptography/utils';
import { blake3 as hash } from '@noble/hashes/blake3';
import { hashScheme } from './hashScheme.js';
export async function hash256(source) {
	return hash(source);
}
export async function hash512(source) {
	return hash(source, hash512Settings);
}
export const blake3PureJS = hashScheme({
	name: 'blake3PureJS',
	alias: 'blake3PureJS',
	id: 2,
	security: 0,
	preferred: false,
	hash256,
	hash: hash256,
	hash512,
});
export default blake3PureJS;
