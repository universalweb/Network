// Include a Block Link ID - uses to quickly share a transaction and then can be efficiently found by other parties.
// This is a unique ID that is generated for each transaction. It can be used to quickly find the transaction in the block chain.
// Reference block, link block, Anchor block, receipt block -> Links to received viat from another wallets send block
// TX Queue Block - This is a block that is used to queue transactions and alert validators of needed work. It can be used to quickly find none validated transactions in the block chain that aren't yet indexed.
// Use nonces to prevent replay attacks and ensure if a transaction is identical resulting in the same hash the nonce would result in a different hash mitigating this outcome. It also allows a transaction to have the same contents but the nonce shows they are different transactions still. Then a cancel request can target what otherwise could have been nearly identical transactions resulting in one being canceled over the other. This way a user can target a specific transaction with absolute certainty
import { Block } from './block.js';
import { blockDefaults } from './defaults.js';
import { encodeStrict } from '#utilities/serialize';
import { mapAsyncArray } from '@universalweb/acid';
class TransactionBlock extends Block {
	constructor(config = {}) {
		super(config);
		this.data.meta.blockType = blockDefaults.blockTypes.transactionBlockType;
		return this;
	}
	// Receipt Hash Link
	// Block Hash (TX DATA || Receipt NONCE || Receipt Meta?)
	async createHashLink(...blocks) {
		const blockHashes = await mapAsyncArray(blocks, async (item) => {
			return item.getHash();
		});
		const blockHashLink = this.cipherSuite.hash.hash256(encodeStrict(blockHashes));
		this.set('hashLink', blockHashLink);
		return this;
	}
}
const exampleBlock = new TransactionBlock({
	data: {
		core: {
			amount: 1000,
			receiver: '0x1234567890abcdef1234567890abcdef12345678',
			sender: '0xabcdef1234567890abcdef1234567890abcdef12',
		},
	}
});
console.log('Transaction Block', exampleBlock);
console.log('Transaction Block ENTIRE BINARY', await exampleBlock.exportBinary());
console.log('Transaction Block ENTIRE HASH', await exampleBlock.getBlockHash());
console.log('Transaction Block ENTIRE HASH', await exampleBlock.setBlockHash());
