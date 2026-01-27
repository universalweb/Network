import { SECRET_KEY_SIZES } from './defaults.js';
import { normalize } from './utils.js';
export async function createKey(source, size = SECRET_KEY_SIZES.double) {
	console.log('createKey source object', source);
	if (source.length === 64) {
		return source;
	}
	return normalize(source, size);
}
export async function createNonce(source, size = SECRET_KEY_SIZES.single) {
	if (source.length === 32) {
		return source;
	}
	return normalize(source, size);
}
async function example() {
	console.log(await (createKey({})));
}
await example();
