// Root Genesis Block
import {
	filePaths, genericFilenames, hashSizes, nonceSizes, typeNames,
} from '#viat/blocks/defaults';
import { Block } from '#viat/blocks/block';
import { assignToClass } from '@universalweb/utilitylib';
import path from 'path';
import { readStructured } from '#utilities/file';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
export class GenesisWalletBlock extends Block {
	constructor(data, config) {
		super(config);
	}
	static async create(data, config) {
		const block = new GenesisWalletBlock(data, config);
		await block.initialize(data, config);
		return block;
	}
	async setDefaults() {
		await super.setDefaults();
		await this.setCore({
			name: 'genesisWallet',
			description: 'WALLET-GENESIS-BLOCK',
			motto: 'FORTUNE FAVORS THE BRAVE',
			data: [
				'NO PRICE IS TOO HIGH TO PAY FOR THE PRIVILEGE OF OWNING YOURSELF',
				'THE WORLD RUNS ON INDIVIDUALS PURSUING THEIR SEPARATE INTERESTS',
				'A SPARROW IN THE HAND IS BETTER THAN A PIGEON ON THE ROOF',
			],
			allocation: {
				receiver: 0,
				amount: 5000000,
			},
		});
	}
	nonceSize = nonceSizes.genesis;
	hashSize = hashSizes.genesis;
	hashXOFConfig = {
		outputEncoding: 'buffer',
		outputLength: hashSizes.genesis,
	};
	typeName = typeNames.genesisWallet;
	async getDirectory() {
		return '/';
	}
	async getPath() {
		return `/${genericFilenames.genesisWallet}`;
	}
	async getFile() {
		return `/${genericFilenames.genesisWallet}`;
	}
	async getURL() {
		return '/';
	}
	async getFileURL() {
		return `/${genericFilenames.genesisWallet}`;
	}
}
export default GenesisWalletBlock;
// const exampleBlock = await GenesisWalletBlock.create({});
// await exampleBlock.finalize();
// await exampleBlock.setHashXOF();
// console.log('Genesis Block', exampleBlock.block);
// console.log(exampleBlock.filesystem);
// console.log('Genesis Block Hash', exampleBlock.block.hash.length);
// console.log('Genesis Block Binary Export', (await exampleBlock.exportBinary()).length);
// console.log(await exampleBlock.getPath());
// console.log(exampleBlock.getDirectory());
// console.log('Block Type', exampleBlock.blockType);
