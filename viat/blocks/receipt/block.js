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
		super(data, config);
		this.initialize(data, config);
		return this;
	}
	async getTransactionDirectory() {
		return getTransactionPath(this.getCore('transaction'), this.getReceiver());
	}
	async getTransactionPath() {
		return getTransaction(this.getCore('transaction'), this.getReceiver());
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
