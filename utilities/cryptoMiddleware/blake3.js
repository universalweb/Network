import { blake3 } from '@noble/hashes/blake3';
const hash = blake3;
export const blake3Hash = {
	name: 'blake3',
	alias: 'default',
	id: 0,
	hash,
	preferred: true
};
export { hash };
