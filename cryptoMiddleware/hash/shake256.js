import { hash512Settings, int32, int64 } from '#crypto';
import { shake256 as hash } from '@noble/hashes/sha3';
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
export async function expandIntoSessionKeys(sharedSecret, target) {
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
export const shake256 = {
	name: 'shake256',
	alias: 'default',
	id: 0,
	hash: hash256,
	hash512,
	concatHash512,
	concatHash,
	expandIntoSessionKeys,
	combineKeys,
	security: 1,
	preferred: true
};
export default shake256;
