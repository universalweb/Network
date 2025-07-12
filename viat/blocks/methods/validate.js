import { validateSchema, validateSchemaVerbose } from '#utilities/schema/index';
import { blockSchema } from '../schema.js';
const methods = {
	async validate() {
		const validateGeneric = await validateSchema(blockSchema, this.block);
		if (!validateGeneric) {
			return false;
		}
		if (this.blockSchema) {
			const result = await validateSchema(this.blockSchema, this.block);
			return result;
		}
		return true;
	},
	async validateVerbose() {
		const validateGeneric = await validateSchemaVerbose(blockSchema, this.block);
		if (!validateGeneric) {
			return false;
		}
		if (this.blockSchema) {
			const result = await validateSchemaVerbose(this.blockSchema, this.block);
			return result;
		}
	},
};
export default methods;
