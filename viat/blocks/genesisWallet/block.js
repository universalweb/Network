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
	async config(data, config) {
		await this.setCore({
			name: 'genesisWallet',
			description: 'WALLET-GENESIS-BLOCK',
			motto: 'FORTUNE FAVORS THE BRAVE',
			data: [
				'A SPARROW IN THE HAND IS BETTER THAN A PIGEON ON THE ROOF',
				'NO PRICE IS TOO HIGH TO PAY FOR THE PRIVILEGE OF OWNING YOURSELF',
				'THE WORLD RUNS ON INDIVIDUALS PURSUING THEIR SEPARATE INTERESTS',
			],
		});
	}
	nonceSize = 32;
	hashSize = 128;
	typeName = 'genesis';
}
assignToClass(GenesisBlock, blockMethods);
export async function genesisBlock(data, config) {
	const block = await (new GenesisBlock(data, config));
	return block;
}
export default genesisBlock;
const exampleBlock = await genesisBlock({});
await exampleBlock.finalize();
await exampleBlock.setHash();
console.log('Genesis Block', exampleBlock.block);
console.log('Genesis Block HASH SIZE', exampleBlock.block.hash.length);
// exampleBlock.setDefaults();
// await exampleBlock.setHash();
// console.log('Block HASH/ID', exampleBlock.block);
// console.log(await exampleBlock.validateHash());
