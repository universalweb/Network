// Basic Block Schema
import { schemaValidator, validateSchema } from '#utilities/schema/index';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
export const proofBlockSchema = schemaValidator.object({
	data: schemaValidator.object({
		core: schemaValidator.object({
			amount: schemaValidator.bigint().required(),
			receiver: schemaValidator.binary().required(),
			sender: schemaValidator.binary().required(),
			mana: schemaValidator.bigint().required(),
			sequence: schemaValidator.bigint().required(),
		}).required(),
	}).required(),
}).required();
export default proofBlockSchema;
