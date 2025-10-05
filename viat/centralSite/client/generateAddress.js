import { decode, encodeSync } from './cbor.js';
import { shake256 } from '@noble/hashes/sha3.js';
const hashConfig = {
	dkLen: 20,
};
export function generateAddress(publicKey, type = 0, version = 0) {
	const domained = encodeSync({
		type,
		version,
		publicKey,
	});
	return shake256(domained, hashConfig);
}

