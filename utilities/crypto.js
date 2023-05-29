const sodium = await import('sodium-native');
const sodiumLib = sodium?.default || sodium;
const {
	crypto_aead_xchacha20poly1305_ietf_ABYTES,
	crypto_aead_xchacha20poly1305_ietf_decrypt,
	crypto_aead_xchacha20poly1305_ietf_encrypt,
	crypto_aead_xchacha20poly1305_ietf_NPUBBYTES,
	crypto_generichash,
	crypto_generichash_BYTES,
	crypto_generichash_BYTES_MIN,
	crypto_kx_client_session_keys,
	crypto_kx_keypair,
	crypto_kx_PUBLICKEYBYTES,
	crypto_kx_SECRETKEYBYTES,
	crypto_kx_server_session_keys,
	crypto_kx_SESSIONKEYBYTES,
	crypto_pwhash_MEMLIMIT_MIN,
	crypto_pwhash_OPSLIMIT_MIN,
	crypto_pwhash_str,
	crypto_pwhash_str_verify,
	crypto_pwhash_STRBYTES,
	crypto_shorthash,
	crypto_shorthash_BYTES,
	crypto_shorthash_KEYBYTES,
	crypto_sign,
	crypto_sign_BYTES,
	crypto_sign_detached,
	crypto_sign_keypair,
	crypto_sign_open,
	crypto_sign_PUBLICKEYBYTES,
	crypto_sign_SECRETKEYBYTES,
	crypto_sign_verify_detached,
	randombytes_buf,
	crypto_box_seal,
	crypto_box_SEALBYTES,
	crypto_box_seal_open,
	crypto_box_keypair,
	crypto_box_PUBLICKEYBYTES,
	crypto_box_SECRETKEYBYTES,
	crypto_aead_xchacha20poly1305_ietf_keygen,
	crypto_aead_xchacha20poly1305_ietf_KEYBYTES,
	crypto_secretbox_easy,
	crypto_secretbox_MACBYTES,
	crypto_secretbox_NONCEBYTES,
	crypto_secretbox_KEYBYTES
} = sodiumLib;
import { isBuffer, assign } from 'Acid';
import { encode, decode } from 'msgpackr';
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
export function emptyNonce() {
	return bufferAlloc(crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
}
export function nonceBox(nonceBuffer) {
	const nonce = randomize(emptyNonce());
	return nonce;
}
export function createSecretKey() {
	const secretKey = bufferAlloc(crypto_aead_xchacha20poly1305_ietf_KEYBYTES);
	crypto_aead_xchacha20poly1305_ietf_keygen(secretKey);
	return secretKey;
}
export function randomConnectionId(size = 8) {
	return randomBuffer(size);
}
export function secretBoxNonce(source) {
	return randomBuffer(crypto_secretbox_NONCEBYTES);
}
export function encrypt(message, ad, nonce, secretKey) {
	const cipher = bufferAlloc(message.length + crypto_aead_xchacha20poly1305_ietf_ABYTES);
	crypto_aead_xchacha20poly1305_ietf_encrypt(cipher, message, ad, null, nonce, secretKey);
	return cipher;
}
export const encryptABytes = crypto_aead_xchacha20poly1305_ietf_ABYTES;
export function decrypt(cipher, ad, nonce, secretKey) {
	const message = bufferAlloc(cipher.length - crypto_aead_xchacha20poly1305_ietf_ABYTES);
	const verify = crypto_aead_xchacha20poly1305_ietf_decrypt(message, null, cipher, ad, nonce, secretKey);
	if (verify) {
		return message;
	} else {
		return false;
	}
}
export function passwordHash(password) {
	const out = bufferAlloc(crypto_pwhash_STRBYTES);
	crypto_pwhash_str(out, (isBuffer(password)) ? password : Buffer.from(password), 	crypto_pwhash_OPSLIMIT_MIN, crypto_pwhash_MEMLIMIT_MIN);
	return out;
}
export function passwordHashVerify(source, password) {
	return crypto_pwhash_str_verify(source, (isBuffer(password)) ? password : Buffer.from(password));
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
	const out = bufferAlloc(crypto_shorthash_BYTES);
	crypto_shorthash(out, message, bufferAlloc(crypto_shorthash_KEYBYTES));
	return out;
}
export function sign(message, privateKey) {
	const signedMessage = bufferAlloc(crypto_sign_BYTES + message.length);
	crypto_sign(signedMessage, message, privateKey);
	return signedMessage;
}
export function signDetached(message, privateKey) {
	const signedMessage = bufferAlloc(crypto_sign_BYTES);
	crypto_sign_detached(signedMessage, message, privateKey);
	return signedMessage;
}
export function signVerify(signedMessage, publicKey) {
	const message = bufferAlloc(signedMessage.length - crypto_sign_BYTES);
	const verify = crypto_sign_open(message, signedMessage, publicKey);
	return verify && message;
}
export function signVerifyDetached(signedMessage, message, publicKey) {
	return crypto_sign_verify_detached(signedMessage, message, publicKey);
}
export function keypair() {
	const publicKey = bufferAlloc(crypto_kx_PUBLICKEYBYTES);
	const privateKey = bufferAlloc(crypto_kx_SECRETKEYBYTES);
	crypto_kx_keypair(publicKey, privateKey);
	return {
		publicKey,
		privateKey
	};
}
export function clientSession(receiveKey, transmissionKey, publicKey, privateKey, serverPublicKey) {
	crypto_kx_client_session_keys(receiveKey, transmissionKey, publicKey, privateKey, serverPublicKey);
}
export function createSessionKey() {
	const sessionKey = bufferAlloc(crypto_kx_SESSIONKEYBYTES);
	return sessionKey;
}
export function sessionKeys(sourcePublicKey, sourcePrivateKey, targetPublicKey) {
	const receiveKey = createSessionKey();
	const transmitKey = createSessionKey();
	crypto_kx_server_session_keys(receiveKey, transmitKey, sourcePublicKey, sourcePrivateKey, targetPublicKey);
	return {
		transmitKey,
		receiveKey
	};
}
/* console.log(crypto_kx_SECRETKEYBYTES, crypto_sign_SECRETKEYBYTES);
 */
export function signKeypair() {
	const publicKey = bufferAlloc(crypto_sign_PUBLICKEYBYTES);
	const privateKey = bufferAlloc(crypto_sign_SECRETKEYBYTES);
	crypto_sign_keypair(publicKey, privateKey);
	return {
		publicKey,
		privateKey
	};
}
export function boxSeal(message, publicKey) {
	const encrypted = bufferAlloc(message.length + crypto_box_SEALBYTES);
	crypto_box_seal(encrypted, message, publicKey);
	return encrypted;
}
export function boxUnseal(encrypted, publicKey, privateKey) {
	const message = bufferAlloc(encrypted.length - crypto_box_SEALBYTES);
	const isValid = crypto_box_seal_open(message, encrypted, publicKey, privateKey);
	return isValid && message;
}
export function toBuffer(value) {
	return Buffer.from(value);
}
export function toBase64(value) {
	return value.toString('base64');
}
export function buff(value) {
	return Buffer.from(value);
}
export const hashBytes = crypto_generichash_BYTES;
export {
	crypto_aead_xchacha20poly1305_ietf_ABYTES,
	crypto_aead_xchacha20poly1305_ietf_decrypt,
	crypto_aead_xchacha20poly1305_ietf_encrypt,
	crypto_aead_xchacha20poly1305_ietf_NPUBBYTES,
	crypto_generichash,
	crypto_generichash_BYTES,
	crypto_generichash_BYTES_MIN,
	crypto_kx_client_session_keys,
	crypto_kx_keypair,
	crypto_kx_PUBLICKEYBYTES,
	crypto_kx_SECRETKEYBYTES,
	crypto_kx_server_session_keys,
	crypto_kx_SESSIONKEYBYTES,
	crypto_pwhash_MEMLIMIT_MIN,
	crypto_pwhash_OPSLIMIT_MIN,
	crypto_pwhash_str,
	crypto_pwhash_str_verify,
	crypto_pwhash_STRBYTES,
	crypto_shorthash,
	crypto_shorthash_BYTES,
	crypto_shorthash_KEYBYTES,
	crypto_sign,
	crypto_sign_BYTES,
	crypto_sign_detached,
	crypto_sign_keypair,
	crypto_sign_open,
	crypto_sign_PUBLICKEYBYTES,
	crypto_sign_SECRETKEYBYTES,
	crypto_sign_verify_detached,
	randombytes_buf,
	crypto_box_keypair,
	crypto_box_PUBLICKEYBYTES,
	crypto_box_SECRETKEYBYTES
};
