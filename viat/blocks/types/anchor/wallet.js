import { Block } from '#viat/blocks/block';
import { typeNames } from '#viat/blocks/defaults';
export class AnchorBlock extends Block {
	constructor(data, config) {
		super(config);
		return this.initialize(data, config);
	}
	async config(address, config) {
		await this.setCore('address', address);
		await this.hash();
		return this;
	}
	typeName = typeNames.walletAnchor;
}
export async function anchorBlock(...args) {
	const block = await (new AnchorBlock(...args));
	return block;
}
