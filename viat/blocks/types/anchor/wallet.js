import { Block } from '#viat/blocks/block';
import { typeNames } from '#viat/blocks/defaults';
export class AnchorBlock extends Block {
	constructor(data, config) {
		super(config);
	}
	static async create(data, config) {
		const block = new AnchorBlock(data, config);
		await block.initialize(data, config);
		return block;
	}
	async config(address, config) {
		await this.setCore('address', address);
		await this.hash();
		return this;
	}
	typeName = typeNames.walletAnchor;
}
export default AnchorBlock;
