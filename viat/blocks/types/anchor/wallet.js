import { Block } from '#viat/blocks/block';
import { isPlainObject } from '@universalweb/utilitylib';
import { typeNames } from '#viat/blocks/defaults';
/**
 * Deterministic connection point for a wallet's chain. Lets an address receive
 * funds before its owner has created an active wallet block — the wallet block
 * is itself recomputable from the address, so the anchor binds an address to a
 * specific cryptographic chain without any signature.
 */
export class AnchorBlock extends Block {
	constructor(data, config) {
		super(config);
	}
	static async create(data, config) {
		const block = new AnchorBlock(data, config);
		await block.initialize(data, config);
		return block;
	}
	async config(data) {
		if (isPlainObject(data)) {
			/* Reconstruct from a decoded block object — preserve the stored hash. */
			this.setBlock(data);
			return this;
		}
		/* Deterministic creation from a raw address (no timestamp/nonce). */
		this.setBlockType();
		this.setCore('address', data);
		await this.setHash();
		return this;
	}
	typeName = typeNames.walletAnchor;
}
export default AnchorBlock;
