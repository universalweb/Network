// Receipt block schema — one transaction output projected as a deterministic UTXO record
import { bytes, schemaValidator } from '#utilities/schema/index';
/*
	A receipt is the deterministic projection of (transaction, outputIndex): the spendable record for
	one tx output. Its hash IS the UTXO id a later transaction references in input[].hash.
	(transaction, outputIndex) is the txHash:vout identity — outputIndex is load-bearing: two outputs
	to the same receiver for the same amount in one tx differ ONLY by it, so it must stay in core or
	their hashes collide. data + top are .unknown(true) so the base schema owns meta / hash; core strict.
*/
export const receiptBlockSchema = schemaValidator.object({
	data: schemaValidator.object({
		core: schemaValidator.object({
			sender: bytes().required(),
			transaction: bytes().required(),
			outputIndex: schemaValidator.number().integer().min(0).required(),
			receiver: bytes().required(),
			amount: schemaValidator.bigint().required(),
		}).required(),
	}).unknown(true).required(),
}).unknown(true).required();
export default receiptBlockSchema;
