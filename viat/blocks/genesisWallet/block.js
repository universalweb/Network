import { Block } from '../block.js';
import { assignToClass } from '@universalweb/acid';
import blockDefaults from '../defaults.js';
// Root Genesis Block
//  BETA
import { blockMethods } from './uri.js';
import { readStructured } from '#utilities/file';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
export class WalletGenesisBlock extends Block {
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
				'NO PRICE IS TOO HIGH TO PAY FOR THE PRIVILEGE OF OWNING YOURSELF',
				'THE WORLD RUNS ON INDIVIDUALS PURSUING THEIR SEPARATE INTERESTS',
				'A SPARROW IN THE HAND IS BETTER THAN A PIGEON ON THE ROOF',
			],
		});
	}
	nonceSize = 32;
	hashSize = 128;
	typeName = 'genesis';
}
assignToClass(WalletGenesisBlock, blockMethods);
export async function walletGenesisBlock(data, config) {
	const block = await (new WalletGenesisBlock(data, config));
	return block;
}
export default walletGenesisBlock;
// const exampleBlock = await walletGenesisBlock({});
// await exampleBlock.finalize();
// await exampleBlock.setHash();
// console.log('Genesis Block', exampleBlock.block);
// console.log('Genesis Block HASH SIZE', exampleBlock.block.hash.length);
// exampleBlock.setDefaults();
// await exampleBlock.setHash();
// console.log('Block HASH/ID', exampleBlock.block);
// console.log(await exampleBlock.validateHash());
