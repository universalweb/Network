import { isArray, isBuffer } from '@universalweb/utilitylib';
import { Block } from '#viat/blocks/block';
import { ReceiptBlock } from '#blocks/transactions/receipt/block';
import { transactionBlockSchema } from './schema.js';
import { typeNames } from '#viat/blocks/defaults';
/*
	TODO: GET PRIOR TRANSACTION ID MAX & PRIOR HASH - include prior hash as parent then increment ID
	TODO: Add receipt hash to reference on receiver DAG which is then copied to the receipt block -> consider having in both for redundancy and for light clients
	NOTE: TX HASH covers some redundancy in receipt block
*/
/* Sum the amount field across input/output entries; coerces each because a decoded entry may carry a number for values < 2^64. */
function sumAmounts(items) {
	let total = 0n;
	if (!isArray(items)) {
		return total;
	}
	for (let index = 0; index < items.length; index++) {
		total += BigInt(items[index].amount);
	}
	return total;
}
/* Coerce a target[key] integer-number to bigint in place (a value < 2^64 decodes as JS number under Option B). */
function coerceBigint(target, key) {
	const value = target[key];
	if (typeof value === 'number' && Number.isInteger(value)) {
		target[key] = BigInt(value);
	}
}
/* Coerce every entry amount to bigint in place (load normalization for decoded blocks). */
function normalizeAmountList(items) {
	if (!isArray(items)) {
		return;
	}
	for (let index = 0; index < items.length; index++) {
		const entry = items[index];
		if (entry) {
			coerceBigint(entry, 'amount');
		}
	}
}
export class TransactionBlock extends Block {
	constructor(data, config) {
		super(config);
	}
	static async create(data, config) {
		const block = new TransactionBlock(data, config);
		await block.initialize(data, config);
		return block;
	}
	/*
		Under Option B serialization, value fields < 2^64 decode as JS number. Normalize them back to
		bigint ONCE at load (initialize calls this) so the strict bigint schema passes and conservation
		arithmetic never mixes number with bigint. Targeted to value fields only — structural keys
		(blockType/version/timestamp) stay number. super handles the base state-anchor ids. Keep this
		list in sync with transactionBlockSchema.
	*/
	normalizeValues() {
		super.normalizeValues();
		const core = this.getCore();
		if (!core) {
			return this;
		}
		coerceBigint(core, 'inputTotal');
		coerceBigint(core, 'total');
		coerceBigint(core, 'mana');
		coerceBigint(core, 'sequence');
		normalizeAmountList(core.input);
		normalizeAmountList(core.output);
		return this;
	}
	/*
		Internal arithmetic consistency only: declared totals match the summed arrays and no value is
		created or destroyed (inputTotal === total + mana). This does NOT check that each input amount
		equals the referenced receipt's amount — that cross-block check lives in the audit/validation
		layer and is the actual double-spend / value-creation guard.
	*/
	verifyConservation() {
		const inputTotal = this.getCore('inputTotal');
		const total = this.getCore('total');
		const mana = this.getCore('mana');
		if (inputTotal === undefined || total === undefined || mana === undefined) {
			return false;
		}
		const summedInput = sumAmounts(this.getCore('input'));
		const summedOutput = sumAmounts(this.getCore('output'));
		return inputTotal === summedInput && total === summedOutput && inputTotal === total + mana;
	}
	async validate() {
		const baseValid = await super.validate();
		if (!baseValid) {
			return false;
		}
		return this.verifyConservation();
	}
	/* Build the deterministic receipt (UTXO record) for one output; its hash is what a later tx references in input[]. */
	async createReceipt(outputIndex) {
		const receipt = await ReceiptBlock.create(this, {
			outputIndex,
		});
		await receipt.setHash();
		return receipt;
	}
	/* One receipt per output. The tx must be signed first — receipts bind the tx hash, which is H(preHash ‖ signature). */
	async createReceipts() {
		if (!this.get('hash')) {
			return;
		}
		const output = this.getCore('output') || [];
		const receipts = [];
		for (let index = 0; index < output.length; index++) {
			receipts.push(await this.createReceipt(index));
		}
		return receipts;
	}
	blockSchema = transactionBlockSchema;
	isSigned = true;
	typeName = typeNames.transaction;
}
/*
	Build, finalize and sign a sweep-and-condense transaction. Sender address must be in core BEFORE
	create() — config merges core by value, so a post-create mutation never reaches the block.
	inputTotal / total are derived from the arrays so the declared totals can never silently disagree.
*/
export async function createTransactionBlock(core, senderWallet) {
	core.sender = isBuffer(senderWallet) ? senderWallet : await senderWallet.getAddress();
	core.inputTotal = sumAmounts(core.input);
	core.total = sumAmounts(core.output);
	const tx = await TransactionBlock.create({
		data: {
			core,
		},
	});
	await tx.finalize();
	if (tx.sign) {
		await tx.sign(senderWallet);
	}
	return tx;
}
export default TransactionBlock;
