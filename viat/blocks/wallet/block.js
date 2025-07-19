// Wallet Intro Block Store Public Key and initial data
// Wallet Block (Required, stored as wallet.bin in wallets/<folder1>/<folder2>/<wallet>/)
// address
// signature Keypair
// Signature ID
// key Exchange Keypair
// key Exchange ID
// Signature Policy (Primary is Threshold based = Dilithium & ed25519 or All includes SPHINCS+)
// Backup Address
// Proxy Address
// Identity?
// role: auditor, validator, user, admin
//  Wallet Blocks are only kept if the first transaction is made. Without it there is no point to keeping the wallet block and will be discarded this counters abuse.
//  Any attempts to spam the network with random wallets will be discarded.
// A wallet block is only needed when the wallet has created a block. It's not required when sent VIAT.
import {
	blockMethods,
	getWalletFromBlock,
	getWalletPathFromBlock,
	getWalletPathURLFromBlock,
	getWalletURLFromBlock,
} from './uri.js';
import { Block } from '../block.js';
import { assignToClass } from '@universalweb/acid';
import blockDefaults from '../defaults.js';
import { readStructured } from '#utilities/file';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
import { wallet } from '#viat/index';
import { walletBlockSchema } from './schema.js';
export class WalletBlock extends Block {
	constructor(data, config) {
		super(config);
		return this.initialize(data, config);
	}
	async configByWallet(data, config) {
		const walletObject = await data.exportObject();
		await this.setCore('exchangePublicKey', walletObject.core.keyExchangeKeypair.publicKey);
		await this.setCore('publicKey', walletObject.core.signatureKeypair.publicKey);
		await this.setCore('version', walletObject.version);
		await this.setCore('created', walletObject.date);
		await this.setCore('address', await data.getAddress());
	}
	async getAddress() {
		return this.getCore('address');
	}
	blockSchema = walletBlockSchema;
	typeName = 'wallet';
}
assignToClass(WalletBlock, blockMethods);
export async function walletBlock(...args) {
	const block = await (new WalletBlock(...args));
	return block;
}
export default walletBlock;
// const amy = await wallet();
// const amyBlock = await walletBlock(amy);
// await amyBlock.finalize();
// await amyBlock.sign(amy);
// console.log(await amyBlock.getAddress());
// console.log('Wallet Block', amyBlock.block);
// const exampleBlock = await walletBlock({
// 	sender: viatCipherSuite.createBlockNonce(64),
// 	transaction: viatCipherSuite.createBlockNonce(64),
// 	receiver: viatCipherSuite.createBlockNonce(64),
// 	mana: 1000,
// 	amount: 1000,
//  Reference a prior confirmed wallet's TX hash from the receiver's address. Use path to lookup both wallets and domains.
// Only valid if hash is from a wallet within the same wallet and links to a validated transaction.
// 	priorWalletTXHash: viatCipherSuite.createBlockNonce(64)
// });
// console.log('Transaction Block', exampleBlock);
// exampleBlock.setDefaults();
// await exampleBlock.setHash();
// console.log('Block HASH/ID', exampleBlock.block);
// console.log(await exampleBlock.validateHash());
