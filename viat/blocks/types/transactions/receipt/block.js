//  BETA
import {
	blockMethods,
	getReceiptFromBlock,
	getReceiptPathFromBlock,
	getReceiptPathURLFromBlock,
	getReceiptURLFromBlock,
} from './uri.js';
import {
	getTransaction,
	getTransactionFromBlock,
	getTransactionPath,
	getTransactionPathFromBlock,
	getTransactionPathURLFromBlock,
	getTransactionURLFromBlock,
} from '../transaction/uri.js';
import { Block } from '#viat/blocks/block';
import { assignToClass } from '@universalweb/utilitylib';
import blockDefaults from '#viat/blocks/defaults';
import { readStructured } from '#utilities/file';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
// Only signed by receiver to either confirm or reject a hashlock conditional transaction.
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
	async configByProofBlock(blockObject, config) {
		const txBlockData = await blockObject.getData();
		const txHash = blockObject.block.hash;
		this.appendToCore(txBlockData.core, txHash, txBlockData.meta);
	}
	async appendToCore(coreData, transaction, metaData) {
		const {
			receiver,
			sender,
			amount,
		} = coreData;
		const { timestamp } = metaData;
		await this.config({
			transaction,
			receiver,
			sender,
			amount,
			timestamp,
		});
	}
	typeName = 'receipt';
}
assignToClass(ReceiptBlock, blockMethods);
export async function receiptBlock(data, config) {
	const block = await (new ReceiptBlock(data, config));
	return block;
}
export default receiptBlock;
// const exampleBlock = await receiptBlock({
// 	sender: viatCipherSuite.createBlockNonce(64),
// 	transaction: viatCipherSuite.createBlockNonce(64),
// 	receiver: viatCipherSuite.createBlockNonce(64),
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
