import { HASH_ALGORITHMS, SCHEME_TYPES } from './defaults.js';
import { HDSeed } from './index.js';
import { assign } from '@universalweb/utilitylib';
class Leaf {
	isLeaf = true;
	STATE = {};
}
class Branch {
	constructor(root, parentBranch) {
		this.root = root;
		this.parentBranch = parentBranch;
		return this;
	}
	isBranch = true;
	async setSeed(config) {
		this.seedInstance = new HDSeed(config);
		if (!config.master_seed) {
			await this.seedInstance.create();
		}
		return this;
	}
	// NOTE: Create seed by namespace instead of ID
	// TODO: Add depth or level
	// Needs to be deterministic and easily mapped by objects
	// Trie can be used to map the branches and leaves then get checksum and snapshot of the structure to generate & verify full trie state
	async addBranch(branchName, config = {}) {
		this[branchName] = new Branch(this.root);
		const preSeed = await this.seedInstance.getPreSeed(config);
		const keyPreSeed = await this.seedInstance.getKeyPreSeed(config);
		await this[branchName].setSeed(assign(config, {
			master_seed: preSeed,
			master_key: keyPreSeed,
		}));
		return this[branchName];
	}
	async getBranch(branchName) {
		return this[branchName];
	}
	async addLeaf(leafName, config = {}) {
		this.leaves[leafName] = new Leaf();
		const key = await this.seedInstance.getKey(config);
		const seed = this.seedInstance.getSeed(config, key);
		this.leaves[leafName].STATE.seed = seed;
		return this.leaves[leafName];
	}
	logInfo() {
		return this.seedInstance.logInfo();
	}
	async getPreSeed(config = {}) {
		const preSeed = await this.seedInstance.getPreSeed(config);
		return preSeed;
	}
	async getSeed(config = {}) {
		const seed = await this.seedInstance.getSeed(config);
		return seed;
	}
	async getKeyPreSeed(config = {}) {
		const keyPreSeed = await this.seedInstance.getKeyPreSeed(config);
		return keyPreSeed;
	}
	async getKey(config = {}) {
		const key = await this.seedInstance.getKey(config);
		return key;
	}
}
export class HDSeedTrie {
	constructor(config = {}) {
		if (config) {
			assign(this.STATE, config);
		}
		return this;
	}
	STATE = new Map(Object.entries({
		version: 1,
	}));
	trie = {};
	async createRoot(config = {}) {
		this.root = new Branch(this);
		await this.root.setSeed(config);
		console.log('Seed Trie Root Created', this.root);
		await this.root.logInfo();
		return this;
	}
	async getRootSeed() {
		console.log(this.root);
		return this.root.seedInstance.STATE.get('master_seed');
	}
	async getRootKey() {
		return this.root.seedInstance.STATE.get('master_key');
	}
	async getRootNonce() {
		return this.root.seedInstance.STATE.get('master_nonce');
	}
	createBranch(branchName, config = {}) {
		const source = new HDSeed(config);
		this[branchName] = source;
		return source;
	}
}
const trie = {
	size: 256,
	branches: {
		branchName: {
			size: 256,
			leaves: {
				leaf: {
					preSeed: 256,
					seed: 32,
				},
				otherLeaf: {
					preSeed: 256,
					seed: 32,
				},
			},
		},
		otherBranch: {
			size: 256,
		},
	},
};
async function example() {
	const trieExample = new HDSeedTrie({});
	await trieExample.createRoot();
	console.log('Root Seed:', await trieExample.getRootSeed());
	const branchViatWallet = await trieExample.root.addBranch('viatWallet', {
		horizontal_id: 0,
	});
	const branchViatWalletSeed = await trieExample.root.getBranch('viatWallet');
	console.log('Branch ViatWallet Seed:', branchViatWallet.seedInstance.STATE.get('master_seed'));
	// await trieExample.root.logInfo();
}
await example();
