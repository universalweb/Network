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
export function createConnectionIdKey() {
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
/*
	Generates either short connection ID or a long structured & encrypted connection ID.
	The long IDs are used for loadbalancing and are encrypted with a secret key & if a randomBytesSize is given, a random buffer is concatenated to the source.
 */
export function encodeConnectionId(source, secretKey, randomBytesSize) {
	if (secretKey) {
		const nonce = nonceBox();
		const sourceBuffer = (isBuffer(source)) ? source : Buffer.from(source);
		const sourceArray = [sourceBuffer];
		if (randomBytesSize) {
			sourceArray[1] = randomBuffer(randomBytesSize);
		}
		const sourceBufferConcat = Buffer.concat(sourceArray);
		const encryptedSource = encrypt(sourceBufferConcat, null, nonce, secretKey);
		return Buffer.concat([encryptedSource, nonce]);
	} else {
		return randomConnectionId();
	}
}
export function getConnectionIdData(source, secretKey) {
	const sourceLength = source.length;
	if (!sourceLength) {
		return console.error('No source length');
	}
	if (!secretKey || sourceLength < crypto_aead_xchacha20poly1305_ietf_NPUBBYTES) {
		return source;
	}
	const sourceLengthMinusNonce = sourceLength - crypto_aead_xchacha20poly1305_ietf_NPUBBYTES;
	if (sourceLengthMinusNonce < 0 || sourceLengthMinusNonce > sourceLength) {
		return console.error('Error in nonce+source length');
	}
	const connectionIdEncrypted = source.subarray(0, sourceLengthMinusNonce);
	/* 	console.log('Connection ID Encrypted', connectionIdEncrypted.toString('base64')); */
	const nonce = source.subarray(sourceLengthMinusNonce, sourceLength);
	return decrypt(connectionIdEncrypted, null, nonce, secretKey);
}
export function getConnectionIdNonce(source, secretKey) {
	const sourceLength = source.length;
	if (!sourceLength) {
		return console.error('No source length');
	}
	if (!secretKey || sourceLength < crypto_aead_xchacha20poly1305_ietf_NPUBBYTES) {
		return source;
	}
	const sourceLengthMinusNonce = sourceLength - crypto_aead_xchacha20poly1305_ietf_NPUBBYTES;
	if (sourceLengthMinusNonce < 0 || sourceLengthMinusNonce > sourceLength) {
		return console.error('Error in nonce+source length');
	}
	const connectionIdEncrypted = source.subarray(0, sourceLengthMinusNonce);
	/* 	console.log('Connection ID Encrypted', connectionIdEncrypted.toString('base64')); */
	const nonce = source.subarray(sourceLengthMinusNonce, sourceLength);
	return decrypt(connectionIdEncrypted, null, nonce, secretKey);
}
export function getConnectionId(source, secretKey) {
	const sourceLength = source.length;
	if (!sourceLength) {
		return console.error('No source length');
	}
	if (!secretKey) {
		return source;
	}
	const sourceLengthMinusNonce = sourceLength - crypto_aead_xchacha20poly1305_ietf_NPUBBYTES;
	if (sourceLengthMinusNonce < 0 || sourceLengthMinusNonce > sourceLength) {
		return console.error('Error in nonce+source length');
	}
	const connectionIdEncrypted = source.subarray(0, sourceLengthMinusNonce);
	const nonce = source.subarray(sourceLengthMinusNonce, sourceLength);
	const decrypted = decrypt(connectionIdEncrypted, null, nonce, secretKey);
	if (decrypted) {
		return [decrypted, nonce];
	}
}
// Example of Connection ID Encryption
// const connectionId = Buffer.concat([randomConnectionId(4), randomConnectionId(8)]);
// const key = createConnectionIdKey();
// console.log(connectionId.toString('base64'));
// const encryptedA = encodeConnectionId(connectionId, key);
// console.log(encryptedA, encryptedA.length);
// console.log(getConnectionIdData(encryptedA, key).toString('base64'));
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
export function sign(message, secretKey) {
	const signedMessage = bufferAlloc(crypto_sign_BYTES + message.length);
	crypto_sign(signedMessage, message, secretKey);
	return signedMessage;
}
export function signDetached(message, secretKey) {
	const signedMessage = bufferAlloc(crypto_sign_BYTES);
	crypto_sign_detached(signedMessage, message, secretKey);
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
	const message = bufferAlloc(signedMessage.length - crypto_sign_BYTES);
	const verify = crypto_sign_open(message, signedMessage, publicKey);
	return verify && message;
}
export function signVerify(signedMessage, message, publicKey) {
	return crypto_sign_verify_detached(signedMessage, signedMessage, publicKey);
}
export function signVerifyHash(signedMessage, message, publicKey, amount) {
	return crypto_sign_verify_detached(signedMessage, hash(message, amount), publicKey);
}
export function hashSign(message, secretKey) {
	return sign(hash(message), secretKey);
}
export function keypair() {
	const publicKey = bufferAlloc(crypto_kx_PUBLICKEYBYTES);
	const secretKey = bufferAlloc(crypto_kx_SECRETKEYBYTES);
	crypto_kx_keypair(publicKey, secretKey);
	return {
		publicKey,
		secretKey
	};
}
export function clientSession(receiveKey, transmissionKey, publicKey, privateKey, serverPublicKey) {
	crypto_kx_client_session_keys(receiveKey, transmissionKey, publicKey, privateKey, serverPublicKey);
}
export function createSessionKey() {
	const sessionKey = bufferAlloc(crypto_kx_SESSIONKEYBYTES);
	return sessionKey;
}
export function sessionKeys(sourcePublicKey, sourceSecretKey, targetPublicKey) {
	const receiveKey = createSessionKey();
	const transmitKey = createSessionKey();
	crypto_kx_server_session_keys(receiveKey, transmitKey, sourcePublicKey, sourceSecretKey, targetPublicKey);
	return {
		transmitKey,
		receiveKey
	};
}
/* console.log(crypto_kx_SECRETKEYBYTES, crypto_sign_SECRETKEYBYTES);
 */
export function signKeypair() {
	const publicKey = bufferAlloc(crypto_sign_PUBLICKEYBYTES);
	const secretKey = bufferAlloc(crypto_sign_SECRETKEYBYTES);
	crypto_sign_keypair(publicKey, secretKey);
	return {
		publicKey,
		secretKey
	};
}
export function boxSeal(message, publicKey) {
	const encrypted = bufferAlloc(message.length + crypto_box_SEALBYTES);
	crypto_box_seal(encrypted, message, publicKey);
	return encrypted;
}
export function boxUnseal(encrypted, publicKey, secretKey) {
	const message = bufferAlloc(encrypted.length - crypto_box_SEALBYTES);
	const isValid = crypto_box_seal_open(message, encrypted, publicKey, secretKey);
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
