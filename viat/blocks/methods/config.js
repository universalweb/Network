import blockDefaults from '../defaults.js';
import { isPlainObject } from '@universalweb/acid';
const {
	version,
	blockTypes,
} = blockDefaults;
const methods = {
	configByBlock(blockObject, config) {
		switch (blockObject.blockType) {
			case blockTypes.transaction: {
				if (this.configByTransactionBlock) {
					return this.configByTransactionBlock(blockObject, config);
				}
				break;
			}
			case blockTypes.receipt: {
				if (this.configByReceiptBlock) {
					return this.configByReceiptBlock(blockObject, config);
				}
				break;
			}
			default: {
				if (this.configByGenericBlock) {
					return this.configByGenericBlock(blockObject, config);
				}
				break;
			}
		}
	},
	async config(data, config) {
		if (isPlainObject(data)) {
			await this.setData(data);
		}
		return this;
	},
	async configByBlockAsync(blockObject, config) {
		return this.configByBlock(blockObject, config);
	},
};
export default methods;
