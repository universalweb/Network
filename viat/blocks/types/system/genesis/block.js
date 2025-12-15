// Root Genesis Block
import {
	filePaths, genericFilenames, hashSizes, nonceSizes, typeNames,
} from '#viat/blocks/defaults';
import { Block } from '#viat/blocks/block';
import { assignToClass } from '@universalweb/utilitylib';
import path from 'path';
import { readStructured } from '#utilities/file';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
// import { blockMethods } from './uri.js';
export class GenesisBlock extends Block {
	constructor(data, config) {
		super(config);
		return this.initialize(data, config);
	}
	async setDefaults() {
		await super.setDefaults();
		await this.setCore({
			name: 'genesis',
			description: 'GENESIS-BLOCK',
			motto: 'LET THERE BE LIGHT',
			data: [
				`IF YOU DON'T BELIEVE ME OR DON'T GET IT, I DON'T HAVE TIME TO TRY TO CONVINCE YOU`,
				'CIVILIZATION IS THE PROGRESS TOWARD A SOCIETY OF PRIVACY',
				'LIBERTY MAY BE ENDANGERED BY THE ABUSES OF LIBERTY AS WELL AS BY THE ABUSES OF POWER',
			],
		});
	}
	getPath() {
		return path.join(filePaths.genesis, genericFilenames.genesis);
	}
	getDirectory() {
		return filePaths.genesis;
	}
	getDirectoryURL() {
		return filePaths.genesis;
	}
	getURL() {
		return path.join(filePaths.genesis, genericFilenames.genesis);
	}
	nonceSize = nonceSizes.genesis;
	hashSize = hashSizes.genesis;
	hashXOFConfig = {
		outputEncoding: 'buffer',
		outputLength: hashSizes.genesis,
	};
	typeName = typeNames.genesis;
}
export async function genesisBlock(data, config) {
	const block = await (new GenesisBlock(data, config));
	return block;
}
export default genesisBlock;
// const exampleBlock = await genesisBlock({});
// await exampleBlock.finalize();
// await exampleBlock.setHashXOF();
// console.log('Genesis Block Hash', exampleBlock.block.hash.length);
// console.log('Genesis Block', exampleBlock.block);
// console.log('Genesis Block Binary Export', (await exampleBlock.exportBinary()).length);
// console.log(exampleBlock.getPath());
// console.log(exampleBlock.getDirectory());
// console.log('Block Type', exampleBlock.blockType);
// exampleBlock.setDefaults();
// await exampleBlock.setHash();
// console.log('Block HASH/ID', exampleBlock.block);
// console.log(await exampleBlock.validateHash());
