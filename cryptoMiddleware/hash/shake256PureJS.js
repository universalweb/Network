import { hash512Settings, int32, int64 } from '#crypto';
import { shake256 as hash } from '@noble/hashes/sha3';
import { hashScheme } from './hashScheme.js';
export async function hash256(source) {
	return hash(source);
}
export async function hash512(source) {
	return hash(source, hash512Settings);
}
export const shake256PureJS = hashScheme({
	name: 'shake256PureJS',
	alias: 'shake256PureJS',
	id: 3,
	security: 1,
	preferred: false,
	hash256,
	hash: hash256,
	hash512,
});
export default shake256PureJS;
