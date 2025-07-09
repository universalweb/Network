// Basic Block Schema
import { schemaValidator, validateSchema } from '#utilities/schema/index';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
export const walletBlockSchema = schemaValidator.object({
	data: schemaValidator.object({
		core: schemaValidator.object({
			address: schemaValidator.bigint().required(),
			publicKey: schemaValidator.binary().required(),
			exchangePublicKey: schemaValidator.binary().required(),
			version: schemaValidator.bigint().required(),
			created: schemaValidator.bigint().required()
		}).required(),
	}).required(),
}).required();
export default walletBlockSchema;
