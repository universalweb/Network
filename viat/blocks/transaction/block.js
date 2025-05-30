import { assignToClass, get, mapAsyncArray } from '@universalweb/acid';
import {
	blockMethods,
	getTransactionFromBlock,
	getTransactionPathFromBlock,
	getTransactionPathURLFromBlock,
	getTransactionURLFromBlock
} from './uri.js';
// Consider Multi-part transaction block -> reduce size and cost of each transaction
import { toBase64Url, toHex } from '#crypto/utils.js';
import { Block } from '../block.js';
import blockDefaults from '../defaults.js';
import { encodeStrict } from '#utilities/serialize';
import { getBlockFromBlock } from '../utils.js';
import { loadBlock } from '#viat/blocks/utils';
import path from 'path';
import receiptBlock from '../receipt/block.js';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
class TransactionBlock extends Block {
	constructor(data, config) {
		super(data, config);
		this.initialize(data, config);
		return this;
	}
	// Receipt Hash Link
	// Block Hash (TX DATA || Receipt Meta?)
	async createReceipt(block) {
		this.receipt = await receiptBlock(this);
		return this;
	}
	getReceiptPath() {
		const { source, } = this;
		const filepath = getTransactionPathFromBlock(this);
		const networkPath = (source) ? source().networkPath : undefined;
		const fullFilepath = (networkPath) ? path.join(networkPath, filepath) : filepath;
		return fullFilepath;
	}
	async getReceipt() {
		const transactionPath = this.getReceiptPath();
		return getBlockFromBlock(transactionPath, this);
	}
	typeName = 'transaction';
}
assignToClass(TransactionBlock, blockMethods);
export async function transactionBlock(data, config) {
	const block = new TransactionBlock(data, config);
	return block;
}
export default transactionBlock;
// const exampleBlock = await transactionBlock({
// 	amount: 1000,
// 	receiver: viatCipherSuite.createBlockNonce(64),
// 	sender: viatCipherSuite.createBlockNonce(64),
// 	mana: 1000,
// });
// console.log('Block HASH/ID', await exampleBlock.id());
// console.log('Transaction Block', exampleBlock);
// exampleBlock.setDefaults();
// await exampleBlock.setHash();
// console.log('Block Object', exampleBlock.block);
// console.log(await exampleBlock.validateHash());
// console.log(await exampleBlock.getHash(), exampleBlock.getReceiver());
// console.log('getURL', await exampleBlock.getURL());
// console.log('getPath', await exampleBlock.getPath());
// console.log('getSenderPath', await exampleBlock.getSenderPath());
// console.log('getReceiverPath', await exampleBlock.getReceiverPath());
// console.log('getDirectory', await exampleBlock.getDirectory());
// console.log('getDirectoryURL', await exampleBlock.getDirectoryURL());
// console.log('Transaction Block ENTIRE BINARY', await exampleBlock.exportBinary());
