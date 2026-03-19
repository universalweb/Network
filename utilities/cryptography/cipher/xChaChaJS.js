import { randomBytes } from '@noble/ciphers/utils.js';
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
const plaintext = new Uint8Array(32).fill(16);
function encrypt(key, nonce, message, ad) {
	const cipherText = xchacha20poly1305(key, nonce).encrypt(message);
	return cipherText;
}
function decrypt(key, nonce, cipherText, ad) {
	const message = xchacha20poly1305(key, nonce).decrypt(cipherText);
	return message;
}
function example() {
	const keyA = randomBytes(32);
	const nonceA = randomBytes(24);
	console.log(encrypt(keyA, nonceA, Buffer.from('Hello World')));
}
export { encrypt, decrypt };
export default {
	encrypt,
	decrypt,
};
