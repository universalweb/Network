import Joi from 'joi';
import bigintType from './bigintType.js';
export const schemaValidator = Joi.extend(bigintType);
function bytesCheck(value, helpers) {
	if (value instanceof Uint8Array) {
		return value;
	}
	return helpers.error('any.invalid');
}
/*
	Byte fields may arrive as a Node Buffer OR a Uint8Array: cborg encodeStrict yields Uint8Array,
	hash functions yield Buffer, cbor-x decode yields either. Buffer extends Uint8Array, so a single
	instanceof check accepts both — and it stays browser-pure (no Buffer reference). Use in place of
	Joi .binary() for any block byte field.
*/
export function bytes() {
	return schemaValidator.any().custom(bytesCheck);
}
export async function validateSchema(validator, source) {
	const results = await validator.validate(source);
	return !(results.error);
}
export async function validateSchemaVerbose(validator, source) {
	const results = await validator.validate(source);
	return (results.error) ? results.error.details : results.value;
}
export default schemaValidator;
