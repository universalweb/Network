import { Block } from '../block.js';
import { blockDefaults } from './defaults.js';
import { encodeStrict } from '#utilities/serialize';
import { mapAsyncArray } from '@universalweb/acid';
const { linkBlockType } = blockDefaults.blockTypes;
// LinkBlock: Are abstract and arbitrary hash-based block links used to navigate to otherwise unrelated blocks
// Merkle Patricia Trie of linked blocks
// Vector commitments
// Link block - A block that contains a hash of other blocks. This can be used to create a chain of blocks that are linked together by their internal hashes (DATA: META || CORE). This can be used to create a Merkle tree.
// The hash link itself is the hash of the entire block
// Could allow for multi party transactions
class LinkBlock extends Block {
	constructor(config = {}) {
		super(config);
		return this;
	}
	// Create Hash Link Block then can link distant blocks together with a deterministic hash acting as a shared link
	async createHashLink(...blocks) {
		const blockHashes = await mapAsyncArray(blocks, async (item) => {
			return item.getHash();
		});
		const blockHashLink = this.cipherSuite.hash.hash256(encodeStrict(blockHashes));
		this.set('hashLink', blockHashLink);
		return this;
	}
	async getHashLink() {
		return this.get('hashLink');
	}
	blockType = linkBlockType;
}
