import { assignToClass, isBuffer } from '@universalweb/utilitylib';
//  BETA
import {
	filePaths,
	genericFilenames,
	hashSizes,
	nonceSizes,
	typeNames,
} from '#viat/blocks/defaults';
import { Block } from '#viat/blocks/block';
import path from 'path';
import { readStructured } from '#utilities/file';
import { receiptBlock } from '#blocks/transactions/receipt/block';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
import wallet from '#viat/wallet/wallet';
// GET PRIOR TRANSACTION ID MAX & PRIOR HASH - include prior hash as parent then increment ID
class TransactionBlock extends Block {
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
	async getReceiptDirectory() {
		const txPath = this.filesystemConfig.getReceiptDirectory(await this.getHash(), await this.getCore('receiver'));
		return txPath;
	}
	async getReceiptPath() {
		const txPath = this.filesystemConfig.getReceiptBlock(await this.getHash(), await this.getCore('receiver'));
		return txPath;
	}
	typeName = typeNames.transaction;
}
export async function transactionBlock(data, config) {
	const block = await (new TransactionBlock(data, config));
	return block;
}
export async function createTransactionBlock(core, senderWallet) {
	const tx = await transactionBlock({
		data: {
			core,
		},
	});
	if (isBuffer(senderWallet)) {
		core.sender = senderWallet;
	} else {
		core.sender = await senderWallet.getAddress();
	}
	await tx.finalize();
	if (tx.sign) {
		await tx.sign(senderWallet);
	}
	return tx;
}
export default transactionBlock;
const exampleBlock = await createTransactionBlock({
	sender: viatCipherSuite.createBlockNonce(20),
	receiver: viatCipherSuite.createBlockNonce(20),
	amount: 1000n,
	mana: 10n,
	parent: viatCipherSuite.createBlockNonce(64),
}, await wallet());
console.log('Block', exampleBlock);
console.log('Block', exampleBlock.block);
// console.log((await exampleBlock.estimateBlockSize()));
// console.log('Block signature SIZE', exampleBlock.block.signature.length);
// await exampleBlock.saveBlock();
// console.log('Block HASH SIZE', exampleBlock.block.hash.length);
// console.log('getReceiptDirectory', await exampleBlock.getReceiptDirectory());
// console.log('getReceiptPath', await exampleBlock.getReceiptPath());
console.log('getDirectory', await exampleBlock.getDirectory());
console.log('getFile', await exampleBlock.getFile());
// console.log('getFileURL', await exampleBlock.getFileURL());
await exampleBlock.setReceipt();
exampleBlock.receipt.finalize();
// console.log('receipt', exampleBlock.receipt.block);
// console.log('getSenderPath', await exampleBlock.getReceiverPath());
