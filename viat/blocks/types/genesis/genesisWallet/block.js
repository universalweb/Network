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
		return this.initialize(data, config);
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
}
export async function genesisWalletBlock(data, config) {
	const block = await (new GenesisWalletBlock(data, config));
	return block;
}
export default genesisWalletBlock;
// const exampleBlock = await genesisWalletBlock({});
// await exampleBlock.finalize();
// await exampleBlock.setHashXOF();
// console.log('Genesis Block', exampleBlock.block);
// console.log('Genesis Block Hash', exampleBlock.block.hash.length);
// console.log('Genesis Block Binary Export', (await exampleBlock.exportBinary()).length);
// console.log(exampleBlock.getPath());
// console.log(exampleBlock.getDirectory());
// console.log('Block Type', exampleBlock.blockType);
