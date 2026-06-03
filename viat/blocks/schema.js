import { schemaValidator } from '#utilities/schema/index';
/* A state anchor: numeric STATE_ID (ordering / staleness / precompute) + 32-byte hash (binds to the real state; null until known). */
const stateAnchorSchema = schemaValidator.object({
	id: schemaValidator.bigint().required(),
	hash: schemaValidator.binary().allow(null),
});
export const blockSchema = schemaValidator.object({
	data: schemaValidator.object({
		meta: schemaValidator.object({
			/* timestamp + nonce are required for signed blocks (enforced in validate()), omitted by deterministic blocks. */
			timestamp: schemaValidator.number()
				.integer()
				.min(0),
			nonce: schemaValidator.binary(),
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
	hash: schemaValidator.binary().required(),
	preHash: schemaValidator.binary(),
	signature: schemaValidator.binary(),
}).required();
export default blockSchema;
