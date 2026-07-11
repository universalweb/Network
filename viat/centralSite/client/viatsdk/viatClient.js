import {
	extendClass,
	isBigInt,
	isString,
} from '@universalweb/utilitylib';
import { HDSeed } from '#viat/hdSeed/index';
import QRCode from 'qrcode';
import { ed25519 } from '@noble/curves/ed25519.js';
import { encode } from './cbor.js';
import { generateLegacyAddress } from './generateAddress.js';
import { ml_dsa44 } from '@noble/post-quantum/ml-dsa.js';
import { shake256 } from '@noble/hashes/sha3.js';
import { textToBuffer } from './utils.js';
import { walletPersistence } from './walletPersistence.js';
import { webAPI } from './webAPI.js';
// Expose the bundled Buffer polyfill globally so consumers of the SDK can use
// it without re-importing the `buffer` package. Skip when a native Buffer is
// already present (Node, Bun) so we don't shadow a faster implementation.
if (!globalThis.Buffer) {
	globalThis.Buffer = Buffer;
}
/** VIAT Cryptocurrency API Client. */
// TODO: EXPOSE UTILS CLASS FOR USERS OF THE SDK
/*
	TODO: Change dilithium and ed25519 to native or wasm variants if present for better performance. Currently using pure JS implementations for compatibility and ease of use in the browser.
*/
class VIATClientSDK {
	static WALLET_SAVE_KIND = 'wallet.viat';
	static WALLET_SAVE_VERSION = 1;
	static DEFAULT_WALLET_NAME = 'wallet';
	static DEFAULT_WALLET_STORAGE_KEY = 'viat.wallet';
	static DEFAULT_ARGON_CONFIG = {
		parallelism: 1,
		iterations: 256,
		memorySize: 512,
		hashLength: 32,
		saltLength: 32,
	};
	static clients = new Map();
	STATE = {};
	wallet = {
		primaryKeypair: {},
		trapdoorKeypair: {},
	};
	constructor(config = {}) {
		this.STATE = {};
		if (config?.useCBOR) {
			this.setCBOR(config?.useCBOR);
		}
		this.setURL(config);
	}
	static async create(config = {}) {
		const client = new VIATClientSDK(config);
		await client.initialize(config);
		return client;
	}
	async initialize(config = {}) {
		if (config?.STATE) {
			await this.setValues(config.STATE);
		}
		return this;
	}
	async setValues(source = {}) {
		const keys = Object.keys(source);
		for (let index = 0; index < keys.length; index += 1) {
			const key = keys[index];
			await this.set(key, source[key]);
		}
		return this;
	}
	async createSiteWallet(config = {}) {
		const hdWalletInstance = (await this.get('hdWalletInstance')) || await this.createSiteWalletInstance(config);
		const walletSeeds = this.normalizeWalletSeeds(await hdWalletInstance.getWalletSeed());
		await this.set('walletSeeds', walletSeeds);
		return walletSeeds;
	}
	async createSiteWalletInstance(config = {}) {
		const hdWalletInstance = await HDSeed.createSiteWallet(config);
		if (config?.STATE && hdWalletInstance?.importObject) {
			await hdWalletInstance.importObject(config.STATE);
		}
		await this.set('hdWalletInstance', hdWalletInstance);
		return hdWalletInstance;
	}
	setCBOR(useCBOR) {
		this.useCBOR = useCBOR;
		this.setAPICBORMode(useCBOR);
	}
	getFormat() {
		return this.useCBOR ? 'CBOR' : 'JSON';
	}
	async setKeypairs() {
		const primaryKeypair = await this.keypair();
		await this.set('primaryKeypair', primaryKeypair);
		const trapdoorKeypair = await this.trapdoorKeypair();
		await this.set('trapdoorKeypair', trapdoorKeypair);
		return {
			primaryKeypair,
			trapdoorKeypair,
		};
	}
	async set(key, value) {
		this.STATE = this.STATE || {};
		this.STATE[key] = value;
		// Avoid shadowing prototype methods (e.g. `trapdoorKeypair`,
		// `primaryKeypair`) that share a name with a state key. Without this
		// guard, a second call to `setKeypairs()` invokes an object as a
		// function and throws.
		let proto = Object.getPrototypeOf(this);
		while (proto && proto !== Object.prototype) {
			if (Object.prototype.hasOwnProperty.call(proto, key) && typeof proto[key] === 'function') {
				return value;
			}
			proto = Object.getPrototypeOf(proto);
		}
		this[key] = value;
		return value;
	}
	async get(key) {
		if (this.STATE && Object.prototype.hasOwnProperty.call(this.STATE, key)) {
			return this.STATE[key];
		}
		return this[key];
	}
	/**
	 * Create a new ed25519 keypair.
	 * @returns {Promise<{ privateKey: Buffer, publicKey: Buffer }>} The derived keypair buffers.
	 */
	async keypair(seed) {
		const walletSeeds = this.normalizeWalletSeeds(await this.get('walletSeeds'));
		const {
			secretKey,
			publicKey,
		} = await ed25519.keygen(seed || walletSeeds.seed);
		return {
			privateKey: Buffer.from(secretKey),
			publicKey: Buffer.from(publicKey),
		};
	}
	async trapdoorKeypair(seed) {
		const walletSeeds = this.normalizeWalletSeeds(await this.get('walletSeeds'));
		const trapdoorSeed = seed || walletSeeds.trapdoorSeed || walletSeeds.trapdoor;
		const {
			secretKey,
			publicKey,
		} = await ml_dsa44.keygen(trapdoorSeed);
		return {
			privateKey: Buffer.from(secretKey),
			publicKey: Buffer.from(publicKey),
		};
	}
	async getTrapdoorHash() {
		const trapdoorKeypair = await this.get('trapdoorKeypair');
		const hash = await shake256(trapdoorKeypair.publicKey);
		return Buffer.from(hash);
	}
	async generateSiteWallet(config = {}) {
		await this.createSiteWalletInstance(config);
		await this.createSiteWallet(config);
		await this.setKeypairs();
		await this.set('trapdoorHash', await this.getTrapdoorHash());
		return this;
	}
	/**
	 * Sign a message with a private key.
	 * @returns {Promise<Buffer>} The detached signature bytes.
	 */
	async sign(message, privateKey) {
		const msg = (isString(message)) ? textToBuffer(message) : Buffer.from(message);
		const priv = Buffer.from(privateKey);
		const sig = await ed25519.sign(msg, priv);
		return Buffer.from(sig);
	}
	/**
	 * Verify a signature for a message and public key.
	 * @returns {Promise<boolean>} True when the signature matches the message and key.
	 */
	async verifySignature(signature, message, publicKey, options = undefined) {
		const sig = Buffer.from(signature);
		const msg = (isString(message)) ? textToBuffer(message) : Buffer.from(message);
		const pub = Buffer.from(publicKey || (await this.get('primaryKeypair')).publicKey);
		return Boolean(await ed25519.verify(sig, msg, pub, options));
	}
	async generateLegacyAddress() {
		return generateLegacyAddress((await this.get('primaryKeypair')).publicKey, (await this.get('trapdoorKeypair')).publicKey);
	}
	/**
	 * Derive public key from private key using ed25519.
	 * @returns {Buffer} The derived public key buffer.
	 */
	getPublicKey(privateKey, encoding = 'base64') {
		const priv = (isString(privateKey)) ? Buffer.from(privateKey, encoding) : privateKey;
		const pub = ed25519.getPublicKey(priv);
		return Buffer.from(pub);
	}
	// TODO: REWRITE THIS TO NEW FORMAT USE ASSIGNED KEYPAIRS INSTEAD OF GENERATING NEW ONES EACH TIME
	async signTransaction(fromAddress, toAddress, amount, privateKey) {
		const from = (isString(fromAddress)) ? fromAddress : Buffer.from(fromAddress).toString('base64');
		const to = (isString(toAddress)) ? toAddress : Buffer.from(toAddress).toString('base64');
		const amountStr = (isBigInt(amount)) ? amount.toString() : String(amount);
		const transactionData = {
			from,
			to,
			amount: amountStr,
		};
		const encoded = await encode(transactionData);
		const msg = Buffer.from(encoded);
		const priv = Buffer.from(privateKey);
		const sig = await ed25519.sign(msg, priv);
		return Buffer.from(sig);
	}
	// High-level helper: pull the active wallet's primary keypair, derive the
	// from-address, sign over the canonical (from, to, amount) struct, and post
	// to /api/transactions. Returns the server's transaction record.
	async sendTransaction(toAddress, amount, options = {}) {
		const primaryKeypair = await this.get('primaryKeypair');
		if (!primaryKeypair?.privateKey || !primaryKeypair?.publicKey) {
			throw new Error('No wallet loaded. Create or import a wallet before sending.');
		}
		const fromAddress = await this.generateLegacyAddress();
		const fromBase64 = Buffer.from(fromAddress).toString('base64');
		const toBase64 = isString(toAddress) ? toAddress : Buffer.from(toAddress).toString('base64');
		const amountStr = (isBigInt(amount)) ? amount.toString() : String(amount);
		const signature = await this.signTransaction(fromBase64, toBase64, amountStr, primaryKeypair.privateKey);
		const payload = {
			from: fromBase64,
			to: toBase64,
			amount: amountStr,
			signature: Buffer.from(signature).toString('base64'),
		};
		// First send always carries the public key so the server can verify and,
		// if needed, create the account record.
		if (options.includePublicKey !== false) {
			payload.publicKey = Buffer.from(primaryKeypair.publicKey).toString('base64');
		}
		return this.createTransaction(payload);
	}
}
extendClass(VIATClientSDK, webAPI);
extendClass(VIATClientSDK, walletPersistence);
const QR_OUTPUT_KEY = 'type';
const DEFAULT_QR_OPTIONS = {
	margin: 1,
	errorCorrectionLevel: 'M',
};
DEFAULT_QR_OPTIONS[QR_OUTPUT_KEY] = 'svg';
export async function toQrSvg(text, options = {}) {
	if (!text) {
		return '';
	}
	const merged = {
		...DEFAULT_QR_OPTIONS,
		...options,
	};
	merged[QR_OUTPUT_KEY] = 'svg';
	return QRCode.toString(String(text), merged);
}
VIATClientSDK.toQrSvg = toQrSvg;
VIATClientSDK.prototype.toQrSvg = function instanceToQrSvg(text, options) {
	return toQrSvg(text, options);
};
export default VIATClientSDK;
export { VIATClientSDK };
export { encode, decode } from './cbor.js';
export { Buffer } from 'buffer';
