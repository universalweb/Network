//  BETA
import {
	filePaths, genericFilenames, hashSizes, nonceSizes, typeNames,
} from '#viat/blocks/defaults';
import { Block } from '#viat/blocks/block';
import { assignToClass } from '@universalweb/utilitylib';
import path from 'path';
import { readStructured } from '#utilities/file';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
// TODO: Add interactive transaction - hashlock, timelock, multisig
export class ReceiptBlock extends Block {
	constructor(data, config) {
		super(config);
		return this.initialize(data, config);
	}
	async getTransactionDirectory() {
		const txPath = this.filesystemConfig.getTransactionDirectory(await this.getCore('transaction'), await this.getCore('sender'));
		return txPath;
	}
	async getTransactionPath() {
		const txPath = this.filesystemConfig.getTransactionBlock(await this.getCore('transaction'), await this.getCore('sender'));
		return txPath;
	}
	async configByTransactionBlock(transactionBlock, config) {
		const coreData = await transactionBlock.getCore();
		const metaData = await transactionBlock.getMeta();
		console.log('metaData', metaData);
		await this.setDefaults();
		await this.setMeta({
			timestamp: metaData.timestamp,
			version: metaData.version,
			nonce: metaData.nonce,
		});
		console.log(metaData);
		await this.setCore({
			sender: coreData.sender,
			transaction: await transactionBlock.getHash(),
			receiver: coreData.receiver,
			amount: coreData.amount,
		});
		return this;
	}
	typeName = typeNames.receipt;
}
export async function receiptBlock(data, config) {
	const block = await (new ReceiptBlock(data, config));
	return block;
}
export default receiptBlock;
// const exampleBlock = await receiptBlock({
// 	data: {
// 		core: {
// 			sender: viatCipherSuite.createBlockNonce(20),
// 			transaction: viatCipherSuite.createBlockNonce(64),
// 			receiver: viatCipherSuite.createBlockNonce(20),
// 			amount: 1000n,
// 			mana: 10n,
// 		},
// 	},
// });
// console.log('Block', exampleBlock);
// await exampleBlock.setDefaults();
// await exampleBlock.setHash();
// console.log('Block', exampleBlock.block);
// console.log('Block HASH SIZE', exampleBlock.block.hash.length);
// console.log('getTransactionDirectory', await exampleBlock.getTransactionDirectory());
// console.log('getTransactionFile', await exampleBlock.getTransactionPath());
// console.log('getDirectory', await exampleBlock.getDirectory());
// console.log('getFile', await exampleBlock.getFile());
// console.log('getFileURL', await exampleBlock.getFileURL());
