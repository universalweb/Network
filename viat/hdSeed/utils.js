import { isPlainObject, noValue } from '@universalweb/utilitylib';
import { kmac256, kmac256xof } from '@noble/hashes/sha3-addons.js';
import { shake256, shake256_64 } from '@noble/hashes/sha3.js';
import { SEED_SIZES } from './defaults/index.js';
import { encodeStrict } from '#utilities/serialize';
export function encode(source) {
	return encodeStrict(source);
}
export function getSeedSize(schemeID) {
	return SEED_SIZES[schemeID] || 32;
}
export async function kmac(key, message, dkLen = 32, personalization) {
	return kmac256xof(key, message, {
		personalization,
		dkLen,
	});
}
export async function kmacStrict(key, message, dkLen = 32, personalization) {
	return kmac256(key, message, {
		personalization,
		dkLen,
	});
}
export async function hash(message, dkLen = 32) {
	return shake256(message, {
		dkLen,
	});
}
export async function hash64(message) {
	return shake256_64(message);
}
export async function normalize(source, size = 256) {
	return hash((isPlainObject(source)) ? await encode(source) : source, size);
}
async function example() {
	console.log(await (hash(Buffer.from('Hello'), 24)));
}
export function validateObject(source, errors = []) {
	const requiredProperties = [
		'version',
		'kind',
		'context',
		'network',
		'relationship',
		'id',
		'scheme',
	];
	requiredProperties.forEach((item) => {
		if (noValue(source[item])) {
			errors.push(`Missing required property: ${item}`);
		}
	});
	return (errors?.length && errors) || true;
}
export default {
	encode,
	getSeedSize,
	validateObject,
};
