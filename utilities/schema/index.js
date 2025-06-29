import Joi from 'joi';
import bigintType from './bigintType.js';
export const schemaValidator = Joi.extend(bigintType);
export async function validateSchema(validator, source) {
	const results = await validator.validate(source);
	return !(results.error);
}
export async function validateSchemaVerbose(validator, source) {
	const results = await validator.validate(source);
	return (results.error) ? results.error.details : results.value;
}
export default schemaValidator;
