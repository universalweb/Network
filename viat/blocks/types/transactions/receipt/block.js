// Receipt block — deterministic UTXO record projected from one transaction output.
import { Block } from '#viat/blocks/block';
import { receiptBlockSchema } from './schema.js';
import { typeNames } from '#viat/blocks/defaults';
// TODO: Add interactive transaction - hashlock, timelock, multisig
export class ReceiptBlock extends Block {
	constructor(data, config) {
		super(config);
	}
	static async create(data, config) {
		const block = new ReceiptBlock(data, config);
		await block.initialize(data, config);
		return block;
	}
	/*
		Build this receipt from a transaction's output[outputIndex]. The tx must be signed first —
		`transaction` is the tx hash (H(preHash ‖ signature)), which does not exist until sign().
		Deterministic: copies only the tx timestamp (reproducible, enables newest→oldest ordering); no
		nonce (deterministic blocks carry none). Uniqueness comes from (transaction, outputIndex).
	*/
	async configByTransactionBlock(transactionBlock, config) {
		const coreData = await transactionBlock.getCore();
		const metaData = await transactionBlock.getMeta();
		const outputIndex = (config && config.outputIndex) || 0;
		const output = coreData.output && coreData.output[outputIndex];
		if (!output) {
			return this;
		}
		await this.setDefaults();
		await this.setMeta({
			timestamp: metaData.timestamp,
		});
		await this.setCore({
			sender: coreData.sender,
			transaction: await transactionBlock.getHash(),
			outputIndex,
			receiver: output.receiver,
			amount: output.amount,
		});
		return this;
	}
	/* Restore the value amount to bigint after a decode (super handles base ids + timestamp). outputIndex is a structural index — stays number. */
	normalizeValues() {
		super.normalizeValues();
		const core = this.getCore();
		if (core && typeof core.amount === 'number' && Number.isInteger(core.amount)) {
			core.amount = BigInt(core.amount);
		}
		return this;
	}
	async getTransactionDirectory() {
		const txPath = this.filesystemConfig.getTransactionDirectory(await this.getCore('transaction'), await this.getCore('sender'));
		return txPath;
	}
	async getTransactionPath() {
		const txPath = this.filesystemConfig.getTransactionBlock(await this.getCore('transaction'), await this.getCore('sender'));
		return txPath;
	}
	blockSchema = receiptBlockSchema;
	typeName = typeNames.receipt;
}
export default ReceiptBlock;
