/*
	This is used for consensus and quick sync of audit block data.
	It uses a bucketed trie structure to store hashes in buckets at the leaf nodes.
	Each bucket can store multiple hashes to reduce the depth of the trie and improve performance.
	Each node and bucket computes a hash of its contents for quick comparison and verification.
	When a new hash is added, it is placed in the appropriate bucket based on its byte values.
	__________________________________________________________________
	The purpose is to provide an efficient way to summarize and verify large sets of audit block hashes
	to share across the network for quick sync and consensus verification.
	Reducing the amount of hash work done is possible by incorporating the original hash instead of re-hashing everything.
	__________________________________________________________________
	Because a Map is used CBOR encoding with sorted keys is needed for deterministic encoding before final block hashing.
	The Arrays within the structure must also be sorted before encoding to ensure deterministic hashes.
	Array's should use sort in place when appending new hashes to avoid the cost of sorting all arrays when CBORing.
	__________________________________________________________________
	To adjust collision rates you can reduce the total possible key combinations via bitwise operations on the byte values used as keys.
	Hashing can be added at the beginning of the append process to ensure fixed length hashes are used, to increase entropy, and or induce historical complexity.
*/
import {
	encode, encodeStrict, encodeStrictSync, encodeSync,
} from '#utilities/serialize';
import { getKeyString, insertSortedBuffer } from './utils.js';
import { VIATHashTrie } from './hashTrie.js';
import { assign } from '@universalweb/utilitylib';
import { hash256 } from '#crypto/hash/shake256.js';
import { randomBuffer } from '#crypto/utils.js';
// ParallelHashXOF256
// Sort keys and arrays before hashing OR use CBOR encode Strict for deterministic encoding then hashing
// Compare trie hashes for hash differences with different insertion order to confirm CBOR encoding is correct
function consoleLog(...args) {
	// console.log(...args);
}
//  TODO:Change array into MAP for hash lists will be consistent with rest of trie and faster abstract lookups
// Control the shape of the trie by adjusting how many possible keys there are each level
const encodingLevels = {
	// Initial branch has 256 possible keys (8 bits)
	0(value) {
		// 1 key
		return 0;
	},
	1(value) {
		if (value < 2) {
			return value;
		}
		// 2 keys
		return value >> 7;
	},
	2(value) {
		// 4 keys
		if (value < 4) {
			return value;
		}
		return value >> 6;
	},
	3(value) {
		// 64 keys
		if (value < 64) {
			return value;
		}
		return value >> 2;
	},
	4(value) {
		// 2 keys
		if (value < 2) {
			return value;
		}
		return value >> 7;
	},
	5(value) {
		// 2 keys
		if (value < 2) {
			return value;
		}
		return value >> 7;
	},
};
/*
	High - Low - Mid
	--> ->
	-->    ->
	--> -> ->
	-->    ->
	--> ->
*/
async function computeNodeHash(nodes, source) {
	const hashes = [];
	const nodeKeys = Object.keys(nodes);
	const keysLength = nodeKeys.length;
	if (keysLength === 0) {
		return;
	}
	for (let i = 0; i < keysLength; i++) {
		const key = nodeKeys[i];
		if (nodes[key]) {
			const nodeHash = await nodes[key].fullHash();
			if (nodeHash && nodeHash?.count !== 0) {
				insertSortedBuffer(hashes, nodeHash);
			}
		}
	}
	console.log('Keys length:', keysLength);
	if (!hashes.length) {
		return;
	}
	if (hashes.length === 1) {
		// console.dir(trie.trieMap, {
		// 	depth: 1,
		// });
		// throw (1);
		if (source.root) {
			source.root.hashingAvoided++;
		} else {
			source.hashingAvoided++;
		}
		return hashes[0];
	}
	if (source.root) {
		source.root.hashingDone++;
	} else {
		source.hashingDone++;
	}
	const concatenatedHashes = await encode(hashes);
	consoleLog('HASHING DONE', hashes.length, source.key, source.bytePosition);
	const hash = await hash256(concatenatedHashes);
	source.trieMap.set('hash', hash);
	return hash;
}
class Base {
	constructor(...args) {
		return this;
	}
	async tracePath(key) {
		const paths = key.split('.');
		const pathsLength = paths.length;
		let currentNode = this;
		const trace = [];
		for (let i = 0; i < pathsLength; i++) {
			const pathKey = paths[i];
			if (currentNode.nodes[pathKey]) {
				currentNode = currentNode.nodes[pathKey];
				trace.push(currentNode);
			} else {
				return trace;
			}
		}
		return trace;
	}
	async getPath(key) {
		const paths = key.split('.');
		const pathsLength = paths.length;
		let currentNode = this;
		for (let i = 0; i < pathsLength; i++) {
			const pathKey = paths[i];
			consoleLog(currentNode, pathKey);
			if (currentNode.nodes[pathKey]) {
				currentNode = currentNode.nodes[pathKey];
			} else {
				return;
			}
		}
		return currentNode;
	}
	async getBucket(hash) {
		const path = hash.subarray(this.bytePosition, this.maxIndex + 1);
		const pathLength = path.length;
		let currentNode = this;
		console.log(`Path: ${path} ${pathLength} ${this.bytePosition} ${this.maxIndex}`);
		for (let i = 0; i < pathLength; i++) {
			const key = this.encodingLevels[i](path[i]);
			console.log(`Key: ${key} at index ${i}`);
			currentNode = currentNode.nodes[key];
			if (!currentNode) {
				break;
			}
			if (currentNode.isBucket) {
				return currentNode;
			}
			continue;
		}
		return false;
	}
	async hasHash(hash) {
		const bucket = await this.getBucket(hash);
		if (!bucket) {
			return false;
		}
		const list = bucket.list;
		const listLength = list.length;
		for (let i = 0; i < listLength; i++) {
			if (list[i].equals(hash)) {
				return true;
			}
		}
		return false;
	}
	bytePosition = 0;
	nodes = {};
	trieMap = new Map();
	levelIndex = new Map();
	stale = true;
	hash = undefined;
	maxIndex = 5;
	encodingLevels = encodingLevels;
	count = 0;
	hashes = new Map();
	list = [];
	branchCount = 0;
	bucketCount = 0;
	printStats() {
		console.log(`Branch Count: ${this.branchCount}`);
		console.log(`Bucket Count: ${this.bucketCount}`);
	}
}
class Bucket extends Base {
	constructor(...args) {
		super(...args);
		if (args.length) {
			return this.init(...args);
		}
		return this;
	}
	async init(key, bytePosition, parentBranch) {
		this.key = key;
		this.bytePosition = bytePosition;
		this.parent = parentBranch;
		this.root = parentBranch.root || parentBranch;
		this.maxIndex = parentBranch.maxIndex;
		this.toKey = this.encodingLevels[bytePosition];
		const trieMap = new Map();
		this.trieMap = trieMap;
		trieMap.set('list', this.list);
		this.parent.bucketCount++;
		if (this.root) {
			this.root.totalBucketCount++;
		}
		return this;
	}
	async append(hash) {
		consoleLog('ViatSyncBucket', hash);
		const hashKeyString = getKeyString(hash);
		if (this.hashes.has(hashKeyString)) {
			consoleLog(`Hash ${hashKeyString} already exists in this branch`);
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
		consoleLog(`Removing hash ${hashKeyString}@${index}`);
		if (index === undefined) {
			consoleLog(`Hash ${hashKeyString}@${index} not found in this branch`);
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
		if (this.hash && !this.stale) {
			consoleLog('Returning cached hash');
			return this.hash;
		}
		if (this.list.length === 1) {
			this.hash = this.list[0];
			this.root.hashingAvoided++;
			this.stale = false;
			return this.list[0];
		} else if (this.list.length === 0) {
			this.parent.trieMap.delete(this.key);
			return undefined;
		}
		// NOTE: Self sourted so encodeStrict is likely not needed
		const concatenatedHashes = await encodeStrict(this.list);
		this.hash = await hash256(concatenatedHashes);
		this.root.hashingDone++;
		this.stale = false;
		return this.hash;
	}
	isBucket = true;
}
class Branch extends Base {
	constructor(...args) {
		super(...args);
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
		this.trieMap = new Map();
		this.root = parentSource.root || parentSource;
		this.toKey = this.encodingLevels[bytePosition];
		this.parent.branchCount++;
		if (this.root) {
			this.root.totalBranchCount++;
		}
		return this;
	}
	async append(hash) {
		const bytePosition = this.bytePosition + 1;
		const key = this.encodingLevels[bytePosition](hash[bytePosition]);
		if (!this.nodes[key]) {
			consoleLog(`Creating new bucket for key ${key} index ${bytePosition} with hash ${hash.toString('base64')}`);
			const ConstructorBranch = (bytePosition === this.maxIndex) ? Bucket : Branch;
			this.nodes[key] = await (new ConstructorBranch(key, bytePosition, this));
		}
		if (!this.trieMap.has(key)) {
			this.trieMap.set(key, this.nodes[key].trieMap);
		}
		const appendInfo = await this.nodes[key].append(hash);
		if (appendInfo) {
			consoleLog(`Appending to existing bucket for key ${key} index ${bytePosition} with hash ${hash.toString('base64')}`);
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
		const key = this.encodingLevels[bytePosition](hash[bytePosition]);
		if (!this.nodes[key] || !this.trieMap.has(key)) {
			return;
		}
		consoleLog(`Removing from bucket for key ${key}@${bytePosition} with hash ${hash.toString('base64')}`);
		const removalInfo = await this.nodes[key].remove(hash);
		if (removalInfo?.source?.count === 0) {
			this.trieMap.delete(key);
			this.count--;
			return {
				source: this,
			};
		}
	}
	async setValue(hash, value) {
		const bytePosition = this.bytePosition + 1;
		const key = this.encodingLevels[bytePosition](hash[bytePosition]);
		if (!this.nodes[key]) {
			return;
		}
		await this.nodes[key].setValue(hash, value);
	}
	async fullHash() {
		if (this.hash && !this.stale) {
			consoleLog('Returning cached hash');
			return this.hash;
		}
		const hash = await computeNodeHash(this.nodes, this);
		this.hash = hash;
		// this.trieMap.set('hash', this.hash);
		this.stale = false;
		return hash;
	}
	isBranch = true;
}
class ViatSyncTrie extends Base {
	constructor(config) {
		super();
		this.hashTrie = new VIATHashTrie();
		if (config) {
			assign(this, config);
		}
		return this;
	}
	async append(sourceHash) {
		const hash = sourceHash;
		const bytePosition = this.bytePosition;
		const key = this.toKey(hash[bytePosition]);
		if (!this.nodes[key]) {
			consoleLog(`Creating new branch for key ${key} with hash ${hash.toString('base64')}`);
			this.nodes[key] = await (new Branch(this.toKey(hash[bytePosition]), this.bytePosition, this));
		}
		if (this.nodes[key]) {
			if (!this.trieMap.has(key)) {
				this.trieMap.set(key, this.nodes[key].trieMap);
			}
			consoleLog(`Appending to existing branch for key ${key} with hash ${hash.toString('base64')}`);
			const appendInfo = await this.nodes[key].append(hash);
			if (appendInfo) {
				this.stale = true;
				this.count++;
				return {
					source: this,
					index: appendInfo.index,
				};
			}
		}
	}
	async remove(hash) {
		const bytePosition = this.bytePosition;
		const key = this.toKey(hash[bytePosition]);
		if (!this.nodes[key]) {
			return;
		}
		consoleLog(`Removing from branch for key ${key}@${bytePosition} with hash ${hash.toString('base64')}`);
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
			consoleLog('Returning cached hash');
			return this.hash;
		}
		this.hashingAvoided = 0;
		this.hashingDone = 1;
		const hash = await computeNodeHash(this.nodes, this);
		this.hash = await hash256(hash);
		this.trieMap.set('hash', this.hash);
		this.stale = false;
		return this.hash;
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
	setValue(hash, value) {
		const key = this.toKey(hash[this.bytePosition]);
		if (!this.nodes[key]) {
			return;
		}
		return this.nodes[key].setValue(hash, value);
	}
	computeHashPath(hash) {
		const key = this.toKey(hash[this.bytePosition]);
		if (!this.nodes[key]) {
			return [];
		}
		return this.nodes[key].computeHashPath(hash);
	}
	toKey = encodingLevels[0];
	isRoot = true;
	totalBranchCount = 0;
	totalBucketCount = 0;
	async printStats() {
		console.log('TOTAL HASH', await this.fullHash());
		console.log(`Total Hash Count: ${this.count}`);
		console.log(`Total Branch Count: ${this.totalBranchCount}`);
		console.log(`Total Bucket Count: ${this.totalBucketCount}`);
		console.log(`Total hash work reduced to ${Math.floor((this.hashingDone / this.count) * 100)}%`);
		console.log(`Total Hashing done ${this.hashingDone}`);
		console.log(`Total Hashing avoided ${this.hashingAvoided}`);
	}
}
async function exampleTest() {
	const trie = new ViatSyncTrie();
	// const hashExample = Buffer.from('TES');
	// const hash2Example = Buffer.from('TEG');
	// const hash3Example = Buffer.from('TEB');
	// const hash4Example = Buffer.from('AEB');
	// await trie.append(hashExample);
	// await trie.append(hash2Example);
	// await trie.append(hash3Example);
	// await trie.append(hash4Example);
	// await trie.remove(hash4Example);
	// await trie.append(hash4Example);
	// await trie.remove(hash4Example);
	for (let i = 0; i < 60_000; i++) {
		await trie.append(await hash256(await randomBuffer(32)));
	}
	// consoleLog(findNextCollisionIndex([
	// 	hashExample, hash2Example, hash3Example,
	// ], 0, hashExample.length).prefix.toString());
	// consoleLog(await trie.fullHash());
	// consoleLog(await trie.fullHash());
	// consoleLog(await trie.fullHash());
	// consoleLog(await trie.exportFinalizedTree());
	// const viatTrie = await viatHashTrie();
	// await viatTrie.append(hashExample);
	// await viatTrie.append(hash2Example);
	// await viatTrie.append(hash3Example);
	// consoleLog(await viatTrie.getHash());
	// await viatTrie.append(hash4Example);
	// const TEBranch = await trie.getBranch('T.E');
	// consoleLog(TEBranch);
	// consoleLog(TEBranch.getObject());
	await trie.fullHash();
	console.dir(trie.trieMap, {
		depth: 10,
	});
	await trie.printStats();
	await trie.append(await hash256(await randomBuffer(32)));
	await trie.printStats();
	// console.log((await trie.getBucket(hashExample)).list);
	// console.log((await trie.hasHash(Buffer.from('TE'))));
	// console.log(encodeStrictSync(trie.trieMap).length);
	// console.log(trie.nodes);
	// console.log(hashExample, hash2Example, hash3Example, hash4Example);
	// console.log(hashExample[2]);
	// console.dir(trie, {
	// 	depth: 8,
	// });
}
await exampleTest();
