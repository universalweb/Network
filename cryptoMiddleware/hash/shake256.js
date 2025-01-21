import { shake256 as hash } from '@noble/hashes/sha3';
export const shake256 = {
	name: 'shake256',
	alias: 'default',
	id: 0,
	async hash(source) {
		return hash(source);
	},
	security: 1,
	preferred: true
};
