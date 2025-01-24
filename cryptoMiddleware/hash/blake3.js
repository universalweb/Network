import {
	clearBuffer,
	clearBuffers,
	hash512Settings,
	int32,
	int64
} from '#crypto';
import { blake3 as hash } from '@noble/hashes/blake3';
const concatBuffer = Buffer.concat;
export async function hash256(source) {
	return hash(source);
}
export async function hash512(source) {
	return hash(source, hash512Settings);
}
export async function concatHash(...sources) {
	return hash(concatBuffer(sources));
}
export async function concatHash512(...sources) {
	return hash(concatBuffer(sources), hash512Settings);
}
export async function expandIntoSessionKeysBlake3(sharedSecret, target) {
	const expandedSecret = await hash512(sharedSecret);
	const transmitKey = expandedSecret.subarray(int32);
	const receiveKey = expandedSecret.subarray(0, int32);
	if (target) {
		target.sharedSecret = expandedSecret;
		target.transmitKey = transmitKey;
		target.receiveKey = receiveKey;
		return target;
	}
	return {
		sharedSecret: expandedSecret,
		transmitKey,
		receiveKey
	};
}
export async function combineKeys(...sources) {
	// console.log('Combine', key1, key2);
	const combinedKeys = await concatHash(...sources);
	return combinedKeys;
}
export async function combineSessionKeys(oldTransmitKey, oldReceiveKey, source) {
	console.log('combineSessionKeys', source.transmitKey, oldTransmitKey, source.receiveKey, oldReceiveKey);
	if (oldTransmitKey) {
		source.transmitKey = await combineKeys(oldTransmitKey, source.transmitKey);
	}
	if (oldReceiveKey) {
		source.receiveKey = await combineKeys(oldReceiveKey, source.receiveKey);
	}
}
export async function combineKeysFreeMemory(...sources) {
	// console.log('Combine', key1, key2);
	const combinedKeys = await concatHash(...sources);
	clearBuffers(...sources);
	return combinedKeys;
}
export async function combineSessionKeysFreeMemory(source, oldTransmitKey, oldReceiveKey) {
	console.log('combineSessionKeys', source.transmitKey, oldTransmitKey, source.receiveKey, oldReceiveKey);
	if (oldTransmitKey) {
		source.transmitKey = await combineKeysFreeMemory(oldTransmitKey, source.transmitKey);
	}
	if (oldReceiveKey) {
		source.receiveKey = await combineKeysFreeMemory(oldReceiveKey, source.receiveKey);
	}
}
export const blake3 = {
	name: 'blake3',
	alias: 'fast',
	id: 1,
	hash: hash256,
	hash512,
	combineSessionKeysFreeMemory,
	combineKeysFreeMemory,
	combineSessionKeys,
	combineKeys,
	security: 0,
	preferred: false
};
export default blake3;
