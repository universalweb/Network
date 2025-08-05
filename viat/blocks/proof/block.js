import { assignToClass, get, mapAsyncArray } from '@universalweb/utilitylib';
import {
	blockMethods,
	getProofFromBlock,
	getProofPathFromBlock,
	getProofPathURLFromBlock,
	getProofURLFromBlock,
} from './uri.js';
// Consider Multi-part proof block -> reduce size and cost of each proof
import { toBase64Url, toHex } from '#crypto/utils.js';
import { Block } from '../block.js';
import blockDefaults from '../defaults.js';
import { encodeStrict } from '#utilities/serialize';
import { getFullPathFromBlock } from '../utils.js';
import { loadBlock } from '#viat/blocks/utils';
import path from 'path';
import { proofBlockSchema } from './schema.js';
import receiptBlock from '../receipt/block.js';
import transactionBlock from '../transaction/block.js';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
// GET PRIOR TRANSACTION ID MAX & PRIOR HASH - include prior hash as parent then increment ID
class ProofBlock extends Block {
	constructor(data, config) {
		super(config);
		return this.initialize(data, config);
	}
	async createReceipt() {
		const receipt = await receiptBlock(this);
		await receipt.setHash();
		return receipt;
	}
	async setReceipt() {
		this.receipt = await this.createReceipt();
		return this;
	}
	async createTransaction() {
		const transaction = await transactionBlock(this);
		await transaction.setHash();
		return transaction;
	}
	blockSchema = proofBlockSchema;
	typeName = 'proof';
}
assignToClass(ProofBlock, blockMethods);
export async function proofBlock(data, config) {
	const block = await (new ProofBlock(data, config));
	return block;
}
export default proofBlock;
const exampleBlock = await proofBlock({
	amount: 1000n,
	receiver: viatCipherSuite.createBlockNonce(64),
	sender: viatCipherSuite.createBlockNonce(64),
	mana: 1000n,
	sequence: 0n,
});
// console.log('Block HASH/ID', await exampleBlock.id());
console.log('Proof Block', exampleBlock);
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
// console.log('Proof Block ENTIRE BINARY', await exampleBlock.exportBinary());
