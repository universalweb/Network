import { encode, encodeStrict } from '#utilities/serialize';
import { gzip, zstdCompress } from 'node:zlib';
import { insertSortedBuffer, toEncoding } from './utils.js';
import { hash256 } from '#crypto/hash/shake256.js';
import { promisify } from 'node:util';
import { randomBuffer } from '#crypto/utils.js';
// BASIC SNAPSHOT WITH NO FALSE POSITIVES DETERMINISTIC
// Need support for removing hashes without large calc
// Object Keys & Arrays must be array sorted before hashing
// TODO: ADD LIST OF FIRST & LAST BYTES TO SUPPORT PARTIAL HASH LOOKUP -> Arrays of 256 sorted bytes -> Byte index 0 or 1
// TODO: BLOOM FILTER for quick search with false positives
export class VIATHashTrie {
	constructor(targetObject) {
		this.trie = targetObject || new Map();
		return this;
	}
	async append(hash) {
		const hashLength = hash.length;
		let currentPath = this.trie;
		for (let bytePosition = 0; bytePosition < hashLength; bytePosition++) {
			const key = (hash[bytePosition]);
			if (!currentPath[key]) {
				const parentNode = (bytePosition === 0) ? null : hash[bytePosition - 1];
				currentPath[key] = {};
				// if (parentNode) {
				// 	currentPath[key].parent = parentNode;
				// }
				if (bytePosition === hashLength - 1) {
					currentPath[key] = true;
				}
			}
			currentPath = currentPath[key];
		}
		return this;
	}
	async has(hash) {
		const hashLength = hash.length;
		const lastIndex = hashLength - 1;
		let currentPath = this.trie;
		for (let bytePosition = 0; bytePosition < hashLength; bytePosition++) {
			const key = hash[bytePosition];
			if (!currentPath.has(key)) {
				console.log(`Path not found for byte value ${key} at position ${bytePosition}`);
				return false;
			}
			currentPath = currentPath.get(key);
		}
		if (currentPath === true) {
			console.log(`Path found for byte value ${hash[lastIndex]} at position ${lastIndex}`);
			return true;
		}
		return false;
	}
	async getHash() {
		const encoded = await encodeStrict(this.trie);
		return hash256(encoded);
	}
	async getObject() {
		return this.trie;
	}
	async getEncoded() {
		return encodeStrict(await this.getObject());
	}
	// Probabalistic lookup via byte layers
	// support inverse lookup?
	// support delete?
	// support count of hashes?
	// support list of hashes?
}
export async function viatHashTrie(...args) {
	return new VIATHashTrie(...args);
}
async function exampleTest() {
	const trie = new VIATHashTrie();
	const hashExample = Buffer.from('TEST00');
	const hash2Example = Buffer.from('TEST12');
	const hash3Example = Buffer.from('TEST13');
	const hash4Example = Buffer.from('TEST14');
	await trie.append(hashExample);
	await trie.append(hash2Example);
	await trie.append(hash3Example);
	// console.log(await trie.getHash());
	await trie.append(hash4Example);
	// for (let i = 0; i < 10000; i++) {
	// 	await trie.append(await randomBuffer(32));
	// }
	// console.dir(trie, {
	// 	depth: 10,
	// });
	console.log(((await trie.getEncoded()).length) / 1024);
	// console.log((32 * 60000) / 1024);
	// await trie.has(hash2Example);
	// await trie.has(Buffer.from('TEST123'));
	// console.log(await trie.getHash());
}
