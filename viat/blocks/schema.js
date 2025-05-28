// Basic Block Schema
import { schemaValidator, validateSchema } from '#utilities/schema/index';
import viatCipherSuite from '#crypto/cipherSuite/viat.js';
export const transactionBlockSchema = schemaValidator.object({
	data: schemaValidator.object({
		amount: schemaValidator.bigint().required(),
		receiver: schemaValidator.binary().required(),
		sender: schemaValidator.binary().required(),
		mana: schemaValidator.bigint().required(),
		sequence: schemaValidator.bigint().required()
	}).required()
}).required();
export async function validateTransactionBlock(data) {
	return validateSchema(transactionBlockSchema, data);
}
export default transactionBlockSchema;
// console.log('transactionBlockSchema', transactionBlockSchema);
// console.log(await validateTransactionBlock({
// 	data: {
// 		amount: 1000n,
// 		receiver: viatCipherSuite.createBlockNonce(64),
// 		sender: viatCipherSuite.createBlockNonce(64),
// 		mana: 1000n,
// 		sequence: 0n
// 	}
// }));
// console.log(schemaValidator);
