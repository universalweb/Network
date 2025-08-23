import {
	isBuffer, isPlainObject, isString, merge,
} from '@universalweb/utilitylib';
import { LRUCache } from 'lru-cache';
import lmdb from 'lmdb';
import { readStructured } from '#utilities/file';
import { toBase64Url } from '#crypto/utils.js';
/**
 * Unified storage for Viat blocks (plain JS objects).
 * - Blocks are plain objects; the block.hash property is the canonical 64-byte Buffer.
 * - Only the first 32 bytes of the 64-byte hash are used for LMDB and cache keys.
 * - Cache key is base64url of those 32 bytes.
 */
// TODO: CHECK BLOCK AGE - CHECK BLOCK'S AUDIT BLOCK REFERENCE -> DICTATE STRATEGY CACHE LMDB or FS
export class UnifiedStorage {
	/**
	 * @param {object} options
	 * @param {string} options.path - LMDB path (optional: instance can work cache-only).
	 * @param {number} [options.maxCacheSize=5000]
	 * @param {string} [options.dbName='viat']
	 */
	constructor(config = {}) {
		merge(this, config);
		const {
			dbPath: path,
			maxCacheSize,
			dbName,
		} = this;
		this.cache = new LRUCache({
			max: maxCacheSize,
		});
		this.db = null;
		if (path) {
			try {
				this.db = lmdb.open({
					path,
					name: dbName,
					compression: true,
				});
			} catch (e) {
				// fail gracefully -> operate as cache-only
				this.db = null;
			}
		}
	}
	/**
	 * Build dbKey (first 32 bytes Buffer) and cacheKey (base64url string) from a key Buffer.
	 * Upstream is expected to ensure key is a valid 64-byte Buffer.
	 * Returns { dbKey, cacheKey } or undefined on error.
	 * @param {Buffer} key
	 */
	hashToKeys(key) {
		const dbKey = key.slice(0, 32);
		const cacheKey = toBase64Url(dbKey);
		return {
			dbKey,
			cacheKey,
		};
	}
	/**
	 * Helper to resolve the key Buffer to use:
	 * prefer explicitKey if provided, otherwise try block.hash.
	 * Returns { keyBuffer, dbKey, cacheKey } or undefined.
	 * @param {object|undefined} block
	 * @param {Buffer|undefined} explicitKey
	 */
	resolveKeys(block) {
		return {
			cacheKey: this.getCacheKey(block),
			dbKey: this.getDBKey(block),
		};
	}
	getKeyFromHash(key) {
		return key.subarray(0, 32);
	}
	getEncodedKey(key) {
		if (isString(key) && key.length === 32) {
			return key;
		}
		return toBase64Url(this.getKeyFromHash(key));
	}
	getDBKey(source) {
		if (isPlainObject(source) && isBuffer(source.hash)) {
			return this.getKeyFromHash(source.hash);
		}
		if (isBuffer(source)) {
			return this.getKeyFromHash(source);
		}
		return;
	}
	getCacheKey(source) {
		if (isString(source)) {
			return source;
		}
		if (isPlainObject(source) && isBuffer(source.hash)) {
			return this.getEncodedKey(source.hash);
		}
		if (isBuffer(source)) {
			if (source.length === 64) {
				return this.getEncodedKey(source);
			} else if (source.length === 32) {
				return toBase64Url(source);
			}
			return;
		}
		return;
	}
	/**
	 * Get a Viat block by 64-byte key Buffer (pass key as first arg).
	 * Returns the stored plain object or undefined.
	 * @param {Buffer} key
	 */
	// TODO: GET BY BUFFER OR STRING
	async get(source) {
		const key = this.resolveKeys(source);
		if (!key) {
			return;
		}
		const {
			dbKey,
			cacheKey,
		} = key;
		// Try cache first
		const cached = this.cache.get(cacheKey);
		if (isPlainObject(cached)) {
			return cached;
		}
		// Try DB
		if (!this.db) {
			return;
		}
		try {
			const dbValue = await this.db.get(dbKey);
			if (!isPlainObject(dbValue)) {
				return;
			}
			this.cache.set(cacheKey, dbValue);
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
	set(block, key) {
		const resolvedKey = key || this.getCacheKey(block);
		if (!resolvedKey) {
			return;
		}
		this.cache.set(resolvedKey, block);
		return;
	}
	/**
	 * Save a Viat block to LMDB (and update cache).
	 * Usage: save(block, key?) - key optional.
	 * Returns undefined on failure.
	 * @param {object} block
	 * @param {Buffer} [key]
	 */
	async save(block, key) {
		const resolved = key || this.resolveKeys(block, key);
		if (!resolved) {
			return;
		}
		const {
			dbKey,
			cacheKey,
		} = resolved;
		if (!this.db) {
			return;
		}
		try {
			await this.db.put(dbKey, block);
			this.cache.set(cacheKey, block);
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
		const key = this.resolveKeys(source);
		// Remove from cache
		try {
			await this.cache.delete(key.cacheKey);
		} catch {}
		// Remove from DB if available
		if (!this.db) {
			return;
		}
		try {
			await this.db.remove(key.dbKey);
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
	maxCacheSize = 5000;
	dbName = 'viat';
}
