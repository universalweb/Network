import { int512, randomBuffer } from '#crypto/utils.js';
import { isBuffer, isU8 } from '@universalweb/utilitylib';
import {
	kmac256 as kmac256JS,
	kmac256xof as kmac256xofJS,
} from '@noble/hashes/sha3-addons.js';
const isBun = typeof globalThis.Bun !== 'undefined' && Boolean(globalThis.Bun);
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
const useAddon = isBun || isBrowser;
const customizationEmpty = new Uint8Array();
const functionNameEmpty = new Uint8Array();
const { subtle } = globalThis.crypto;
function u8isEqual(a, b) {
	const bufferA = Buffer.from(a);
	const bufferB = Buffer.from(b);
	return bufferA.equals(bufferB);
}
export async function importKMACKey(key, keyLength) {
	if (useAddon) {
		return key;
	}
	if (isBuffer(key) || isU8(key)) {
		return subtle.importKey('raw-secret', key, {
			name: 'KMAC256',
			length: 256,
		}, true, ['sign', 'verify']);
	}
	return key;
}
export async function generateKMACKey(keyLength) {
	if (useAddon) {
		return randomBuffer(keyLength);
	}
	return subtle.generateKey(
		{
			name: 'KMAC256',
			length: 256,
		},
		true,
		['sign', 'verify']
	);
}
export async function exportKMACKey(key) {
	if (isBuffer(key) || isU8(key)) {
		return key;
	}
	return subtle.exportKey('raw-secret', key);
}
export async function kmac256(message, key, customization) {
	if (useAddon) {
		return kmac256JS(key, message, {
			personalization: customization,
		});
	}
	const algorithm = {
		name: 'KMAC256',
		length: 256,
		customization,
	};
	return subtle.sign(algorithm, key, message);
}
export async function kmac256Verify(signature, message, key, customization) {
	if (useAddon) {
		const sig2 = kmac256JS(key, message, {
			personalization: customization,
		});
		return u8isEqual(signature, sig2);
	}
	const algorithm = {
		name: 'KMAC256',
		length: 256,
		customization,
	};
	return subtle.verify(algorithm, key, signature, message);
}
async function exampleKMAC() {
	// Generate or import a KMAC key. `importOrGenerateKMACKey` will generate
	// a CryptoKey when a raw import is not supported by the runtime.
	const rawKey = randomBuffer(32);
	const key = await importKMACKey(rawKey);
	const message = Buffer.from('hello world');
	const sig1 = await kmac256(message, key, Buffer.from('MyApp'));
	console.log('KMAC256 sig (hex):', Buffer.from(sig1).toString('hex'));
	const sig2 = await kmac256(message, key, Buffer.from('MyApp'));
	console.log('KMAC256 sig2 (hex):', (kmac256xofJS(rawKey, message, {
		personalization: Buffer.from('MyApp'),
		dkLen: 16,
	})).toHex());
	console.log('KMAC256 sig2 (hex):', (kmac256xofJS(rawKey, message, {
		personalization: Buffer.from('MyApp'),
		dkLen: 18,
	})).toHex());
	// Re-signing with the same key and message must match
	console.log('KMAC256 signatures match:', Buffer.from(sig1).toString('hex') === Buffer.from(sig2).toString('hex'));
	// Verify using WebCrypto verify
	const valid = await kmac256Verify(sig1, message, key, Buffer.from('MyApp'));
	console.log('KMAC256 verify via WebCrypto:', Boolean(valid));
}
await exampleKMAC();
