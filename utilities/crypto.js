const sodium = await import('sodium-native');
const sodiumLib = sodium?.default || sodium;
const {
	crypto_generichash,
	crypto_generichash_BYTES,
	crypto_generichash_BYTES_MIN,
	crypto_pwhash_MEMLIMIT_MIN,
	crypto_pwhash_OPSLIMIT_MIN,
	crypto_pwhash_str,
	crypto_pwhash_str_verify,
	crypto_pwhash_STRBYTES,
	crypto_shorthash,
	crypto_shorthash_BYTES,
	crypto_shorthash_KEYBYTES,
	randombytes_buf
} = sodiumLib;
import { clear, isBuffer } from '@universalweb/acid';
import { blake3 } from '@noble/hashes/blake3';
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
const int32 = 32;
export function random32ByteBuffer() {
	const target = bufferAlloc(int32);
	randomize(target);
	return target;
}
const int64 = 64;
export function random64ByteBuffer() {
	const target = bufferAlloc(int64);
	randomize(target);
	return target;
}
export function randomConnectionId(size = 8) {
	return randomBuffer(size);
}
export function passwordHash(password) {
	const out = bufferAlloc(crypto_pwhash_STRBYTES);
	crypto_pwhash_str(out, isBuffer(password) ? password : Buffer.from(password), crypto_pwhash_OPSLIMIT_MIN, crypto_pwhash_MEMLIMIT_MIN);
	return out;
}
export function passwordHashVerify(source, password) {
	return crypto_pwhash_str_verify(source, isBuffer(password) ? password : Buffer.from(password));
}
export function hash(message, amount) {
	const hashed = bufferAlloc(amount || crypto_generichash_BYTES);
	crypto_generichash(hashed, message);
	return hashed;
}
export function hashMin(message) {
	const hashed = bufferAlloc(crypto_generichash_BYTES_MIN);
	crypto_generichash(hashed, message);
	return hashed;
}
export function hashShort(message) {
	const hashed = bufferAlloc(crypto_shorthash_BYTES);
	crypto_shorthash(hashed, message, bufferAlloc(crypto_shorthash_KEYBYTES));
	return hashed;
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
	const combinedKeys = blake3(Buffer.concat(sources));
	return combinedKeys;
}
export function combineSessionKeys(source, oldTransmitKey, oldReceiveKey) {
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
	const combinedKeys = blake3(Buffer.concat(sources));
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
export function getX25519Key(source) {
	return source.slice(0, 32);
}
export function get25519KeyCopy(source) {
	return Buffer.copyBytesFrom(source, 0, 32);
}
export function getKyberKey(source) {
	return source.slice(32);
}
export const hashBytes = crypto_generichash_BYTES;
export {
	crypto_generichash,
	crypto_generichash_BYTES,
	crypto_generichash_BYTES_MIN,
	crypto_pwhash_MEMLIMIT_MIN,
	crypto_pwhash_OPSLIMIT_MIN,
	crypto_pwhash_str,
	crypto_pwhash_str_verify,
	crypto_pwhash_STRBYTES,
	crypto_shorthash,
	crypto_shorthash_BYTES,
	crypto_shorthash_KEYBYTES,
	randombytes_buf,
};
