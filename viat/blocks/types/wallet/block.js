import {
	filePaths,
	genericFilenames,
	hashSizes,
	nonceSizes,
	typeNames,
} from '#viat/blocks/defaults';
import { Block } from '#viat/blocks/block';
import { assignToClass } from '@universalweb/utilitylib';
import path from 'path';
import { readStructured } from '#utilities/file';
import { receiptBlock } from '#blocks/transactions/receipt/block';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
import wallet from '#viat/wallet/wallet';
export class WalletBlock extends Block {
	constructor(data, config) {
		super(config);
		return this.initialize(data, config);
	}
	async configByWallet(data, config) {
		const walletObject = await data.exportObject();
		console.log('wallet object', walletObject);
		this.setWalletType(walletObject.address);
		await this.setCore('publicKey', walletObject.core.signatureKeypair.publicKey);
		await this.setCore('walletVersion', walletObject.version);
		await this.setCore('walletTimestamp', walletObject.date);
		await this.setCore('cipherSuiteID', walletObject.cipherSuiteID);
		await this.setCore('address', await walletObject.address);
	}
	setWalletType(addressArg) {
		const address = this.getCore('address') || addressArg;
		if (address) {
			const walletLength = address.length;
			if (walletLength === 20) {
				this.setFilesystem('wallet');
			} else if (walletLength === 32) {
				this.setFilesystem('hybridWallet');
			} else if (walletLength === 64) {
				this.setFilesystem('quantumWallet');
			}
		}
	}
	async getFilePathPrefix(hash) {
		return this.filesystem.pathPrefix.encode(hash || await this.getAddress());
	}
	async getFinalDirectory(hash) {
		return this.filesystem.uniquePath.encode(hash || await this.getAddress());
	}
	async getDirectory() {
		return this.filesystem.getFullPath(await this.getAddress());
	}
	async getFile() {
		return this.filesystem.getFile(await this.getAddress());
	}
	async getURL() {
		return this.filesystem.getURL(await this.getAddress());
	}
	async getAddress() {
		return this.getCore('address');
	}
	async getFileURL() {
		return this.filesystem.getFileURL(await this.getAddress());
	}
	// blockSchema = walletBlockSchema;
	typeName = typeNames.wallet;
}
export async function walletBlock(...args) {
	const block = await (new WalletBlock(...args));
	return block;
}
export default walletBlock;
// const amy = await wallet();
// console.log(await amy.exportObject());
// const exampleBlock = await walletBlock(amy);
// await exampleBlock.finalize();
// await exampleBlock.sign(amy);
// console.log(exampleBlock.block);
// console.log('getDirectory', await exampleBlock.getDirectory());
// console.log('getFile', await exampleBlock.getFile());
// console.log('getFileURL', await exampleBlock.getFileURL());
// console.log(exampleBlock.filesystem);
