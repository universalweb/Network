import {
	extendClass,
	isBigInt,
	isString,
} from '@universalweb/utilitylib';
import { shake256, shake256_64 } from '@noble/hashes/sha3.js';
import { HDSeed } from '#viat/hdSeed/index';
import { ed25519 } from '@noble/curves/ed25519.js';
import { encode } from './cbor.js';
import { generateLegacyAddress } from './generateAddress.js';
import { ml_dsa44 } from '@noble/post-quantum/ml-dsa.js';
import { textToBuffer } from './utils.js';
/** VIAT Cryptocurrency API Client */
/*
	TODO: Change dilithium and ed25519 to native or wasm variants if present for better performance. Currently using pure JS implementations for compatibility and ease of use in the browser.
*/
import webAPI from './webAPI.js';
class VIATClient {
	constructor(config) {
		if (config?.useCBOR) {
			this.setCBOR(config?.useCBOR);
		}
		this.setURL(config);
	}
	static clients = new Map();
	static async create(config = {}) {
		const client = new VIATClient(config);
		await client.initialize(config);
		return client;
	}
	wallet = {
		primaryKeypair: {},
		trapdoorKeypair: {},
	};
	async initialize(config) {
		return this;
	}
	async createSiteWalletInstance(config) {
		await this.set('hdWalletInstance', await HDSeed.createSiteWallet(config));
	}
	async createSiteWallet(config) {
		await this.set('walletSeeds', await this.hdWalletInstance.getWalletSeed());
	}
	setCBOR(useCBOR) {
		this.useCBOR = useCBOR;
		this.setAPICBORMode(useCBOR);
	}
	getFormat() {
		return this.useCBOR ? 'CBOR' : 'JSON';
	}
	async setKeypairs() {
		const keypair = await this.hdWalletInstance.keypair();
		await this.set('primaryKeypair', keypair);
		const trapdoorKeypair = await this.hdWalletInstance.trapdoorKeypair();
		await this.set('trapdoorKeypair', trapdoorKeypair);
	}
	async set(key, value) {
		this.STATE[key] = value;
	}
	async get(key) {
		return this.STATE[key];
	}
	/* Ed25519 helpers using @noble/curves/ed25519.js */
	/** Create a new ed25519 keypair. */
	async keypair(seed) {
		const {
			secretKey,
			publicKey,
		} = await ed25519.keygen(seed || (await this.get('walletSeeds')).seed);
		return {
			privateKey: Buffer.from(secretKey),
			publicKey: Buffer.from(publicKey),
		};
	}
	async trapdoorKeypair(seed) {
		const {
			secretKey,
			publicKey,
		} = await ml_dsa44.keygen(seed || (await this.get('walletSeeds')).trapdoor);
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
	async generateSiteWallet() {
		await this.createSiteWalletInstance();
		await this.createSiteWallet();
		await this.setKeypairs();
		await this.set('trapdoorHash', await this.getTrapdoorHash());
	}
	/** Sign a message with a private key. */
	async sign(message, privateKey) {
		const msg = (isString(message)) ? textToBuffer(message) : Buffer.from(message);
		const priv = Buffer.from(privateKey);
		const sig = await ed25519.sign(msg, priv);
		return Buffer.from(sig);
	}
	/** Verify a signature for a message and public key. */
	async verifySignature(signature, message, publicKey, options = undefined) {
		const sig = Buffer.from(signature);
		const msg = (isString(message)) ? textToBuffer(message) : Buffer.from(message);
		const pub = Buffer.from(publicKey || (await this.get('primaryKeypair')).publicKey);
		return Boolean(await ed25519.verify(sig, msg, pub, options));
	}
	async generateLegacyAddress() {
		return generateLegacyAddress((await this.get('primaryKeypair')).publicKey, (await this.get('trapdoorKeypair')).publicKey);
	}
	/** Derive public key from private key using ed25519. */
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
extendClass(VIATClient, webAPI);
export default VIATClient;
export { VIATClient };
