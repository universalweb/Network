import { schemaValidator } from '#utilities/schema/index';
export const blockSchema = schemaValidator.object({
	data: schemaValidator.object({
		meta: schemaValidator.object({
			timestamp: schemaValidator.number()
				.integer()
				.min(0)
				.required(),
			nonce: schemaValidator.binary().required(),
			version: schemaValidator.number().integer().required(),
			blockType: schemaValidator.number().integer().required()
		}).required(),
		core: schemaValidator.object({}).required(),
	}).required(),
	hash: schemaValidator.binary().required(),
	signature: schemaValidator.binary(),
}).required();
export default blockSchema;
