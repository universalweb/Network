import { blake3 as hash } from '@noble/hashes/blake3';
export const blake3 = {
	name: 'blake3',
	alias: 'default',
	id: 0,
	hash,
	preferred: true
};
