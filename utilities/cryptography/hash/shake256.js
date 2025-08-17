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
const hashName = 'shake256';
const hash512StrictName = 'sha3-512';
const outputEncoding = 'buffer';
export async function hash256(source) {
	return createHash(hashName, source, defaultHashSettings);
}
export async function hash512(source) {
	return createHash(hashName, source, hash512SettingsCrypto);
}
// STRICT SECURITY MARGIN FOR 64 BYTE OUTPUT
export async function hash512Strict(source) {
	return createHash(hash512StrictName, source, defaultHashSettings);
}
export async function hash1024(source) {
	return createHash(hashName, source, hash1024SettingsCrypto);
}
export async function hashXOF(source, outputLength = int32) {
	return createHash(hashName, source, {
		outputLength,
		outputEncoding,
	});
}
export async function hashXOFObject(source, config) {
	return createHash(hashName, source, config);
}
export const shake256 = hashScheme({
	name: 'shake256',
	alias: 'default',
	description: 'SHAKE256 XOF',
	id: 0,
	security: 1,
	preferred: true,
	primary: true,
	hash256,
	hash: hash256,
	hash512,
	hash1024,
	hashXOF,
	hashXOFObject,
});
export default shake256;
// console.log('hash', toHex((await hash256('hello world'))));
// console.log('hash', (await hash512('hello world')));

