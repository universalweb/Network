import {
	CONTEXT_INTENTION,
	CRYPTOCURRENCY_NETWORK_TYPES,
	HASH_ALGORITHMS,
	NETWORK_NAMES,
	PURPOSE,
	RELATIONSHIP,
	SCHEME_TYPES,
} from '../defaults.js';
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
// Generator function to create reverse lookup maps
function createReverseLookup(obj) {
	const result = new Map();
	for (const key in obj) {
		if (Object.hasOwn(obj, key)) {
			result.set(obj[key], key);
		}
	}
	return result;
}
// Property to reverse lookup map mapping
const propertyLookups = {
	scheme: createReverseLookup(SCHEME_TYPES),
	context_intention: createReverseLookup(CONTEXT_INTENTION),
	purpose: createReverseLookup(PURPOSE),
	relationship: createReverseLookup(RELATIONSHIP),
	hash_algorithm: createReverseLookup(HASH_ALGORITHMS),
	keyed_hash_algorithm: createReverseLookup(HASH_ALGORITHMS),
	network: createReverseLookup(NETWORK_NAMES),
	cryptocurrency_network_type: createReverseLookup(CRYPTOCURRENCY_NETWORK_TYPES),
};
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
		const lookup = propertyLookups[key];
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
		console.log('OBJECT DESCRIBE START__________');
		console.log('______ TYPE:', (source.key) ? 'KEY' : 'SEED', '', '---->');
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
		console.log('------>');
		console.log('OBJECT DESCRIBE END_______________');
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
	const lookup = propertyLookups[propertyName];
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
	propertyLookups,
	validateSeedObject,
};
