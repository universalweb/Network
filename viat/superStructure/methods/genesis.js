import { genesisBlock } from '../../blocks/genesis/block.js';
import { genesisWalletBlock } from '#viat/blocks/genesisWallet/block';
import { loadBlock } from '#viat/blocks/utils';
const methods = {
	async createGenesisBlock(data) {
		const source = await genesisBlock(data);
		await source.finalize();
		await source.setHashXOF();
		await this.saveBlock(source);
		this.genesisBlock = source;
		return source;
	},
	async getGenesisBlock() {
		if (!this.genesisBlock) {
			await this.setGenesisBlock();
		}
		return this.genesisBlock;
	},
	async setGenesisBlock() {
		const blockPath = await this.getFullPath('genesis.block');
		// console.log('setGenesisBlock', blockPath);
		const source = await loadBlock(blockPath);
		this.genesisBlock = source;
		return this;
	},
	async getGenesisWalletBlock() {
		if (!this.genesisWalletBlock) {
			await this.setGenesisWalletBlock();
		}
		return this.genesisWalletBlock;
	},
	async setGenesisWalletBlock() {
		const blockPath = await this.getFullPath('genesisWallet.block');
		const source = await loadBlock(blockPath);
		this.genesisWalletBlock = source;
		return source;
	},
	async createGenesisWalletBlock(data) {
		const source = await genesisWalletBlock(data);
		const genesis = await this.getGenesisBlock();
		await source.setParent(await genesis.hashBlock());
		await source.finalize();
		await source.setHashXOF();
		// console.log(source.block.data);
		await this.saveBlock(source);
		this.genesisWalletBlock = source;
		return source;
	},
};
export default methods;
