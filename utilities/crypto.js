const sodium = await import('sodium-native');
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
	randombytes_buf
} = sodium.default;
export function passwordHash(passwd) {
	const out = Buffer.alloc(crypto_pwhash_STRBYTES);
	crypto_pwhash_str(out, Buffer.from(passwd), 	crypto_pwhash_OPSLIMIT_MIN, crypto_pwhash_MEMLIMIT_MIN);
	return out;
}
export function passwordHashVerify(str, passwd) {
	return crypto_pwhash_str_verify(str, Buffer.from(passwd));
}
export function hash(message, amount) {
	const hashed = Buffer.alloc(amount || crypto_generichash_BYTES);
	crypto_generichash(hashed, message);
	console.log(hashed.length);
	return hashed;
}
export function hashMin(message) {
	const hashed = Buffer.alloc(crypto_generichash_BYTES_MIN);
	crypto_generichash(hashed, message);
	console.log(hashed.length);
	return hashed;
}
export function hashShort(message) {
	const out = Buffer.alloc(crypto_shorthash_BYTES);
	crypto_shorthash(out, message, Buffer.alloc(crypto_shorthash_KEYBYTES));
	console.log(out.length);
	return out;
}
export function sign(message, secretKey) {
	const signedMessage = Buffer.alloc(crypto_sign_BYTES + message.length);
	crypto_sign(signedMessage, message, secretKey);
	console.log(signedMessage.length);
	return signedMessage;
}
export function signDetached(message, secretKey) {
	const signedMessage = Buffer.alloc(crypto_sign_BYTES);
	crypto_sign_detached(signedMessage, message, secretKey);
	console.log(signedMessage.length);
	return signedMessage;
}
export function hashSignDetached(message, secretKey, amount) {
	return signDetached(hash(message, amount), secretKey);
}
export function hashSignDetachedMin(message, secretKey) {
	return signDetached(hashMin(message), secretKey);
}
export function hashSignDetachedShort(message, secretKey) {
	return signDetached(hashShort(message), secretKey);
}
export function signOpen(signedMessage, publicKey) {
	const message = Buffer.alloc(signedMessage.length - crypto_sign_BYTES);
	crypto_sign_open(message, signedMessage, publicKey);
	return message;
}
export function signVerify(signedMessage, publicKey) {
	const message = Buffer.alloc(signedMessage.length - crypto_sign_BYTES);
	return crypto_sign_open(message, signedMessage, publicKey);
}
export function signVerifyDetached(signedMessage, publicKey) {
	const message = Buffer.alloc(crypto_sign_BYTES);
	return crypto_sign_verify_detached(message, signedMessage, publicKey);
}
export function emptyNonce() {
	return Buffer.alloc(crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
}
export function nonceBox(nonceBuffer) {
	const nonce = nonceBuffer || Buffer.alloc(crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
	randombytes_buf(nonce);
	return nonce;
}
export function encrypt(message, ad, nonce, secretKey) {
	const cipher = Buffer.alloc(message.length + crypto_aead_xchacha20poly1305_ietf_ABYTES);
	crypto_aead_xchacha20poly1305_ietf_encrypt(cipher, message, ad, null, nonce, secretKey);
	return cipher;
}
export const encryptABytes = crypto_aead_xchacha20poly1305_ietf_ABYTES;
export function decrypt(cipher, ad, nonce, secretKey) {
	const message = Buffer.alloc(cipher.length - crypto_aead_xchacha20poly1305_ietf_ABYTES);
	const verify = crypto_aead_xchacha20poly1305_ietf_decrypt(message, null, cipher, ad, nonce, secretKey);
	if (verify) {
		return message;
	}
}
export function hashSign(message, secretKey) {
	return sign(hash(message), secretKey);
}
export function keypair() {
	const publicKey = Buffer.alloc(crypto_kx_PUBLICKEYBYTES);
	const secretKey = Buffer.alloc(crypto_kx_SECRETKEYBYTES);
	crypto_kx_keypair(publicKey, secretKey);
	console.log(crypto_kx_PUBLICKEYBYTES, crypto_kx_SECRETKEYBYTES);
	return {
		publicKey,
		secretKey
	};
}
export function clientSession(receiveKey, transmissionKey, publicKey, privateKey, serverPublicKey) {
	crypto_kx_client_session_keys(receiveKey, transmissionKey, publicKey, privateKey, serverPublicKey);
}
export function createSessionKey() {
	const sessionKey = Buffer.alloc(crypto_kx_SESSIONKEYBYTES);
	return sessionKey;
}
export function serverSession(serverPublicKey, serverSecretKey, clientPublicKey) {
	const receiveKey = createSessionKey();
	const transmitKey = createSessionKey();
	crypto_kx_server_session_keys(receiveKey, transmitKey, serverPublicKey, serverSecretKey, clientPublicKey);
	return {
		transmitKey,
		receiveKey
	};
}
export function signKeypair() {
	const publicKey = Buffer.alloc(crypto_sign_PUBLICKEYBYTES);
	const secretKey = Buffer.alloc(crypto_sign_SECRETKEYBYTES);
	crypto_sign_keypair(publicKey, secretKey);
	return {
		publicKey,
		secretKey
	};
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
export function createClientId() {
	const clientId = Buffer.alloc(8);
	randombytes_buf(clientId);
	return clientId;
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
	randombytes_buf
};
