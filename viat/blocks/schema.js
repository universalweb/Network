import { bytes, schemaValidator } from '#utilities/schema/index';
/* A state anchor: numeric STATE_ID (ordering / staleness / precompute) + 32-byte hash (binds to the real state; null until known). */
const stateAnchorSchema = schemaValidator.object({
	id: schemaValidator.bigint().required(),
	hash: bytes().allow(null),
});
export const blockSchema = schemaValidator.object({
	data: schemaValidator.object({
		meta: schemaValidator.object({
			/* timestamp + nonce are required for signed blocks (enforced in validate()), omitted by deterministic blocks. */
			timestamp: schemaValidator.number()
				.integer()
				.min(0),
			nonce: bytes(),
			version: schemaValidator.number().integer().required(),
			blockType: schemaValidator.number().integer().required(),
			format: schemaValidator.string(),
			networkId: schemaValidator.number().integer(),
			priorState: stateAnchorSchema,
			futureState: stateAnchorSchema,
		}).required(),
		/* Core shape is type-specific — per-type blockSchema validates its contents. */
		core: schemaValidator.object().required(),
	}).required(),
	hash: bytes().required(),
	preHash: bytes(),
	signature: bytes(),
}).required();
export default blockSchema;
