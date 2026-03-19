import { HDSeedTree } from './HDSeedTree.js';
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
	async createHDSeedTree(config = {}) {
		this.tree = new HDSeedTree(config);
		await this.tree.createRoot(config);
		return this.tree;
	}
}
export default UniversalProfile;

