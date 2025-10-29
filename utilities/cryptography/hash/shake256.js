// SHAKE256 Paired with strict size outputs of SHA3-256 & SHA3-512
// Other SHAKE related algorithms can be included here
import {
	clearBuffer,
	defaultHashSettings,
	hash1024SettingsCrypto,
	hash512SettingsCrypto,
	int32,
	int64,
	toHex,
} from '#utilities/cryptography/utils';
import cryptolib from 'node:crypto';
import { hashScheme } from './hashScheme.js';
import { runBench } from '../../benchmark.js';
const createHash = cryptolib.hash;
const createHasher = cryptolib.createHash;
const hashName = 'shake256';
const hash512StrictName = 'sha3-512';
const hash256StrictName = 'sha3-256';
const outputEncoding = 'buffer';
import viatDefaults from '#viat/defaults';
const legacyAddressHashSettings = viatDefaults.wallets.legacy.walletHashConfig;
export async function hash256(source) {
	if (globalThis?.Bun) {
		const hasher = createHasher(hashName, defaultHashSettings);
		return hasher.update(source).digest();
	}
	return createHash(hashName, source, defaultHashSettings);
}
// STRICT SECURITY MARGIN FOR 32 BYTE OUTPUT USES SHA3-256 INSTEAD
export async function hash256Strict(source) {
	if (globalThis?.Bun) {
		const hasher = createHasher(hash256StrictName, defaultHashSettings);
		return hasher.update(source).digest();
	}
	return createHash(hash256StrictName, source, defaultHashSettings);
}
export async function hash512(source) {
	if (globalThis?.Bun) {
		const hasher = createHasher(hashName, hash512SettingsCrypto);
		return hasher.update(source).digest();
	}
	return createHash(hashName, source, hash512SettingsCrypto);
}
// STRICT SECURITY MARGIN FOR 64 BYTE OUTPUT USES SHA3-512 INSTEAD
export async function hash512Strict(source) {
	if (globalThis?.Bun) {
		const hasher = createHasher(hash512StrictName, defaultHashSettings);
		return hasher.update(source).digest();
	}
	return createHash(hash512StrictName, source, defaultHashSettings);
}
export async function hash1024(source) {
	if (globalThis?.Bun) {
		const hasher = createHasher(hashName, hash1024SettingsCrypto);
		return hasher.update(source).digest();
	}
	return createHash(hashName, source, hash1024SettingsCrypto);
}
export async function hashLegacyAddress(source) {
	if (globalThis?.Bun) {
		const hasher = createHasher(hashName, legacyAddressHashSettings);
		return hasher.update(source).digest();
	}
	return createHash(hashName, source, legacyAddressHashSettings);
}
export async function hashXOF(source, outputLength = int32) {
	if (globalThis?.Bun) {
		const hasher = createHasher(hashName, {
			outputLength,
			outputEncoding,
		});
		return hasher.update(source).digest();
	}
	return createHash(hashName, source, {
		outputLength,
		outputEncoding,
	});
}
// console.log('hash256', await hash256(Buffer.from('hello world')));
// console.log('hash256Strict', await hash256Strict(Buffer.from('hello world')));
// console.log('hash512', await hash512(Buffer.from('hello world')));
// console.log('hash512Strict', await hash512Strict(Buffer.from('hello world')));
// console.log('hash1024', await hash1024(Buffer.from('hello world')));
export async function hashXOFObject(source, config) {
	if (globalThis?.Bun) {
		const hasher = createHasher(hashName, config);
		return hasher.update(source).digest();
	}
	return createHash(hashName, source, config);
}
export const shake256 = hashScheme({
	name: 'shake256',
	alias: 'default',
	description: 'SHA3 family of hashing functions SHAKE256, SHA3-256, SHA3-512',
	id: 0,
	security: 1,
	preferred: true,
	primary: true,
	hash256,
	hash: hash256,
	hash256Strict,
	hash512,
	hash512Strict,
	hashLegacyAddress,
	hash1024,
	hashXOF,
	hashXOFObject,
});
export default shake256;
// console.log('hash', toHex((await hash256('hello world'))));
// console.log('hash', (await hash512('hello world')));

