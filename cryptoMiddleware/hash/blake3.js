import { blake3 as hash } from '@noble/hashes/blake3';
export const blake3 = {
	name: 'blake3',
	alias: 'fast',
	id: 1,
	async hash(source) {
		return hash(source);
	},
	security: 0,
	preferred: false
};
