import { encode, encodeStrict } from '#utilities/serialize';
import { getKeyString, insertSortedBuffer } from './utils.js';
import { VIATHashTrie } from './hashTrie.js';
import { hash256 } from '#crypto/hash/shake256.js';
import { randomBuffer } from '#crypto/utils.js';
// ParallelHashXOF256
// Sort keys and arrays before hashing OR use CBOR encode Strict for deterministic encoding then hashing
// Compare trie hashes for hash differences with different insertion order to confirm CBOR encoding is correct
// TODO: Switch nodes to their own map or leave for cache purposes?
function toEncoding(value) {
	return value;
}
async function computeNodeHash(nodes) {
	const hashes = [];
	const nodeKeys = Object.keys(nodes);
	const keysLength = nodeKeys.length;
	if (keysLength === 0) {
		return Buffer.alloc(0);
	}
	for (let i = 0; i < keysLength; i++) {
		const key = toEncoding(nodeKeys[i]);
		if (nodes[key]) {
			const nodeHash = await nodes[key].fullHash();
			if (nodeHash) {
				insertSortedBuffer(hashes, nodeHash);
			}
		}
	}
	if (!hashes.length) {
		return;
	}
	if (hashes.length === 1) {
		return hashes[0];
	}
	const concatenatedHashes = await encode(hashes);
	console.log('Computing node hash for hashes:', hashes, concatenatedHashes);
	return hash256(concatenatedHashes);
}
class ViatSyncBucket {
	hashHashes = false;
	nodes = {};
	hashes = new Map();
	list = [];
	count = 0;
	hash = undefined;
	stale = true;
	maxIndex = 3;
	constructor(...args) {
		if (args.length) {
			return this.init(...args);
		}
		return this;
	}
	async init(key, bytePosition, parentBranch) {
		this.key = key;
		this.bytePosition = bytePosition;
		this.parent = parentBranch;
		this.maxIndex = parentBranch.maxIndex;
		const trieMap = new Map();
		this.trieMap = trieMap;
		trieMap.set('list', this.list);
		return this;
	}
	async append(hash) {
		console.log('ViatSyncBucket', hash);
		const hashKeyString = getKeyString(hash);
		const key = this.key;
		if (this.hashes.has(hashKeyString)) {
			console.log(`Hash ${hashKeyString} already exists in this branch`);
			return this;
		}
		if (!this.trieMap.has('list')) {
			this.trieMap.set('list', this.list);
		}
		if (!this.hashes.has(hashKeyString)) {
			const index = insertSortedBuffer(this.list, hash);
			this.hashes.set(hashKeyString, index);
			this.count++;
			this.stale = true;
			return {
				bucket: this,
				index,
			};
		}
	}
	async remove(hash) {
		const hashKeyString = getKeyString(hash);
		const index = this.hashes.get(hashKeyString);
		console.log(`Removing hash ${hashKeyString}@${index}`);
		if (index === undefined) {
			console.log(`Hash ${hashKeyString}@${index} not found in this branch`);
			return;
		}
		this.hashes.delete(hashKeyString);
		this.list.splice(index, 1);
		this.count--;
		return {
			source: this,
			index,
		};
	}
	// GET ALL CHILD HASHES
	//  SORT OBJECT KEYS BEFORE HASHING
	async fullHash() {
		if (this.trieMap.get('hash') && !this.stale) {
			console.log('Returning cached hash');
			return this.trieMap.get('hash');
		}
		if (this.list.length === 1) {
			this.trieMap.set('hash', this.list[0]);
			return this.list[0];
		} else if (this.list.length === 0) {
			this.parent.trieMap.delete(this.key);
			return undefined;
		}
		// NOTE: Self sourted so encodeStrict is likely not needed
		const concatenatedHashes = await encodeStrict(this.list);
		this.trieMap.set('hash', await hash256(concatenatedHashes));
		this.stale = false;
		return this.trieMap.get('hash');
	}
}
class ViatSyncBranch {
	constructor(...args) {
		if (args.length) {
			return this.init(...args);
		}
		return this;
	}
	async init(key, bytePosition, parentSource) {
		this.key = key;
		this.bytePosition = bytePosition;
		this.parent = parentSource;
		this.maxIndex = parentSource.maxIndex;
		const trieMap = new Map();
		this.trieMap = trieMap;
		return this;
	}
	async append(hash) {
		const bytePosition = this.bytePosition + 1;
		const key = hash[bytePosition];
		const ConstructorBranch = (bytePosition + 1 === this.maxIndex) ? ViatSyncBucket : ViatSyncBranch;
		if (!this.nodes[key]) {
			console.log(`Creating new bucket for key ${key} index ${bytePosition} with hash ${hash.toString('base64')}`);
			this.nodes[key] = await (new ConstructorBranch(key, bytePosition, this));
		}
		if (!this.trieMap.has(key)) {
			this.trieMap.set(key, this.nodes[key].trieMap);
		}
		const appendInfo = this.nodes[key].append(hash);
		if (appendInfo) {
			console.log(`Appending to existing bucket for key ${key} index ${bytePosition} with hash ${hash.toString('base64')}`);
			this.stale = true;
			this.count++;
			return {
				source: this,
				index: appendInfo.index,
			};
		}
	}
	async remove(hash) {
		const bytePosition = this.bytePosition + 1;
		const key = hash[bytePosition];
		if (!this.nodes[key] || !this.trieMap.has(key)) {
			return;
		}
		console.log(`Removing from bucket for key ${key}@${bytePosition} with hash ${hash.toString('base64')}`);
		const removalInfo = await this.nodes[key].remove(hash);
		if (removalInfo?.source?.count === 0) {
			this.trieMap.delete(key);
			this.count--;
			return {
				source: this,
			};
		}
	}
	async fullHash() {
		if (this.hash && !this.stale) {
			console.log('Returning cached hash');
			return this.hash;
		}
		this.hash = await computeNodeHash(this.nodes);
		this.hash && this.trieMap.set('hash', this.hash);
		this.stale = false;
		return this.hash;
	}
	hash = undefined;
	nodes = {};
	stale = true;
	maxIndex = 3;
	count = 0;
}
class ViatSyncTrie {
	constructor() {
		this.hashTrie = new VIATHashTrie();
		return this;
	}
	nodes = {};
	trieMap = new Map();
	levelIndex = new Map();
	depth = 3;
	stale = true;
	hash = undefined;
	maxIndex = 3;
	count = 0;
	async append(hash) {
		const hashLength = hash.length;
		const key = toEncoding(hash[0]);
		const bytePosition = 0;
		// for (; bytePosition < hashLength; bytePosition++) {
		// 	key = hash[bytePosition];
		// }
		if (!this.nodes[key]) {
			console.log(`Creating new branch for key ${key} with hash ${hash.toString('base64')}`);
			this.nodes[key] = await (new ViatSyncBranch(hash[bytePosition], 0, this));
		}
		if (this.nodes[key]) {
			if (!this.trieMap.has(key)) {
				this.trieMap.set(key, this.nodes[key].trieMap);
			}
			console.log(`Appending to existing branch for key ${key} with hash ${hash.toString('base64')}`);
			await this.nodes[key].append(hash);
			this.stale = true;
			this.count++;
		}
	}
	async remove(hash) {
		const bytePosition = 0;
		const key = toEncoding(hash[0]);
		if (!this.nodes[key]) {
			return;
		}
		console.log(`Removing from branch for key ${key}@${bytePosition} with hash ${hash.toString('base64')}`);
		const removalInfo = await this.nodes[key]?.remove(hash);
		if (removalInfo?.source?.count === 0) {
			this.trieMap.delete(key);
			this.count--;
			return removalInfo;
		}
	}
	//  SORT OBJECT KEYS BEFORE HASHING
	async fullHash() {
		if (this.hash && !this.stale) {
			console.log('Returning cached hash');
			return this.hash;
		}
		this.hash = await computeNodeHash(this.nodes);
		this.trieMap.set('hash', this.hash);
		this.stale = false;
		return this.hash;
	}
	async getEncoded() {
		const obj = await this.trieMap;
		if (obj) {
			const encoded = await encodeStrict(obj);
			return encoded;
		}
		return encodeStrict({
			empty: true,
		});
	}
	async getBranch(key) {
		const paths = key.split('.');
		const pathsLength = paths.length;
		let currentNode = this;
		for (let i = 0; i < pathsLength; i++) {
			const pathKey = toEncoding(paths[i]);
			console.log(currentNode, pathKey);
			if (currentNode.nodes[pathKey]) {
				currentNode = currentNode.nodes[pathKey];
			} else {
				return null;
			}
		}
		return currentNode;
	}
	// Merge Trie props
	async exportFinalizedTree() {
		const bucketTrie = await this.getObject();
		const hashTrie = await this.hashTrie.getObject();
		return {
			bucketTrie,
			hashTrie,
		};
	}
}
async function exampleTest() {
	const trie = new ViatSyncTrie();
	const hashExample = Buffer.from('TES');
	const hash2Example = Buffer.from('TEG');
	const hash3Example = Buffer.from('TEB');
	const hash4Example = Buffer.from('AEB');
	await trie.append(hashExample);
	await trie.append(hash2Example);
	await trie.append(hash3Example);
	await trie.append(hash4Example);
	await trie.remove(hash4Example);
	await trie.append(hash4Example);
	// for (let i = 0; i < 100000; i++) {
	// 	await trie.append(await randomBuffer(6));
	// }
	// console.log(findNextCollisionIndex([
	// 	hashExample, hash2Example, hash3Example,
	// ], 0, hashExample.length).prefix.toString());
	// console.log(await trie.fullHash());
	// console.log(await trie.fullHash());
	// console.log(await trie.fullHash());
	// console.log(await trie.exportFinalizedTree());
	// const viatTrie = await viatHashTrie();
	// await viatTrie.append(hashExample);
	// await viatTrie.append(hash2Example);
	// await viatTrie.append(hash3Example);
	// console.log(await viatTrie.getHash());
	// await viatTrie.append(hash4Example);
	// const TEBranch = await trie.getBranch('T.E');
	// console.log(TEBranch);
	// console.log(TEBranch.getObject());
	console.dir(trie.trieMap, {
		depth: 8,
	});
	// console.dir(trie, {
	// 	depth: 8,
	// });
}
// await exampleTest();
