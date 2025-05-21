import { get, mapAsyncArray } from '@universalweb/acid';
import {
	getTransactionFromBlock, getTransactionPathFromBlock, getTransactionPathURLFromBlock, getTransactionURLFromBlock
} from './uri.js';
// Include a Block Link ID - uses to quickly share a transaction and then can be efficiently found by other parties.
// This is a unique ID that is generated for each transaction. It can be used to quickly find the transaction in the block chain.
// Reference block, link block, Anchor block, receipt block -> Links to received viat from another wallets send block
// TX Queue Block - This is a block that is used to queue transactions and alert validators of needed work. It can be used to quickly find none validated transactions in the block chain that aren't yet indexed.
// Bloom Filter for confirmed transactions updated by the sender?
// One for verifiers to check if a transaction is confirmed
// The last for confirmed transactions that have been fully audited and verified
// Use Merkle Trees with bloom filters - use merkle tree to confirm bloom filter then
import { toBase64Url, toHex } from '#crypto/utils.js';
import { Block } from '../block.js';
import blockDefaults from '../defaults.js';
import { encodeStrict } from '#utilities/serialize';
// import receiptBlock from '../receipt.js';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
class TransactionBlock extends Block {
	constructor(config) {
		super(config);
		if (config.amount) {
			this.setCore('amount', config.amount);
		}
		if (config.receiver) {
			this.setCore('receiver', config.receiver);
		}
		if (config.sender) {
			this.setCore('sender', config.sender);
		}
		this.initialize();
		return this;
	}
	// Receipt Hash Link
	// Block Hash (TX DATA || Receipt Meta?)
	async generateReceipt(block) {
		// this.receipt = receiptBlock(this);
		return this;
	}
	getPath() {
		return getTransactionFromBlock(this);
	}
	getURL() {
		return getTransactionURLFromBlock(this);
	}
	getDirectory() {
		return getTransactionPathFromBlock(this);
	}
	getDirectoryURL() {
		return getTransactionPathURLFromBlock(this);
	}
	typeName = 'transaction';
	hashSize = 64;
}
export function transactionBlock(config) {
	const block = new TransactionBlock(config);
	return block;
}
export default transactionBlock;
const exampleBlock = transactionBlock({
	amount: 1000,
	receiver: viatCipherSuite.createBlockNonce(64),
	sender: viatCipherSuite.createBlockNonce(64),
});
// console.log('Block HASH/ID', await exampleBlock.id());
// console.log('Transaction Block', exampleBlock);
// exampleBlock.setDefaults();
// await exampleBlock.setHash();
// console.log('Block HASH/ID', exampleBlock.block);
// console.log(await exampleBlock.validateHash());
// console.log(await exampleBlock.getHash(), exampleBlock.getSender());
// console.log('getURL', await exampleBlock.getURL());
// console.log('getPath', await exampleBlock.getPath());
// console.log('getPath', await exampleBlock.getSenderPath());
// console.log('getPath', await exampleBlock.getReceiverPath());
// console.log('getDirectory', await exampleBlock.getDirectory());
// console.log('getDirectoryURL', await exampleBlock.getDirectoryURL());
// console.log('Transaction Block ENTIRE BINARY', await exampleBlock.exportBinary());
