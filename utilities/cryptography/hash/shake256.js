//
import {
	clearBuffer,
	hash512SettingsCrypto,
	int32,
	int64
} from '#utilities/cryptography/utils';
import cryptolib from 'crypto';
import { hashScheme } from './hashScheme.js';
const createHash = cryptolib.createHash;
const hashName = 'shake256';
export async function hash256(source) {
	return createHash(hashName).update(source).digest();
}
export async function hash512(source) {
	return createHash(hashName, hash512SettingsCrypto).update(source).digest();
}
export async function hashXOF(source, outputLength) {
	return createHash(hashName, {
		outputLength
	}).update(source).digest();
}
export const shake256 = hashScheme({
	name: 'shake256',
	alias: 'default',
	id: 0,
	security: 1,
	preferred: true,
	primary: true,
	hash256,
	hash: hash256,
	hash512,
	hashXOF
});
export default shake256;
// console.log('hash', (await hash512('hello world')));
