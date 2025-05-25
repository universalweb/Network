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
// Means receipt can be made independently of the block
// Then include the block's hash as part of the TX Block Hashlink
// Both are signed meaning they are all linked and contents can be trusted even based on the hash link alone
// Block Hash (TX DATA || Receipt NONCE || Receipt Meta?) Creates cryptographic link to the original transaction block
// Physical link is created by the path of the original TX hash
// Block is stored using the receiver address plus the original transaction hash
// Block's path mirrors the transaction block's path making it easy to find both
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
const exampleBlock = await receiptBlock({
	sender: viatCipherSuite.createBlockNonce(64),
	transaction: viatCipherSuite.createBlockNonce(64),
});
// console.log('Transaction Block', exampleBlock);
// exampleBlock.setDefaults();
// await exampleBlock.setHash();
// console.log('Block HASH/ID', exampleBlock.block);
// console.log(await exampleBlock.validateHash());
