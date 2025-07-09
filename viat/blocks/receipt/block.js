//  BETA
import {
	blockMethods,
	getReceiptFromBlock,
	getReceiptPathFromBlock,
	getReceiptPathURLFromBlock,
	getReceiptURLFromBlock
} from './uri.js';
import {
	getTransaction,
	getTransactionFromBlock,
	getTransactionPath,
	getTransactionPathFromBlock,
	getTransactionPathURLFromBlock,
	getTransactionURLFromBlock
} from '../transaction/uri.js';
import { Block } from '../block.js';
import { assignToClass } from '@universalweb/acid';
import blockDefaults from '../defaults.js';
import { readStructured } from '#utilities/file';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
// Block Hash (TX DATA || Receipt NONCE || Receipt Meta?) Creates cryptographic link to the original transaction block
// Both together create a physical link between the two blocks
export class ReceiptBlock extends Block {
	constructor(data, config) {
		super(config);
		return this.initialize(data, config);
	}
	async getTransactionDirectory() {
		return getTransactionPath(this.getCore('transaction'), this.getReceiver());
	}
	async getTransactionPath() {
		return getTransaction(this.getCore('transaction'), this.getReceiver());
	}
	async configByTransactionBlock(blockObject, config) {
		const txBlockData = await blockObject.getData();
		const txHash = blockObject.block.hash;
		this.appendToCore(txBlockData.core, txHash);
		// Append Meta Data from prior transaction block - makes it easier to manage state but isn't required to store can generate on the fly still
		// Use New Meta Data if requires confirmation or interaction of receiver
		// Don't count until verified and can append data to block for state management
	}
	async appendToCore(coreData, txHash) {
		const {
			receiver,
			sender,
			mana,
			amount,
		} = coreData;
		await this.setCore({
			transaction: txHash,
			receiver,
			sender,
			mana,
			amount
		});
	}
	async config(data, config) {
	}
	typeName = 'receipt';
}
assignToClass(ReceiptBlock, blockMethods);
export async function receiptBlock(data, config) {
	const block = new ReceiptBlock(data, config);
	return block;
}
export default receiptBlock;
// const exampleBlock = await receiptBlock({
// 	sender: viatCipherSuite.createBlockNonce(64),
// 	transaction: viatCipherSuite.createBlockNonce(64),
// 	receiver: viatCipherSuite.createBlockNonce(64),
// 	mana: 1000,
// 	amount: 1000,
//  Reference a prior confirmed receipt's TX hash from the receiver's address. Use path to lookup both receipts and domains.
// Only valid if hash is from a receipt within the same wallet and links to a validated transaction.
// 	priorReceiptTXHash: viatCipherSuite.createBlockNonce(64)
// });
// console.log('Transaction Block', exampleBlock);
// exampleBlock.setDefaults();
// await exampleBlock.setHash();
// console.log('Block HASH/ID', exampleBlock.block);
// console.log(await exampleBlock.validateHash());
