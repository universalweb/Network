import {
	extendClass,
	isBigInt,
	isString,
} from '@universalweb/utilitylib';
import { HDSeed } from '#viat/hdSeed/index';
import { ed25519 } from '@noble/curves/ed25519.js';
import { encode } from './cbor.js';
import { generateLegacyAddress } from './generateAddress.js';
import { ml_dsa44 } from '@noble/post-quantum/ml-dsa.js';
import { shake256 } from '@noble/hashes/sha3.js';
import { textToBuffer } from './utils.js';
import { walletPersistence } from './walletPersistence.js';
import { webAPI } from './webAPI.js';
/** VIAT Cryptocurrency API Client. */
/*
	TODO: Change dilithium and ed25519 to native or wasm variants if present for better performance. Currently using pure JS implementations for compatibility and ease of use in the browser.
*/
class ViatClient {
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
		const client = new ViatClient(config);
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
		console.log(transactionData, encoded.toBase64());
		const msg = Buffer.from(encoded);
		const priv = Buffer.from(privateKey);
		const sig = await ed25519.sign(msg, priv);
		return Buffer.from(sig);
	}
}
extendClass(ViatClient, webAPI);
extendClass(ViatClient, walletPersistence);
export default ViatClient;
export { ViatClient };
