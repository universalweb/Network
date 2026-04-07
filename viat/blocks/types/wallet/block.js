import {
	filePaths,
	genericFilenames,
	hashSizes,
	nonceSizes,
	typeNames,
} from '#viat/blocks/defaults';
import { Block } from '#viat/blocks/block';
import VIAT_DEFAULTS from '#viat/defaults';
import { assignToClass } from '@universalweb/utilitylib';
import path from 'path';
import { readStructured } from '#utilities/file';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
import wallet from '#viat/wallet/wallet';
export class WalletBlock extends Block {
	constructor(data, config) {
		super(config);
	}
	static async create(data, config) {
		const block = new WalletBlock(data, config);
		await block.initialize(data, config);
		return block;
	}
	async configByWallet(data, config) {
		const walletObject = await data.exportObject();
		const trapdoorSignatureHash = await data.getTrapdoorSignatureHash();
		console.log('wallet object', walletObject);
		this.setWalletType(walletObject.address);
		await this.setCore('publicKey', walletObject.core.signatureKeypair.publicKey);
		await this.setCore('walletVersion', walletObject.version);
		await this.setCore('walletTimestamp', walletObject.date);
		await this.setCore('cipherSuiteID', walletObject.cipherSuiteID);
		await this.setCore('address', await walletObject.address);
		await this.setCore('trapdoor', trapdoorSignatureHash);
	}
	setWalletType(addressArg) {
		const address = this.getCore('address') || addressArg;
		if (address) {
			const walletLength = address.length;
			if (walletLength === VIAT_DEFAULTS.WALLETS.LEGACY.WALLET_SIZE) {
				this.setFilesystem('wallet');
			} else if (walletLength === VIAT_DEFAULTS.WALLETS.HYBRID.WALLET_SIZE) {
				this.setFilesystem('hybridWallet');
			} else if (walletLength === VIAT_DEFAULTS.WALLETS.QUANTUM.WALLET_SIZE) {
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
	async getFileURL() {
		return this.filesystem.getFileURL(await this.getAddress());
	}
	// blockSchema = walletBlockSchema;
	typeName = typeNames.wallet;
}
export default WalletBlock;
// const amy = await wallet();
// console.log(await amy.exportObject());
// const exampleBlock = await WalletBlock.create(amy);
// await exampleBlock.finalize();
// await exampleBlock.sign(amy);
// console.log(exampleBlock.block);
// console.log(await exampleBlock.estimateBlockSize());
// console.log('getDirectory', await exampleBlock.getDirectory());
// console.log('getFile', await exampleBlock.getFile());
// console.log('getFileURL', await exampleBlock.getFileURL());
// console.log(exampleBlock.filesystem);
