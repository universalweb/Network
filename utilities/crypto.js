// Cryptography utilities
// @module utilities/crypto
// default hash Blake3
const sodium = await import('sodium-native');
const sodiumLib = sodium?.default || sodium;
const { randombytes_buf } = sodiumLib;
import { clear, isBuffer } from '@universalweb/acid';
import { blake3 } from '@noble/hashes/blake3';
export const defaultHashFunction = blake3;
export const int32 = 32;
export const int64 = 64;
export function toBuffer(source) {
	return Buffer.from(source);
}
export function toBase64(source) {
	return source.toString('base64');
}
export function toHex(source) {
	return source.toString('hex');
}
export function buff(source) {
	return Buffer.from(source);
}
export function bufferAlloc(size) {
	return Buffer.alloc(size);
}
export function randomize(source) {
	randombytes_buf(source);
	return source;
}
export function randomBuffer(size = 8) {
	const target = bufferAlloc(size);
	randomize(target);
	return target;
}
export function createSeed(size = 32) {
	const seed = randomBuffer(size);
	return seed;
}
export function random32ByteBuffer() {
	const target = bufferAlloc(int32);
	randomize(target);
	return target;
}
export function random64ByteBuffer() {
	const target = bufferAlloc(int64);
	randomize(target);
	return target;
}
export function clearBuffer(source) {
	source.fill(0);
}
export function clearBuffers(...sources) {
	sources.forEach((clearBuffer));
}
export function clearSessionKeys(source) {
	clearBuffer(source.transmitKey);
	clearBuffer(source.receiveKey);
	source.transmitKey = null;
	source.receiveKey = null;
}
export function combineKeys(...sources) {
	// console.log('Combine', key1, key2);
	const combinedKeys = defaultHashFunction(Buffer.concat(sources));
	return combinedKeys;
}
export function combineSessionKeys(oldTransmitKey, oldReceiveKey, source) {
	console.log('combineSessionKeys', source.transmitKey, oldTransmitKey, source.receiveKey, oldReceiveKey);
	if (oldTransmitKey) {
		source.transmitKey = combineKeys(oldTransmitKey, source.transmitKey);
	}
	if (oldReceiveKey) {
		source.receiveKey = combineKeys(oldReceiveKey, source.receiveKey);
	}
}
export function combineKeysFreeMemory(...sources) {
	// console.log('Combine', key1, key2);
	const combinedKeys = defaultHashFunction(Buffer.concat(sources));
	clearBuffers(...sources);
	return combinedKeys;
}
export function combineSessionKeysFreeMemory(source, oldTransmitKey, oldReceiveKey) {
	console.log('combineSessionKeys', source.transmitKey, oldTransmitKey, source.receiveKey, oldReceiveKey);
	if (oldTransmitKey) {
		source.transmitKey = combineKeysFreeMemory(oldTransmitKey, source.transmitKey);
	}
	if (oldReceiveKey) {
		source.receiveKey = combineKeysFreeMemory(oldReceiveKey, source.receiveKey);
	}
}
export { randombytes_buf };
