// Transaction (hybrid-UTXO sweep-and-condense) block schema
import { bytes, schemaValidator } from '#utilities/schema/index';
import VIAT_DEFAULTS from '#viat/defaults';
const { MAX_TRANSACTION_INPUTS } = VIAT_DEFAULTS;
/* A consumed prior receipt: its block hash + the amount it carried. */
const inputEntrySchema = schemaValidator.object({
	hash: bytes().required(),
	amount: schemaValidator.bigint().required(),
});
/* An emitted output: recipient address + amount (the last entry is the condensed change back to sender). */
const outputEntrySchema = schemaValidator.object({
	receiver: bytes().required(),
	amount: schemaValidator.bigint().required(),
});
/*
	Per-type schema validates the WHOLE block object (this.get()). `data` and the top level are
	.unknown(true) so the base blockSchema owns meta / hash / preHash / signature; only `core` is
	strict. Conservation (inputTotal === total + mana, etc.) is enforced separately in
	TransactionBlock.verifyConservation — a schema can't express cross-field arithmetic.
*/
export const transactionBlockSchema = schemaValidator.object({
	data: schemaValidator.object({
		core: schemaValidator.object({
			sender: bytes().required(),
			sequence: schemaValidator.bigint().required(),
			parent: bytes().required(),
			input: schemaValidator.array()
				.items(inputEntrySchema)
				.min(1)
				.max(MAX_TRANSACTION_INPUTS)
				.required(),
			inputTotal: schemaValidator.bigint().required(),
			output: schemaValidator.array()
				.items(outputEntrySchema)
				.min(1)
				.required(),
			total: schemaValidator.bigint().required(),
			mana: schemaValidator.bigint().required(),
			script: bytes(),
		}).required(),
	}).unknown(true).required(),
}).unknown(true).required();
export default transactionBlockSchema;
