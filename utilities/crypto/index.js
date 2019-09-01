const {
	crypto_sign,
	crypto_generichash,
	crypto_generichash_BYTES,
	crypto_kx_PUBLICKEYBYTES,
	crypto_kx_SECRETKEYBYTES,
	crypto_kx_keypair,
	crypto_sign_PUBLICKEYBYTES,
	crypto_sign_SECRETKEYBYTES,
	crypto_sign_keypair,
	crypto_sign_BYTES,
	crypto_sign_open,
	crypto_aead_xchacha20poly1305_ietf_encrypt,
	crypto_aead_xchacha20poly1305_ietf_decrypt,
	crypto_aead_xchacha20poly1305_ietf_ABYTES,
	crypto_aead_xchacha20poly1305_ietf_NPUBBYTES,
	randombytes_buf,
	crypto_kx_client_session_keys,
	crypto_kx_SESSIONKEYBYTES,
	crypto_kx_server_session_keys,
} = require('sodium-native');
function hash(message) {
	const hashed = Buffer.alloc(crypto_generichash_BYTES);
	crypto_generichash(hashed, message);
	return hashed;
}
function sign(message, secretKey) {
	const signedMessage = Buffer.alloc(crypto_sign_BYTES + message.length);
	crypto_sign(signedMessage, message, secretKey);
	return signedMessage;
}
function signOpen(message, publicKey) {
	const signedMessage = Buffer.alloc(crypto_sign_BYTES);
	crypto_sign_open(message, signedMessage, publicKey);
	return signedMessage;
}
function emptyNonce() {
	return Buffer.alloc(crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
}
function nonceBox() {
	const nonce = Buffer.alloc(crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
	randombytes_buf(nonce);
	return nonce;
}
function encrypt(message, ad, nonce, secretKey) {
	const cipher = Buffer.alloc(message.length + crypto_aead_xchacha20poly1305_ietf_ABYTES);
	crypto_aead_xchacha20poly1305_ietf_encrypt(cipher, message, ad, null, nonce, secretKey);
	return cipher;
}
function decrypt(cipher, ad, nonce, secretKey) {
	const message = Buffer.alloc(cipher.length - crypto_aead_xchacha20poly1305_ietf_ABYTES);
	const verify = crypto_aead_xchacha20poly1305_ietf_decrypt(message, null, cipher, ad, nonce, secretKey);
	if (verify) {
		return message;
	}
}
function hashSign(message, secretKey) {
	return sign(hash(message), secretKey);
}
function keypair() {
	const publicKey = Buffer.alloc(crypto_kx_PUBLICKEYBYTES);
	const secretKey = Buffer.alloc(crypto_kx_SECRETKEYBYTES);
	crypto_kx_keypair(publicKey, secretKey);
	console.log(crypto_kx_PUBLICKEYBYTES, crypto_kx_SECRETKEYBYTES);
	return {
		publicKey,
		secretKey
	};
}
function clientSession(receiveKey, transmissionKey, publicKey, privateKey, serverPublicKey) {
	crypto_kx_client_session_keys(receiveKey, transmissionKey, publicKey, privateKey, serverPublicKey);
}
function createSessionKey() {
	const sessionKey = Buffer.alloc(crypto_kx_SESSIONKEYBYTES);
	return sessionKey;
}
function serverSession(serverPublicKey, serverSecretKey, clientPublicKey) {
	const receiveKey = createSessionKey();
	const transmitKey = createSessionKey();
	crypto_kx_server_session_keys(receiveKey, transmitKey, serverPublicKey, serverSecretKey, clientPublicKey);
	return {
		transmitKey,
		receiveKey
	};
}
function signKeypair() {
	const publicKey = Buffer.alloc(crypto_sign_PUBLICKEYBYTES);
	const secretKey = Buffer.alloc(crypto_sign_SECRETKEYBYTES);
	crypto_sign_keypair(publicKey, secretKey);
	return {
		publicKey,
		secretKey
	};
}
function toBuffer(value) {
	return Buffer.from(value);
}
function toBase64(value) {
	return value.toString('base64');
}
function buff(value) {
	return Buffer.from(value);
}
function createStreamId() {
	const streamId = Buffer.alloc(8);
	randombytes_buf(streamId);
	return streamId;
}
const methods = {
	hash,
	sign,
	hashSign,
	keypair,
	signKeypair,
	signOpen,
	toBuffer,
	toBase64,
	buff,
	encrypt,
	decrypt,
	createStreamId,
	clientSession,
	serverSession,
	nonceBox,
	emptyNonce,
	createSessionKey,
	randombytes_buf,
	hashBytes: crypto_generichash_BYTES
};
module.exports = (state) => {
	if (state) {
		state.crypto = methods;
	}
	return methods;
};
