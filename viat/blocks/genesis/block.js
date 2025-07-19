import { Block } from '../block.js';
import { assignToClass } from '@universalweb/acid';
import blockDefaults from '../defaults.js';
// Root Genesis Block
//  BETA
import { blockMethods } from './uri.js';
import { readStructured } from '#utilities/file';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
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
	nonceSize = 32;
	hashSize = 1024;
	hashXOFConfig = {
		outputEncoding: 'buffer',
		outputLength: 1024,
	};
	typeName = 'genesis';
}
assignToClass(GenesisBlock, blockMethods);
export async function genesisBlock(data, config) {
	const block = await (new GenesisBlock(data, config));
	return block;
}
export default genesisBlock;
// const exampleBlock = await genesisBlock({});
// await exampleBlock.finalize();
// await exampleBlock.setHashXOF();
// console.log('Genesis Block', exampleBlock);
// console.log('Genesis Block HASH SIZE', exampleBlock.block.hash.length);
// console.log('Genesis Block', (await exampleBlock.exportBinary()).length);
// exampleBlock.setDefaults();
// await exampleBlock.setHash();
// console.log('Block HASH/ID', exampleBlock.block);
// console.log(await exampleBlock.validateHash());
