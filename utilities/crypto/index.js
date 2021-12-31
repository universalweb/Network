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
	crypto_pwhash_str,
	crypto_pwhash_OPSLIMIT_MIN,
	crypto_pwhash_MEMLIMIT_MIN,
	crypto_pwhash_STRBYTES,
	crypto_pwhash_str_verify,
	crypto_shorthash_BYTES,
	crypto_sign_detached,
	crypto_sign_verify_detached,
	crypto_shorthash,
	crypto_shorthash_KEYBYTES,
	crypto_generichash_BYTES_MIN
} = require('sodium-native');
function passwordHash(passwd) {
	const out = Buffer.alloc(crypto_pwhash_STRBYTES);
	crypto_pwhash_str(out, Buffer.from(passwd), 	crypto_pwhash_OPSLIMIT_MIN, crypto_pwhash_MEMLIMIT_MIN);
	return out;
}
function passwordHashVerify(str, passwd) {
	return crypto_pwhash_str_verify(str, Buffer.from(passwd));
}
function hash(message, amount) {
	const hashed = Buffer.alloc(amount || crypto_generichash_BYTES);
	crypto_generichash(hashed, message);
	console.log(hashed.length);
	return hashed;
}
function hashMin(message) {
	const hashed = Buffer.alloc(crypto_generichash_BYTES_MIN);
	crypto_generichash(hashed, message);
	console.log(hashed.length);
	return hashed;
}
function hashShort(message) {
	const out = Buffer.alloc(crypto_shorthash_BYTES);
	crypto_shorthash(out, message, Buffer.alloc(crypto_shorthash_KEYBYTES));
	console.log(out.length);
	return out;
}
function sign(message, secretKey) {
	const signedMessage = Buffer.alloc(crypto_sign_BYTES + message.length);
	crypto_sign(signedMessage, message, secretKey);
	console.log(signedMessage.length);
	return signedMessage;
}
function signDetached(message, secretKey) {
	const signedMessage = Buffer.alloc(crypto_sign_BYTES);
	crypto_sign_detached(signedMessage, message, secretKey);
	console.log(signedMessage.length);
	return signedMessage;
}
function hashSignDetached(message, secretKey, amount) {
	return signDetached(hash(message, amount), secretKey);
}
function hashSignDetachedMin(message, secretKey) {
	return signDetached(hashMin(message), secretKey);
}
function hashSignDetachedShort(message, secretKey) {
	return signDetached(hashShort(message), secretKey);
}
function signOpen(signedMessage, publicKey) {
	const message = Buffer.alloc(signedMessage.length - crypto_sign_BYTES);
	crypto_sign_open(message, signedMessage, publicKey);
	return message;
}
function signVerify(signedMessage, publicKey) {
	const message = Buffer.alloc(signedMessage.length - crypto_sign_BYTES);
	return crypto_sign_open(message, signedMessage, publicKey);
}
function signVerifyDetached(signedMessage, publicKey) {
	const message = Buffer.alloc(crypto_sign_BYTES);
	return crypto_sign_verify_detached(message, signedMessage, publicKey);
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
function createClientId() {
	const clientId = Buffer.alloc(8);
	randombytes_buf(clientId);
	return clientId;
}
const methods = {
	hash,
	sign,
	hashSign,
	keypair,
	signKeypair,
	signOpen,
	signVerify,
	toBuffer,
	toBase64,
	buff,
	encrypt,
	decrypt,
	createClientId,
	clientSession,
	serverSession,
	nonceBox,
	emptyNonce,
	createSessionKey,
	randombytes_buf,
	passwordHashVerify,
	passwordHash,
	signDetached,
	signVerifyDetached,
	hashSignDetached,
	hashSignDetachedShort,
	hashShort,
	hashSignDetachedMin,
	hashMin,
	hashBytes: crypto_generichash_BYTES
};
module.exports = (state) => {
	if (state) {
		state.crypto = methods;
	}
	return methods;
};
