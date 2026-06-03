import { validateSchema, validateSchemaVerbose } from '#utilities/schema/index';
import { blockSchema } from '../schema.js';
const methods = {
	async validate() {
		const validateGeneric = await validateSchema(blockSchema, this.get());
		if (!validateGeneric) {
			return false;
		}
		if (this.isSigned && (!this.get('signature') || !this.getMeta('timestamp') || !this.getMeta('nonce'))) {
			return false;
		}
		if (this.blockSchema) {
			const result = await validateSchema(this.blockSchema, this.get());
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
