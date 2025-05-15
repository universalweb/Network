// Include a Block Link ID - uses to quickly share a transaction and then can be efficiently found by other parties.
// This is a unique ID that is generated for each transaction. It can be used to quickly find the transaction in the block chain.
// Reference block, link block, Anchor block, receipt block -> Links to received viat from another wallets send block
// TX Queue Block - This is a block that is used to queue transactions and alert validators of needed work. It can be used to quickly find none validated transactions in the block chain that aren't yet indexed.
// Use nonces to prevent replay attacks and ensure if a transaction is identical resulting in the same hash the nonce would result in a different hash mitigating this outcome. It also allows a transaction to have the same contents but the nonce shows they are different transactions still. Then a cancel request can target what otherwise could have been nearly identical transactions resulting in one being canceled over the other. This way a user can target a specific transaction with absolute certainty
// Bloom Filter for confirmed transactions updated by the sender?
// One for verifiers to check if a transaction is confirmed
// The last for confirmed transactions that have been fully audited and verified
// Use Merkle Trees with bloom filters - use merkle tree to confirm bloom filter then
import { toBase64Url, toHex } from '#crypto/utils.js';
import Block from '../block.js';
import { blockDefaults } from '../defaults.js';
import { encodeStrict } from '#utilities/serialize';
import { getTransactionURL } from './uri.js';
import { mapAsyncArray } from '@universalweb/acid';
import receiptBlock from '../receipt.js';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
class TransactionBlock extends Block {
	constructor(config = {}) {
		super(config);
		this.setCore('amount', config.amount);
		this.setCore('receiver', config.receiver);
		this.setCore('sender', config.sender);
		return this;
	}
	async getLink() {
		const blockLink = await getTransactionURL(this.get('hash'), this.getCore('sender'));
		return blockLink;
	}
	// Receipt Hash Link
	// Block Hash (TX DATA || Receipt Meta?)
	async generateReceipt(block) {
		this.receipt = receiptBlock(this);
		return this;
	}
	lookupPath() {
		return `w/t/${this.block.data.core.sender}/${this.block.data.meta.nonce}/${this.block.data.meta.nonce}/t/${this.block.data.meta.nonce}`;
	}
	blockType = blockDefaults.blockTypes.transactionBlockType;
	fileType = blockDefaults.fileExtensions.transaction;
}
export async function transactionBlock(config) {
	const block = new TransactionBlock(config);
	return block;
}
export default transactionBlock;
// Example of URL Size for transaction with 4 = 3byte folders + last 32 bytes for wallet address
// const urlSize = '/w/t/'.length + '//'.length + 4 + 4 + toBase64Url(viatCipherSuite.createBlockNonce(32)).length;
// console.log(urlSize + toBase64Url(viatCipherSuite.createBlockNonce(32)).length);
// estimate 101 bytes for path portion of TX URL
const exampleBlock = await transactionBlock({
	amount: 1000,
	receiver: viatCipherSuite.createBlockNonce(64),
	sender: viatCipherSuite.createBlockNonce(64),
});
console.log('Block HASH/ID', await exampleBlock.id());
console.log('Block HASH/ID', exampleBlock.block);
// console.log('Transaction Block', exampleBlock);
// console.log('Transaction Block ENTIRE BINARY', await exampleBlock.exportBinary());
