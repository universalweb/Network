import { OBJECT_TYPE, SECRET_KEY_SIZES } from './defaults.js';
import { encode, normalize } from './utils.js';
import { assign } from '@universalweb/utilitylib';
/*
	NOTE: The size of the key and nonce for the KMAC is 64 bytes MIN by default for PQ Era.
*/
export async function createKey(source, size = SECRET_KEY_SIZES.key_64_bytes) {
	const result = await normalize(source, size);
	console.log('Key Created', result);
	return result;
}
export async function createNonce(source, size = SECRET_KEY_SIZES.key_64_bytes) {
	const result = await encode(source);
	console.log('Nonce Created', result);
	return result;
}
async function example() {
	console.log(await (createKey({})));
	console.log(await (createNonce({})));
}
// await example();
