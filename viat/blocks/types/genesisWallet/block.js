import { assignToClass, merge } from '@universalweb/utilitylib';
import { Block } from '#viat/blocks/block';
import blockDefaults from '#viat/blocks/defaults';
// Root Genesis Block
//  BETA
import { blockMethods } from './uri.js';
import { readStructured } from '#utilities/file';
import receiptBlock from '#viat/blocks/types/transactions/receipt/block';
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
	async config(data) {
		await super.config(data);
		await this.setCore(data.data.core);
	}
	nonceSize = 32;
	hashSize = 64;
	hashXOFConfig = {
		outputEncoding: 'buffer',
		outputLength: 64,
	};
	typeName = 'genesisWallet';
}
assignToClass(GenesisWalletBlock, blockMethods);
export async function genesisWalletBlock(data, config) {
	const block = await (new GenesisWalletBlock(data, config));
	return block;
}
export default genesisWalletBlock;
// const exampleBlock = await genesisWalletBlock({
// 	data: {
// 		core: {
// 			allocation: {
// 				receiver: Buffer.from('0000000000000000000000000000000000000000000000000000000000000000'),
// 				amount: 5000000,
// 				sender: 1,
// 			},
// 		},
// 	},
// });
// await exampleBlock.finalize();
// await exampleBlock.setHashXOF();
// console.log('Genesis Block HASH SIZE', exampleBlock.block.hash.length);
// exampleBlock.setDefaults();
// await exampleBlock.setHash();
// console.log('Block HASH/ID', exampleBlock.block);
// console.log(await exampleBlock.validateHash());
