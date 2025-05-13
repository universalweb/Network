import { Block } from './block.js';
import { blockDefaults } from './defaults.js';
// TX Core & Data hash part of the block
// Means receipt can be made independently of the block
// Then include the block's hash as part of the TX Block Hashlink
// Both are signed meaning they are all linked and contents can be trusted even based on the hash link alone
// Hash link as the ID of this block
// Block Hash (TX DATA || Receipt NONCE || Receipt Meta?)
export class ReceiptBlock extends Block {
	constructor(config = {}) {
		super(config);
		return this;
	}
	blockType = blockDefaults.blockTypes.receiptBlockType;
}
export async function receiptBlock(config) {
	const block = new ReceiptBlock(config);
	return block;
}
export default receiptBlock;
const exampleBlock = receiptBlock({
	data: {
		core: {
			amount: 1000,
			// Need only sender to find original TX block then uses the sender block to get the address wallet destination where to store the receipt block
			sender: '0xabcdef1234567890abcdef1234567890abcdef12',
			previousBlockHash: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
		},
	}
});
