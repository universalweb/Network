import { decode, encode } from './cbor.js';
import {
	decodeText,
	fromBase64,
	isBlobLike,
	textToBuffer,
	toBase64,
	toBuffer,
	toUint8Array,
} from './utils.js';
import {
	eachObject,
	hasValue,
	isArray,
	isPlainObject,
	isString,
} from '@universalweb/utilitylib';
import { HDSeed } from '#viat/hdSeed/index';
import { argon2id } from 'hash-wasm';
import { shake256 } from '@noble/hashes/sha3.js';
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
const XCHACHA_KEY_SIZE = 32;
const XCHACHA_NONCE_SIZE = 24;
const WALLET_CIPHER_ALGORITHM = 'XChaCha20-Poly1305';
const fallbackArgonConfig = {
	parallelism: 1,
	iterations: 256,
	memorySize: 512,
	hashLength: 32,
	saltLength: 32,
};
function isBinaryStateKey(key) {
	return key === 'master_seed' || key === 'master_key' || key === 'master_nonce' || key === 'master_salt';
}
function getWalletClassConfig(source) {
	const classRef = source?.constructor;
	return {
		WALLET_SAVE_KIND: classRef?.WALLET_SAVE_KIND || 'wallet.viat',
		WALLET_SAVE_VERSION: classRef?.WALLET_SAVE_VERSION || 1,
		DEFAULT_WALLET_NAME: classRef?.DEFAULT_WALLET_NAME || 'wallet',
		DEFAULT_WALLET_STORAGE_KEY: classRef?.DEFAULT_WALLET_STORAGE_KEY || 'viat.wallet',
		DEFAULT_ARGON_CONFIG: classRef?.DEFAULT_ARGON_CONFIG || fallbackArgonConfig,
	};
}
export function getWalletDefaults() {
	return getWalletClassConfig(this);
}
export function normalizeWalletSeeds(source = {}) {
	const seed = source?.seed ? toBuffer(source.seed) : undefined;
	const trapdoorSource = source?.trapdoorSeed || source?.trapdoor;
	const trapdoorSeed = trapdoorSource ? toBuffer(trapdoorSource) : undefined;
	const target = {};
	if (seed) {
		target.seed = seed;
	}
	if (trapdoorSeed) {
		target.trapdoorSeed = trapdoorSeed;
		target.trapdoor = trapdoorSeed;
	}
	return target;
}
export function normalizeHdState(source = {}) {
	const target = {};
	eachObject(source || {}, (value, key) => {
		target[key] = (isBinaryStateKey(key) && value) ? toBuffer(value) : value;
	});
	return target;
}
export function normalizeWalletSecret(source = {}) {
	const walletSeeds = this.normalizeWalletSeeds(source?.walletSeeds || source?.seedData || source);
	const hdStateSource = source?.hdState || source?.STATE || source?.hdSeedState;
	const hdState = hdStateSource ? this.normalizeHdState(hdStateSource) : undefined;
	return {
		walletSeeds,
		hdState,
		savedAt: source?.savedAt || source?.createdAt || new Date().toISOString(),
		walletType: source?.walletType || 'site',
	};
}
export function normalizeMeta(source) {
	if (!hasValue(source)) {
		return source;
	}
	if (typeof source === 'bigint') {
		return source.toString();
	}
	if (source instanceof Date) {
		return source.toISOString();
	}
	if (isString(source) || typeof source === 'number' || typeof source === 'boolean') {
		return source;
	}
	if (source instanceof Uint8Array || source instanceof ArrayBuffer || ArrayBuffer.isView(source)) {
		return toBase64(source);
	}
	if (isArray(source)) {
		const target = new Array(source.length);
		for (let index = 0; index < source.length; index += 1) {
			target[index] = this.normalizeMeta(source[index]);
		}
		return target;
	}
	if (isPlainObject(source)) {
		const target = {};
		eachObject(source, (value, key) => {
			const normalizedValue = this.normalizeMeta(value);
			if (normalizedValue !== undefined) {
				target[key] = normalizedValue;
			}
		});
		return target;
	}
	return undefined;
}
export function canonicalizeMeta(source) {
	if (isArray(source)) {
		const target = new Array(source.length);
		for (let index = 0; index < source.length; index += 1) {
			target[index] = this.canonicalizeMeta(source[index]);
		}
		return target;
	}
	if (source && isPlainObject(source)) {
		const target = {};
		const keys = Object.keys(source).sort();
		for (let index = 0; index < keys.length; index += 1) {
			const key = keys[index];
			target[key] = this.canonicalizeMeta(source[key]);
		}
		return target;
	}
	return source;
}
export function cleanupMeta(source = {}) {
	const target = {};
	eachObject(source, (value, key) => {
		if (value !== undefined) {
			target[key] = value;
		}
	});
	return target;
}
export function getCrypto() {
	const cryptoAPI = globalThis.crypto;
	if (!cryptoAPI?.getRandomValues) {
		throw new Error('A crypto.getRandomValues source is required to save or load wallet seed data.');
	}
	return cryptoAPI;
}
export function randomBytes(size) {
	const target = new Uint8Array(size);
	this.getCrypto().getRandomValues(target);
	return target;
}
export function assertUserInput(userInput) {
	if (!hasValue(userInput) || userInput === '') {
		throw new Error('User input is required to encrypt or decrypt wallet seed data.');
	}
}
export function resolvePasswordHashBypass(options = {}, meta = undefined) {
	if (typeof options?.bypassPasswordHash === 'boolean') {
		return options.bypassPasswordHash;
	}
	if (typeof options?.skipPasswordHash === 'boolean') {
		return options.skipPasswordHash;
	}
	if (typeof options?.skipArgon2id === 'boolean') {
		return options.skipArgon2id;
	}
	if (typeof options?.useArgon2id === 'boolean') {
		return options.useArgon2id === false;
	}
	if (meta?.password?.hashMode) {
		return meta.password.hashMode !== 'argon2id';
	}
	return false;
}
export function getArgonConfig(options = {}, meta = undefined) {
	const metaPassword = meta?.password || {};
	const defaults = this.getWalletDefaults().DEFAULT_ARGON_CONFIG;
	return {
		parallelism: options?.argonParallelism || options?.parallelism || metaPassword.parallelism || defaults.parallelism,
		iterations: options?.argonIterations || options?.iterations || metaPassword.iterations || defaults.iterations,
		memorySize: options?.argonMemorySize || options?.memorySize || metaPassword.memorySize || defaults.memorySize,
		hashLength: options?.argonHashLength || options?.hashLength || metaPassword.hashLength || defaults.hashLength,
		saltLength: options?.passwordSaltLength || options?.saltLength || metaPassword.saltLength || defaults.saltLength,
	};
}
export function toEncryptionKey(source) {
	const bytes = toUint8Array(source);
	if (bytes.byteLength === XCHACHA_KEY_SIZE) {
		return bytes;
	}
	return new Uint8Array(shake256(bytes, {
		dkLen: XCHACHA_KEY_SIZE,
	}));
}
export async function derivePasswordKey(userInput, salt, options = {}, meta = undefined) {
	this.assertUserInput(userInput);
	if (this.resolvePasswordHashBypass(options, meta)) {
		return this.toEncryptionKey(userInput);
	}
	const argonConfig = this.getArgonConfig(options, meta);
	const password = isString(userInput) ? userInput : toBase64(userInput);
	const hash = await argon2id({
		password,
		salt: toUint8Array(salt),
		parallelism: argonConfig.parallelism,
		iterations: argonConfig.iterations,
		memorySize: argonConfig.memorySize,
		hashLength: argonConfig.hashLength,
		outputType: 'binary',
	});
	return this.toEncryptionKey(hash);
}
export async function encodeAuthenticatedMeta(meta) {
	return toUint8Array(await encode(this.canonicalizeMeta(meta)));
}
export function getWalletLabel(options = {}) {
	const defaults = this.getWalletDefaults();
	const source = options?.label || options?.name || options?.fileName || defaults.DEFAULT_WALLET_NAME;
	return `${source}`.trim() || defaults.DEFAULT_WALLET_NAME;
}
export function getWalletBaseName(options = {}) {
	const defaults = this.getWalletDefaults();
	const baseName = this.getWalletLabel(options)
		.replace(/\.(cbor|json)\.wallet\.viat$/i, '')
		.replace(/[^a-z0-9.-]+/gi, '-')
		.replace(/^-+|-+$/g, '');
	return baseName || defaults.DEFAULT_WALLET_NAME;
}
export function getWalletStorageKey(options = {}) {
	const defaults = this.getWalletDefaults();
	if (options?.storageKey) {
		return options.storageKey;
	}
	const baseName = this.getWalletBaseName(options);
	if (baseName === defaults.DEFAULT_WALLET_NAME) {
		return defaults.DEFAULT_WALLET_STORAGE_KEY;
	}
	return `${defaults.DEFAULT_WALLET_STORAGE_KEY}.${baseName}`;
}
export function normalizeSaveFormat(source) {
	return `${source || 'cbor'}`.toLowerCase() === 'json' ? 'json' : 'cbor';
}
export function getWalletFileFormat(options = {}) {
	return this.normalizeSaveFormat(options?.fileFormat || options?.format || options?.encoding || 'cbor');
}
export function getWalletFileName(options = {}) {
	const baseName = this.getWalletBaseName(options);
	const format = this.getWalletFileFormat(options);
	return `${baseName}.${format}.wallet.viat`;
}
export function getWalletMimeType(format) {
	return format === 'json' ? 'application/json' : 'application/cbor';
}
export function encodePlainValue(source) {
	if (!hasValue(source)) {
		return undefined;
	}
	return isString(source) ? source : toBase64(source);
}
export async function ensureWalletSeeds() {
	const currentSeeds = this.normalizeWalletSeeds(await this.get('walletSeeds'));
	if (currentSeeds?.seed && (currentSeeds?.trapdoorSeed || currentSeeds?.trapdoor)) {
		await this.set('walletSeeds', currentSeeds);
		return currentSeeds;
	}
	const hdWalletInstance = await this.get('hdWalletInstance');
	if (hdWalletInstance?.getWalletSeed) {
		return this.createSiteWallet();
	}
	throw new Error('Wallet seed data is not initialized. Generate or load a wallet before saving it.');
}
export async function ensureWalletKeys() {
	await this.ensureWalletSeeds();
	const primaryKeypair = await this.get('primaryKeypair');
	const trapdoorKeypair = await this.get('trapdoorKeypair');
	if (!primaryKeypair?.publicKey || !trapdoorKeypair?.publicKey) {
		await this.setKeypairs();
	}
	if (!(await this.get('trapdoorHash'))) {
		await this.set('trapdoorHash', await this.getTrapdoorHash());
	}
	return this.get('walletSeeds');
}
export async function exportWalletSecret(options = {}) {
	const walletSeeds = this.normalizeWalletSeeds(await this.ensureWalletSeeds());
	const hdWalletInstance = await this.get('hdWalletInstance');
	let hdState;
	if (options?.includeHdState !== false && hdWalletInstance?.exportObject) {
		hdState = this.normalizeHdState(await hdWalletInstance.exportObject());
	}
	return {
		walletType: 'site',
		savedAt: new Date().toISOString(),
		walletSeeds,
		hdState,
	};
}
export async function getWalletMeta(options = {}) {
	const defaults = this.getWalletDefaults();
	await this.ensureWalletKeys();
	const primaryKeypair = await this.get('primaryKeypair');
	// `trapdoorKeypair.publicKey` (~1.3 KB) is regenerable from
	// `walletSeeds.trapdoorSeed` via `ml_dsa44.keygen`, so we omit it from the
	// saved meta. We still derive the trapdoor hash here because it's used for
	// the wallet address.
	const trapdoorHash = (await this.get('trapdoorHash')) || await this.getTrapdoorHash();
	const argonConfig = this.getArgonConfig(options);
	const hashMode = this.resolvePasswordHashBypass(options) ? 'provided' : 'argon2id';
	let address;
	try {
		address = await this.generateLegacyAddress();
	} catch {
		address = undefined;
	}
	const extra = this.normalizeMeta(options?.meta || options?.walletMeta);
	return this.cleanupMeta({
		app: 'viat',
		kind: defaults.WALLET_SAVE_KIND,
		version: defaults.WALLET_SAVE_VERSION,
		walletType: 'site',
		createdAt: options?.createdAt || new Date().toISOString(),
		label: this.getWalletLabel(options),
		address: this.encodePlainValue(address),
		publicKey: primaryKeypair?.publicKey ? toBase64(primaryKeypair.publicKey) : undefined,
		trapdoorHash: trapdoorHash ? toBase64(trapdoorHash) : undefined,
		password: {
			hashMode,
			parallelism: argonConfig.parallelism,
			iterations: argonConfig.iterations,
			memorySize: argonConfig.memorySize,
			hashLength: argonConfig.hashLength,
			saltLength: argonConfig.saltLength,
		},
		cipher: {
			algorithm: WALLET_CIPHER_ALGORITHM,
			nonceLength: XCHACHA_NONCE_SIZE,
			innerEncoding: 'cbor',
		},
		extra: extra && Object.keys(extra).length ? extra : undefined,
	});
}
export async function encryptWalletSecret(secret, meta, userInput, options = {}) {
	const salt = this.randomBytes(this.getArgonConfig(options, meta).saltLength);
	const nonce = this.randomBytes(XCHACHA_NONCE_SIZE);
	const keyBytes = await this.derivePasswordKey(userInput, salt, options, meta);
	const aad = await this.encodeAuthenticatedMeta(meta);
	const plaintext = toUint8Array(await encode(secret));
	const cipher = xchacha20poly1305(toUint8Array(keyBytes), nonce, aad);
	const data = cipher.encrypt(plaintext);
	return {
		salt,
		nonce,
		data,
	};
}
export async function decryptWalletSecret(walletPackage, userInput, options = {}) {
	const keyBytes = await this.derivePasswordKey(userInput, walletPackage.encrypted.salt, options, walletPackage.meta);
	const aad = await this.encodeAuthenticatedMeta(walletPackage.meta);
	const cipher = xchacha20poly1305(toUint8Array(keyBytes), toUint8Array(walletPackage.encrypted.nonce), aad);
	let decrypted;
	try {
		decrypted = cipher.decrypt(toUint8Array(walletPackage.encrypted.data));
	} catch {
		throw new Error('Unable to decrypt the saved wallet data. Wrong password or corrupted payload.');
	}
	return this.normalizeWalletSecret(await decode(toBuffer(decrypted)));
}
export function createWalletPackageShape(walletPackage, format) {
	const defaults = this.getWalletDefaults();
	return {
		kind: walletPackage.kind || defaults.WALLET_SAVE_KIND,
		version: walletPackage.version || defaults.WALLET_SAVE_VERSION,
		encoding: format,
		meta: walletPackage.meta,
		encrypted: {
			innerEncoding: walletPackage.encrypted?.innerEncoding || 'cbor',
			salt: format === 'json' ? toBase64(walletPackage.encrypted.salt) : toUint8Array(walletPackage.encrypted.salt),
			nonce: format === 'json' ? toBase64(walletPackage.encrypted.nonce) : toUint8Array(walletPackage.encrypted.nonce),
			data: format === 'json' ? toBase64(walletPackage.encrypted.data) : toUint8Array(walletPackage.encrypted.data),
		},
	};
}
export function normalizeWalletPackage(source = {}) {
	const encrypted = source?.encrypted;
	const nonceField = encrypted?.nonce;
	if (!encrypted?.data || !nonceField || !encrypted?.salt) {
		throw new Error('Invalid wallet package: encrypted seed data is missing.');
	}
	const defaults = this.getWalletDefaults();
	return {
		kind: source.kind || defaults.WALLET_SAVE_KIND,
		version: source.version || defaults.WALLET_SAVE_VERSION,
		encoding: this.normalizeSaveFormat(source.encoding),
		meta: this.cleanupMeta(this.normalizeMeta(source.meta || {})),
		encrypted: {
			innerEncoding: encrypted.innerEncoding || 'cbor',
			salt: isString(encrypted.salt) ? fromBase64(encrypted.salt) : toUint8Array(encrypted.salt),
			nonce: isString(nonceField) ? fromBase64(nonceField) : toUint8Array(nonceField),
			data: isString(encrypted.data) ? fromBase64(encrypted.data) : toUint8Array(encrypted.data),
		},
	};
}
export async function createWalletPackage(userInput, options = {}) {
	const defaults = this.getWalletDefaults();
	const secret = await this.exportWalletSecret(options);
	const meta = await this.getWalletMeta(options);
	const encrypted = await this.encryptWalletSecret(secret, meta, userInput, options);
	return {
		kind: defaults.WALLET_SAVE_KIND,
		version: defaults.WALLET_SAVE_VERSION,
		meta,
		encrypted: {
			innerEncoding: 'cbor',
			salt: encrypted.salt,
			nonce: encrypted.nonce,
			data: encrypted.data,
		},
	};
}
export async function serializeWalletPackage(walletPackage, format = 'json', options = {}) {
	const normalizedFormat = this.normalizeSaveFormat(format);
	const packageShape = this.createWalletPackageShape(walletPackage, normalizedFormat);
	if (normalizedFormat === 'json') {
		return JSON.stringify(packageShape, null, options?.prettyJson ? 2 : 0);
	}
	return encode(packageShape);
}
export function detectWalletFileFormat(source, options = {}) {
	const fileName = options?.file?.name || options?.fileName;
	if (fileName?.endsWith('.json.wallet.viat')) {
		return 'json';
	}
	if (fileName?.endsWith('.cbor.wallet.viat')) {
		return 'cbor';
	}
	const bytes = isString(source) ? textToBuffer(source) : toUint8Array(source);
	const text = decodeText(bytes).trimStart();
	if (text.startsWith('{')) {
		return 'json';
	}
	return this.getWalletFileFormat(options);
}
export async function deserializeWalletPackage(source, format, options = {}) {
	const normalizedFormat = this.normalizeSaveFormat(format || this.detectWalletFileFormat(source, options));
	if (normalizedFormat === 'json') {
		const text = isString(source) ? source : decodeText(toUint8Array(source));
		return this.normalizeWalletPackage(JSON.parse(text));
	}
	return this.normalizeWalletPackage(await decode(toBuffer(source)));
}
export async function readWalletFileSource(source) {
	if (isBlobLike(source)) {
		return new Uint8Array(await source.arrayBuffer());
	}
	if (source instanceof ArrayBuffer || ArrayBuffer.isView(source)) {
		return toUint8Array(source);
	}
	if (isString(source)) {
		return textToBuffer(source);
	}
	throw new Error('Unsupported wallet file source. Provide a File, Blob, ArrayBuffer, TypedArray, or raw text.');
}
export async function downloadWalletBlob(blob, fileName) {
	if (typeof document === 'undefined') {
		throw new Error('A browser document is required to download wallet files.');
	}
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = fileName;
	link.rel = 'noopener';
	link.click();
	function revokeURL() {
		URL.revokeObjectURL(url);
	}
	setTimeout(revokeURL, 0);
	return {
		url,
		fileName,
	};
}
export async function pickWalletFile() {
	if (typeof showOpenFilePicker === 'function') {
		const handles = await showOpenFilePicker({
			multiple: false,
			types: [
				{
					description: 'VIAT wallet files',
					accept: {
						'application/cbor': ['.cbor.wallet.viat'],
						'application/json': ['.json.wallet.viat'],
					},
				},
			],
		});
		if (handles?.length) {
			return handles[0].getFile();
		}
	}
	if (typeof document === 'undefined') {
		throw new Error('A browser file picker is required to load a wallet file from disk.');
	}
	return new Promise((resolve, reject) => {
		const input = document.createElement('input');
		function onChange() {
			resolve(input.files?.[0]);
		}
		function onError(error) {
			reject(error);
		}
		input.type = 'file';
		input.accept = '.cbor.wallet.viat,.json.wallet.viat,.wallet.viat,application/cbor,application/json';
		input.onchange = onChange;
		input.onerror = onError;
		input.click();
	});
}
export async function applyWalletSecret(secret, meta) {
	const walletSecret = this.normalizeWalletSecret(secret);
	if (!walletSecret.walletSeeds?.seed || !walletSecret.walletSeeds?.trapdoorSeed) {
		throw new Error('Loaded wallet seed data is incomplete.');
	}
	let hdWalletInstance;
	if (walletSecret.hdState) {
		hdWalletInstance = await HDSeed.createSiteWallet();
		if (hdWalletInstance?.importObject) {
			await hdWalletInstance.importObject(walletSecret.hdState);
		}
	}
	await this.set('hdWalletInstance', hdWalletInstance);
	await this.set('walletSeeds', walletSecret.walletSeeds);
	await this.setKeypairs();
	await this.set('trapdoorHash', await this.getTrapdoorHash());
	await this.set('walletSaveMeta', meta);
	await this.set('walletSecret', walletSecret);
	return {
		walletSeeds: walletSecret.walletSeeds,
		hdWalletInstance,
		primaryKeypair: await this.get('primaryKeypair'),
		trapdoorKeypair: await this.get('trapdoorKeypair'),
		trapdoorHash: await this.get('trapdoorHash'),
	};
}
export async function importWalletPackage(source, userInput, options = {}) {
	const walletPackage = this.normalizeWalletPackage(source);
	const defaults = this.getWalletDefaults();
	if (walletPackage.kind && walletPackage.kind !== defaults.WALLET_SAVE_KIND) {
		throw new Error(`Unsupported wallet package kind: ${walletPackage.kind}`);
	}
	const secret = await this.decryptWalletSecret(walletPackage, userInput, options);
	const loaded = await this.applyWalletSecret(secret, walletPackage.meta);
	await this.set('walletPackage', walletPackage);
	return {
		package: walletPackage,
		meta: walletPackage.meta,
		secret,
		...loaded,
	};
}
export async function saveWalletToLocalStorage(userInput, options = {}) {
	if (!globalThis.localStorage) {
		throw new Error('localStorage is not available in this browser context.');
	}
	const walletPackage = await this.createWalletPackage(userInput, options);
	const storageKey = this.getWalletStorageKey(options);
	const json = await this.serializeWalletPackage(walletPackage, 'json', options);
	globalThis.localStorage.setItem(storageKey, json);
	await this.set('walletPackage', this.normalizeWalletPackage(JSON.parse(json)));
	await this.set('walletSaveMeta', walletPackage.meta);
	return {
		storageKey,
		meta: walletPackage.meta,
		json,
	};
}
export async function loadWalletFromLocalStorage(userInput, options = {}) {
	if (!globalThis.localStorage) {
		throw new Error('localStorage is not available in this browser context.');
	}
	const storageKey = this.getWalletStorageKey(options);
	const rawValue = globalThis.localStorage.getItem(storageKey);
	if (!rawValue) {
		throw new Error(`No saved wallet data was found in localStorage for key: ${storageKey}`);
	}
	return this.importWalletPackage(await this.deserializeWalletPackage(rawValue, 'json', options), userInput, options);
}
export async function saveWalletFile(userInput, options = {}) {
	const fileFormat = this.getWalletFileFormat(options);
	const fileName = this.getWalletFileName({
		...options,
		fileFormat,
	});
	const walletPackage = await this.createWalletPackage(userInput, options);
	const data = await this.serializeWalletPackage(walletPackage, fileFormat, options);
	const blob = new Blob([data]);
	if (options?.download !== false) {
		await this.downloadWalletBlob(blob, fileName);
	}
	await this.set('walletPackage', this.normalizeWalletPackage(this.createWalletPackageShape(walletPackage, fileFormat)));
	await this.set('walletSaveMeta', walletPackage.meta);
	return {
		fileName,
		format: fileFormat,
		blob,
		data,
		meta: walletPackage.meta,
	};
}
export async function loadWalletFile(userInput, options = {}) {
	const file = options?.file || options?.fileSource || await this.pickWalletFile();
	if (!file) {
		throw new Error('No wallet file was selected.');
	}
	const fileBytes = await this.readWalletFileSource(file);
	const format = this.detectWalletFileFormat(fileBytes, {
		...options,
		file,
	});
	return this.importWalletPackage(await this.deserializeWalletPackage(fileBytes, format, {
		...options,
		file,
	}), userInput, options);
}
export const walletPersistence = {
	getWalletDefaults,
	normalizeWalletSeeds,
	normalizeHdState,
	normalizeWalletSecret,
	normalizeMeta,
	canonicalizeMeta,
	cleanupMeta,
	getCrypto,
	randomBytes,
	assertUserInput,
	resolvePasswordHashBypass,
	getArgonConfig,
	toEncryptionKey,
	derivePasswordKey,
	encodeAuthenticatedMeta,
	getWalletLabel,
	getWalletBaseName,
	getWalletStorageKey,
	normalizeSaveFormat,
	getWalletFileFormat,
	getWalletFileName,
	getWalletMimeType,
	encodePlainValue,
	ensureWalletSeeds,
	ensureWalletKeys,
	exportWalletSecret,
	getWalletMeta,
	encryptWalletSecret,
	decryptWalletSecret,
	createWalletPackageShape,
	normalizeWalletPackage,
	createWalletPackage,
	serializeWalletPackage,
	detectWalletFileFormat,
	deserializeWalletPackage,
	readWalletFileSource,
	downloadWalletBlob,
	pickWalletFile,
	applyWalletSecret,
	importWalletPackage,
	saveWalletToLocalStorage,
	loadWalletFromLocalStorage,
	saveWalletFile,
	loadWalletFile,
};
export default walletPersistence;
