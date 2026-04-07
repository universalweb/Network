import {
	CONTEXT_INTENTION,
	CRYPTOCURRENCY_NETWORK_TYPES,
	HASH_ALGORITHMS,
	NETWORK_NAMES,
	PROPERTY_LOOKUP,
	PURPOSE,
	RELATIONSHIP,
	SCHEME_TYPES,
} from '../defaults/index.js';
import {
	hasValue,
	isBuffer,
	isPlainObject,
	isU8,
	noValue,
} from '@universalweb/utilitylib';
async function logInfo() {
	console.log('logInfo START __________________');
	const exported = await this.exportObject();
	exported.forEach((value, key) => {
		if (isBuffer(value) || isU8(value)) {
			console.log(`${key}: <Buffer:${value.length} bytes>`);
		} else {
			console.log(`${key}: ${value}`);
		}
	});
	console.log('Binary export size', (await this.exportBinary()).length);
	console.log('logInfo END __________________');
}
/**
	* Converts integer property values on a seed or key object to their text representation.
	* @param {Object} source - The plain object (seed or key) to describe.
	* @param {boolean} [logOutput=true] - Whether to log the output to console.
	* @returns {Object} An object with the same keys but with text values where applicable.
 */
function describeObject(source, logOutput = true) {
	if (!isPlainObject(source)) {
		console.error('describeObject requires a plain object');
		return null;
	}
	const described = {};
	const thisContext = this;
	// console.log(source);
	for (const [
		key,
		value,
	] of Object.entries(source)) {
		const lookup = PROPERTY_LOOKUP[key];
		if (lookup && hasValue(value)) {
			// console.log(lookup, value);
			described[key] = lookup.get(value) ?? `UNKNOWN(${value})`;
		} else if (isBuffer(value) || isU8(value)) {
			described[key] = `<Buffer:${value.length} bytes>`;
		} else if (isPlainObject(value)) {
			described[key] = describeObject(value, false);
		} else {
			described[key] = value;
		}
	}
	if (logOutput) {
		console.log('__________OBJECT STRUCT START__________');
		console.log('==> TYPE:', (source.key) ? 'KEY' : 'SEED', '<==');
		for (const [
			key,
			value,
		] of Object.entries(described)) {
			if (isPlainObject(value)) {
				console.log(`  ${key}:`, value);
			} else {
				console.log(`  ${key}: ${value}`);
			}
		}
		console.log('__________OBJECT STRUCT END__________');
	}
	return described;
}
/**
 * Static method to get the text name for a specific property type and value.
 * @param {string} propertyName - The property name (e.g., 'scheme', 'kind', 'network').
 * @param {number} value - The integer value to look up.
 * @returns {string|null} The text representation or null if not found.
 */
function getPropertyName(propertyName, value) {
	const lookup = PROPERTY_LOOKUP[propertyName];
	if (!lookup) {
		return null;
	}
	return lookup[value] ?? null;
}
export async function validateSeedObject(source, errors = []) {
	const requiredProperties = ['seed'];
	requiredProperties.forEach((item) => {
		if (noValue(source[item])) {
			errors.push(`Missing required property: ${item}`);
		}
	});
	await this.validateObject(source, errors);
	return (errors.length && errors) || true;
}
export default {
	logInfo,
	describeObject,
	getPropertyName,
	validateSeedObject,
};
