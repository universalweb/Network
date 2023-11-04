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
	crypto_secretbox_KEYBYTES,
	crypto_sign_ed25519_pk_to_curve25519,
	crypto_sign_ed25519_sk_to_curve25519,
	crypto_sign_ed25519_sk_to_pk,
	crypto_sign_ed25519_sk_to_seed,
	crypto_sign_SEEDBYTES,
	crypto_kx_seed_keypair,
	crypto_box_easy,
	crypto_box_open_easy,
	crypto_box_NONCEBYTES,
	crypto_box_MACBYTES
} = sodiumLib;
import { isBuffer, assign } from '@universalweb/acid';
export function toBuffer(value) {
	return Buffer.from(value);
}
export function toBase64(value) {
	return value.toString('base64');
}
export function buff(value) {
	return Buffer.from(value);
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
export function emptyNonce() {
	return bufferAlloc(crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
}
export function nonceBox(nonceBuffer) {
	if (nonceBuffer) {
		return randomize(nonceBuffer);
	}
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
export function secretBoxNonce() {
	return randomBuffer(crypto_secretbox_NONCEBYTES);
}
export function encrypt(message, sessionkeys, ad, nonceArg) {
	const encrypted = bufferAlloc(message.length + crypto_aead_xchacha20poly1305_ietf_ABYTES);
	const nonce = nonceBox(nonceArg);
	crypto_aead_xchacha20poly1305_ietf_encrypt(encrypted, message, ad, null, nonce, sessionkeys?.transmitKey || sessionkeys);
	return Buffer.concat([nonce, encrypted]);
}
encrypt.overhead = crypto_aead_xchacha20poly1305_ietf_ABYTES + crypto_aead_xchacha20poly1305_ietf_NPUBBYTES;
export function decrypt(encrypted, sessionkeys, ad, nonceArg) {
	try {
		const encryptedPayloadLength = encrypted.length;
		const nonce = nonceArg || encrypted.subarray(0, crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
		const encryptedMessage = (nonceArg && encrypted) || encrypted.subarray(crypto_aead_xchacha20poly1305_ietf_NPUBBYTES, encryptedPayloadLength);
		const message = (nonceArg && encrypted) || bufferAlloc(encryptedMessage.length - crypto_aead_xchacha20poly1305_ietf_ABYTES);
		const verify = crypto_aead_xchacha20poly1305_ietf_decrypt(message, null, encryptedMessage, ad, nonce, sessionkeys?.receiveKey || sessionkeys);
		if (verify) {
			return message;
		} else {
			return;
		}
	} catch (e) {
		return;
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
export function keypair(config) {
	const publicKey = config?.publicKey || bufferAlloc(crypto_kx_PUBLICKEYBYTES);
	const privateKey = config?.privateKey || bufferAlloc(crypto_kx_SECRETKEYBYTES);
	crypto_kx_keypair(publicKey, privateKey);
	return {
		publicKey,
		privateKey
	};
}
export function keypairSeed(config) {
	const publicKey = config?.publicKey || bufferAlloc(crypto_kx_PUBLICKEYBYTES);
	const privateKey = config?.privateKey || bufferAlloc(crypto_kx_SECRETKEYBYTES);
	crypto_kx_seed_keypair(publicKey, privateKey, config.seed);
	return {
		publicKey,
		privateKey
	};
}
export function createSessionKey() {
	const sessionKey = bufferAlloc(crypto_kx_SESSIONKEYBYTES);
	return sessionKey;
}
export function clientSessionKeys(client, serverPublicKey, sessionKeys) {
	const receiveKey = sessionKeys?.receiveKey || createSessionKey();
	const transmitKey = sessionKeys?.transmitKey || createSessionKey();
	crypto_kx_client_session_keys(receiveKey, transmitKey, client.publicKey, client.privateKey, serverPublicKey?.publicKey || serverPublicKey);
	return {
		transmitKey,
		receiveKey
	};
}
export function serverSessionKeys(server, clientPublicKey, sessionKeys) {
	const receiveKey = sessionKeys?.receiveKey || createSessionKey();
	const transmitKey = sessionKeys?.transmitKey || createSessionKey();
	crypto_kx_server_session_keys(receiveKey, transmitKey, server.publicKey, server.privateKey, clientPublicKey?.publicKey || clientPublicKey);
	return {
		transmitKey,
		receiveKey
	};
}
export function signKeypair(config) {
	const publicKey = config?.publicKey || bufferAlloc(crypto_sign_PUBLICKEYBYTES);
	const privateKey = config?.privateKey || bufferAlloc(crypto_sign_SECRETKEYBYTES);
	crypto_sign_keypair(publicKey, privateKey);
	return {
		publicKey,
		privateKey
	};
}
export function encryptKeypair(config) {
	const publicKey = config?.publicKey || bufferAlloc(crypto_box_PUBLICKEYBYTES);
	const privateKey = config?.privateKey || bufferAlloc(crypto_box_SECRETKEYBYTES);
	crypto_box_keypair(publicKey, privateKey);
	return {
		publicKey,
		privateKey
	};
}
export function authenticatedBox(message, sourceKeypair, destinationKeypair) {
	const nonce = secretBoxNonce();
	const encrypted = bufferAlloc(message.length + crypto_box_MACBYTES);
	crypto_box_easy(encrypted, message, nonce, sourceKeypair.publicKey, destinationKeypair?.privateKey || destinationKeypair);
	return Buffer.concat([nonce, encrypted]);
}
export function authenticatedBoxOpen(encrypted, destinationKeypair, sourceKeypair) {
	const encryptedPayloadLength = encrypted.length;
	const nonce = encrypted.subarray(0, crypto_box_NONCEBYTES);
	const encryptedMessage = encrypted.subarray(crypto_box_NONCEBYTES, encryptedPayloadLength);
	const message = bufferAlloc(encryptedPayloadLength - crypto_box_MACBYTES);
	crypto_box_easy(encryptedMessage, message, destinationKeypair?.publicKey || destinationKeypair, sourceKeypair?.privateKey || sourceKeypair);
	return message;
}
export function boxSeal(message, destinationKeypair) {
	const encrypted = bufferAlloc(message.length + crypto_box_SEALBYTES);
	crypto_box_seal(encrypted, message, destinationKeypair?.publicKey || destinationKeypair);
	return encrypted;
}
export function boxUnseal(encrypted, destinationKeypair) {
	const message = bufferAlloc(encrypted.length - crypto_box_SEALBYTES);
	const isValid = crypto_box_seal_open(message, encrypted, destinationKeypair.publicKey, destinationKeypair.privateKey);
	return isValid && message;
}
// Demonstrats that authenticatedBox is smaller than boxSeal
// const en2 = encryptKeypair();
// const en = encryptKeypair();
// const enc = authenticatedBox(Buffer.from('TEST'), en.publicKey, en.privateKey);
// console.log(enc.length);
// const enc2 = boxSeal(Buffer.from('TEST'), en2.publicKey);
// console.log(enc2.length);
export function signPublicKeyToEncryptPublicKey(originalPublicKey) {
	const publicKey = bufferAlloc(crypto_box_PUBLICKEYBYTES);
	crypto_sign_ed25519_pk_to_curve25519(publicKey, originalPublicKey);
	return publicKey;
}
export function signPrivateKeyToEncryptPrivateKey(originalPrivateKey) {
	const privateKey = bufferAlloc(crypto_box_SECRETKEYBYTES);
	crypto_sign_ed25519_sk_to_curve25519(privateKey, originalPrivateKey);
	return privateKey;
}
export function signKeypairToEncryptionKeypair(originalKeypair) {
	const publicKey = bufferAlloc(crypto_box_PUBLICKEYBYTES);
	crypto_sign_ed25519_pk_to_curve25519(publicKey, originalKeypair.publicKey);
	const result = {
		publicKey
	};
	if (originalKeypair.privateKey) {
		const privateKey = bufferAlloc(crypto_box_SECRETKEYBYTES);
		crypto_sign_ed25519_sk_to_curve25519(privateKey, originalKeypair.privateKey);
		result.privateKey = privateKey;
	}
	return result;
}
export function getSignPublicKeyFromPrivateKey(privateKey) {
	const publicKey = bufferAlloc(crypto_box_PUBLICKEYBYTES);
	crypto_sign_ed25519_sk_to_pk(publicKey, privateKey);
	return publicKey;
}
// const signn = signKeypairToEncryptKeypair(signKeypair());
// const gg = keypair();
// const sessionKeyss = clientSession(gg.publicKey, gg.privateKey, signn.publicKey);
// const sessionKeysBox = serverSession(signn.publicKey, signn.privateKey, gg.publicKey);
// console.log(sessionKeyss.transmitKey.toString('base64'), sessionKeyss.receiveKey.toString('base64'));
// console.log(sessionKeysBox.transmitKey.toString('base64'), sessionKeysBox.receiveKey.toString('base64'));
// const nonced = nonceBox();
// const encryptedd = encrypt(Buffer.from('test'), null, nonced, sessionKeyss.transmitKey);
// const decr = decrypt(encryptedd, null, nonced, sessionKeyss.transmitKey);
// console.log(decr.toString());
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
