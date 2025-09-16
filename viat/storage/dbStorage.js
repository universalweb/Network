import {
	isBuffer,
	isPlainObject,
	isString,
	merge,
} from '@universalweb/utilitylib';
import { randomBuffer, toBase64Url } from '#crypto/utils.js';
import { LRUCache } from 'lru-cache';
import { getViatDirectory } from '#utilities/directory';
import lmdb from 'lmdb';
import { readStructured } from '#utilities/file';
const defaultPath = await getViatDirectory();
/**
 * Unified storage for Viat blocks (plain JS objects).
 * - Blocks are plain objects; the block.hash property is the canonical 64-byte Buffer.
 * - Only the first 32 bytes of the 64-byte hash are used for LMDB and cache keys.
 * - Cache key is base64url of those 32 bytes.
 */
// TODO: CHECK BLOCK AGE - CHECK BLOCK'S AUDIT BLOCK REFERENCE -> DICTATE STRATEGY CACHE LMDB or FS
export class DBStorage {
	/**
	 * @param {object} options
	 * @param {string} options.path - LMDB path (optional: instance can work cache-only).
	 * @param {number} [options.maxCacheSize=5000]
	 * @param {string} [options.dbName='viat']
	 */
	constructor(config = {}) {
		merge(this, config);
		return this.initialize();
	}
	async initialize() {
		const {
			dbPath,
			cacheConfig,
			dbName,
		} = this;
		this.cache = await (new LRUCache(cacheConfig));
		this.db = null;
		if (dbPath) {
			try {
				this.db = await lmdb.open({
					path: dbPath,
					name: dbName,
					compression: false,
				});
			} catch (e) {
				// fail gracefully -> operate as cache-only
				this.db = null;
			}
		}
		return this;
	}
	getKeyFromHash(key) {
		return key.subarray(0, 32);
	}
	getEncodedKey(key) {
		if (isString(key)) {
			return key;
		}
		return toBase64Url(key);
	}
	/**
	 * Get a Viat block by 64-byte key Buffer (pass key as first arg).
	 * Returns the stored plain object or undefined.
	 * @param {Buffer} key
	 */
	// TODO: GET BY BUFFER OR STRING
	async get(source) {
		const key = this.getKeyFromHash(source);
		console.log(key);
		if (!key) {
			return;
		}
		const cacheKey = this.getEncodedKey(key);
		// Try cache first
		const cached = await this.cache.get(cacheKey);
		console.log('CACHED', cacheKey, cached);
		if (cached) {
			return cached;
		}
		// Try DB
		if (!this.db) {
			return;
		}
		try {
			const dbValue = await this.db.get(key);
			if (!isPlainObject(dbValue)) {
				return;
			}
			await this.cache.set(cacheKey, dbValue);
			return dbValue;
		} catch (e) {
			return;
		}
	}
	/**
	 * Cache a Viat block (plain object). Does not persist to LMDB.
	 * Usage: set(block, key?) - key is optional.
	 * Returns undefined on failure.
	 * @param {object} block
	 * @param {Buffer} [key]
	 */
	async set(key, value) {
		const resolvedKey = this.getKeyFromHash(key);
		const cacheKey = this.getEncodedKey(resolvedKey);
		console.log('SET KEY', cacheKey, value);
		console.log('SET RESULT', await this.cache.set(cacheKey, value));
		return;
	}
	/**
	 * Save a Viat block to LMDB (and update cache).
	 * Usage: save(block, key?) - key optional.
	 * Returns undefined on failure.
	 * @param {object} block
	 * @param {Buffer} [key]
	 */
	async save(key, block) {
		const resolvedKey = this.getKeyFromHash(key);
		if (!resolvedKey) {
			return;
		}
		if (!this.db) {
			return;
		}
		const cacheKey = this.getEncodedKey(resolvedKey);
		try {
			await this.db.put(resolvedKey, block);
			await this.cache.set(cacheKey, block);
		} catch (e) {
			return;
		}
		return;
	}
	/**
	 * Delete entry from cache and LMDB.
	 * Accepts a single identifier which can be:
	 * - base64url string (cacheKey of first 32 bytes)
	 * - Buffer (64-byte full hash or 32-byte db key)
	 * - Object with a .hash Buffer (64- or 32-byte).
	 *
	 * Returns undefined and fails gracefully on invalid input / errors.
	 * @param {string|Buffer|object} identifier
	 */
	async delete(source) {
		const resolvedKey = this.getKeyFromHash(source);
		const cacheKey = this.getEncodedKey(resolvedKey);
		// Remove from cache
		try {
			await this.cache.delete(cacheKey);
		} catch {}
		// Remove from DB if available
		if (!this.db) {
			return;
		}
		try {
			await this.db.remove(resolvedKey);
		} catch {}
		return;
	}
	/**
	 * Close LMDB (if open) and clear cache.
	 */
	async close() {
		try {
			if (this.db) {
				await this.db.close();
			}
		} catch (e) {
			// ignore
		}
		await this.cache.clear();
	}
	dbName = 'viat';
	dbPath = defaultPath;
	// TODO: Cache config for testing only change for production
	cacheConfig = {
		max: 10000,
		ttl: 1000 * 60 * 60,
		ttlResolution: 1000 * 60,
		updateAgeOnGet: true,
		updateAgeOnHas: true,
		allowStale: true,
	};
}
export async function dbStorage(...args) {
	const source = await (new DBStorage(...args));
	return source;
}
export default DBStorage;
// const exampleStorage = await dbStorage();
// console.log('UNIFIED STORAGE', exampleStorage.db);
// const exampleKey = randomBuffer(64);
// const exampleValue = 'example-VALUE111';
// console.log(exampleKey.subarray(0, 32).length, exampleKey.length);
// console.log(await exampleStorage.set(exampleKey, exampleValue));
// console.log(await exampleStorage.cache.set(exampleKey, exampleValue));
// console.log('manual get', await exampleStorage.cache.get(exampleKey));
// console.log(await exampleStorage.get(exampleKey));
