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
import { isBuffer } from '@universalweb/acid';
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
