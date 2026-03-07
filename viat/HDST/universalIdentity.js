import { HDSeedTrie } from './HDSeedTree.js';
import { assign } from '@universalweb/utilitylib';
export class UniversalProfile {
	constructor(config = {}) {
		if (config) {
			assign(this.STATE, config);
		}
		return this;
	}
	STATE = new Map(Object.entries({
		version: 1,
	}));
	async createHDSeedTrie(config = {}) {
		this.trie = new HDSeedTrie(config);
		await this.trie.createRoot(config);
		return this.trie;
	}
}
export default UniversalProfile;

