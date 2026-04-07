import { Decoder, Encoder } from 'cbor-x';
import { isString } from '@universalweb/utilitylib';
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const defaultEncoder = new Encoder({
	useRecords: true,
});
const defaultDecoder = new Decoder();
function toUint8Array(source) {
	if (source instanceof Uint8Array) {
		return source;
	}
	if (source instanceof ArrayBuffer) {
		return new Uint8Array(source);
	}
	if (ArrayBuffer.isView(source)) {
		return new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
	}
	if (isString(source)) {
		return textEncoder.encode(source);
	}
	throw new TypeError('Expected Uint8Array, ArrayBuffer, TypedArray, or string');
}
function toArrayBuffer(source) {
	const bytes = toUint8Array(source);
	return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}
export class BrowserStorage {
	constructor(options = {}) {
		this.directory = options.directory || 'viat';
		this.extension = options.extension || '.cbor';
		this.dbName = options.dbName || 'viat-browser-storage';
		this.storeName = options.storeName || 'entries';
		this.requestPersistentStorage = options.requestPersistentStorage !== false;
		this.encoder = options.encoder || defaultEncoder;
		this.decoder = options.decoder || defaultDecoder;
		this.mode = 'uninitialized';
		this.db = undefined;
		this.rootHandle = undefined;
		this.directoryHandle = undefined;
		this.isPersistent = false;
	}
	async initialize() {
		this.isPersistent = await this.persist();
		if (await this.supportsOPFS()) {
			this.rootHandle = await navigator.storage.getDirectory();
			this.directoryHandle = await this.#getDirectoryHandle(this.rootHandle, this.directory);
			this.mode = 'opfs';
			return this;
		}
		this.db = await this.#openDatabase();
		this.mode = 'indexeddb';
		return this;
	}
	async persist() {
		if (!globalThis.navigator?.storage) {
			return false;
		}
		try {
			if (typeof navigator.storage.persisted === 'function') {
				const alreadyPersisted = await navigator.storage.persisted();
				if (alreadyPersisted) {
					return true;
				}
			}
			if (!this.requestPersistentStorage || typeof navigator.storage.persist !== 'function') {
				return false;
			}
			return Boolean(await navigator.storage.persist());
		} catch {
			return false;
		}
	}
	async supportsOPFS() {
		return Boolean(globalThis.navigator?.storage?.getDirectory);
	}
	encode(value) {
		return this.encoder.encode(value);
	}
	decode(bytes) {
		return this.decoder.decode(bytes);
	}
	async set(key, value) {
		const bytes = this.encode(value);
		await this.setRaw(key, bytes);
		return bytes;
	}
	async get(key) {
		const bytes = await this.getRaw(key);
		if (!bytes) {
			return;
		}
		return this.decode(bytes);
	}
	async setRaw(key, value) {
		const bytes = toUint8Array(value);
		if (this.mode === 'opfs') {
			await this.#writeOPFSFile(key, bytes);
			return bytes;
		}
		await this.#idbPut(key, bytes);
		return bytes;
	}
	async getRaw(key) {
		if (this.mode === 'opfs') {
			return this.#readOPFSFile(key);
		}
		return this.#idbGet(key);
	}
	async setText(key, value) {
		return this.setRaw(key, textEncoder.encode(value));
	}
	async getText(key) {
		const bytes = await this.getRaw(key);
		if (!bytes) {
			return;
		}
		return textDecoder.decode(bytes);
	}
	async has(key) {
		if (this.mode === 'opfs') {
			try {
				await this.directoryHandle.getFileHandle(this.#toFileName(key));
				return true;
			} catch (error) {
				if (error?.name === 'NotFoundError') {
					return false;
				}
				throw error;
			}
		}
		return this.#idbHas(key);
	}
	async delete(key) {
		if (this.mode === 'opfs') {
			try {
				await this.directoryHandle.removeEntry(this.#toFileName(key));
			} catch (error) {
				if (error?.name !== 'NotFoundError') {
					throw error;
				}
			}
			return;
		}
		await this.#idbDelete(key);
	}
	async keys() {
		if (this.mode === 'opfs') {
			const keys = [];
			for await (const entry of this.directoryHandle.values()) {
				if (entry.kind !== 'file') {
					continue;
				}
				const key = this.#fromFileName(entry.name);
				if (key !== undefined) {
					keys.push(key);
				}
			}
			return keys;
		}
		return this.#idbKeys();
	}
	async clear() {
		if (this.mode === 'opfs') {
			const keys = await this.keys();
			await Promise.all(keys.map((key) => {
				return this.delete(key);
			}));
			return;
		}
		await this.#idbClear();
	}
	async estimate() {
		if (!globalThis.navigator?.storage?.estimate) {
			return;
		}
		return navigator.storage.estimate();
	}
	async close() {
		if (this.db) {
			this.db.close();
			this.db = undefined;
		}
	}
	async #getDirectoryHandle(rootHandle, directoryPath) {
		let handle = rootHandle;
		for (const segment of directoryPath.split('/').filter(Boolean)) {
			handle = await handle.getDirectoryHandle(segment, {
				create: true,
			});
		}
		return handle;
	}
	#toFileName(key) {
		return `${encodeURIComponent(String(key))}${this.extension}`;
	}
	#fromFileName(fileName) {
		if (!fileName.endsWith(this.extension)) {
			return;
		}
		return decodeURIComponent(fileName.slice(0, -this.extension.length));
	}
	async #writeOPFSFile(key, bytes) {
		const fileHandle = await this.directoryHandle.getFileHandle(this.#toFileName(key), {
			create: true,
		});
		const writable = await fileHandle.createWritable({
			keepExistingData: false,
		});
		try {
			await writable.write(bytes);
		} finally {
			await writable.close();
		}
	}
	async #readOPFSFile(key) {
		try {
			const fileHandle = await this.directoryHandle.getFileHandle(this.#toFileName(key));
			const file = await fileHandle.getFile();
			return new Uint8Array(await file.arrayBuffer());
		} catch (error) {
			if (error?.name === 'NotFoundError') {
				return;
			}
			throw error;
		}
	}
	#openDatabase() {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.dbName, 1);
			request.onupgradeneeded = () => {
				const db = request.result;
				if (!db.objectStoreNames.contains(this.storeName)) {
					db.createObjectStore(this.storeName);
				}
			};
			request.onsuccess = () => {
				resolve(request.result);
			};
			request.onerror = () => {
				reject(request.error);
			};
		});
	}
	#idbTransaction(mode, callback) {
		return new Promise((resolve, reject) => {
			const transaction = this.db.transaction(this.storeName, mode);
			const store = transaction.objectStore(this.storeName);
			let request;
			try {
				request = callback(store);
			} catch (error) {
				reject(error);
				return;
			}
			transaction.oncomplete = () => {
				resolve(request?.result);
			};
			transaction.onerror = () => {
				reject(transaction.error || request?.error);
			};
			transaction.onabort = () => {
				reject(transaction.error || request?.error);
			};
		});
	}
	async #idbPut(key, value) {
		return this.#idbTransaction('readwrite', (store) => {
			return store.put(toArrayBuffer(value), String(key));
		});
	}
	async #idbGet(key) {
		const result = await this.#idbTransaction('readonly', (store) => {
			return store.get(String(key));
		});
		if (!result) {
			return;
		}
		return new Uint8Array(result);
	}
	async #idbHas(key) {
		const result = await this.#idbTransaction('readonly', (store) => {
			return store.getKey(String(key));
		});
		return result !== undefined;
	}
	async #idbDelete(key) {
		return this.#idbTransaction('readwrite', (store) => {
			return store.delete(String(key));
		});
	}
	async #idbKeys() {
		const result = await this.#idbTransaction('readonly', (store) => {
			return store.getAllKeys();
		});
		return result.map((key) => {
			return String(key);
		});
	}
	async #idbClear() {
		return this.#idbTransaction('readwrite', (store) => {
			return store.clear();
		});
	}
}
export async function browserStorage(options) {
	return new BrowserStorage(options).initialize();
}
export default BrowserStorage;
