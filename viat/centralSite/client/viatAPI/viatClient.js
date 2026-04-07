import {
	extendClass,
	isBigInt,
	isString,
} from '@universalweb/utilitylib';
import { shake256, shake256_64 } from '@noble/hashes/sha3.js';
import { HDSeed } from '#viat/hdSeed/index';
import { ed25519 } from '@noble/curves/ed25519.js';
import { encodeSync } from './cbor.js';
import { generateLegacyAddress } from './generateAddress.js';
import { ml_dsa44 } from '@noble/post-quantum/ml-dsa.js';
import { textToBuffer } from './utils.js';
/** VIAT Cryptocurrency API Client */
/*
	TODO: Change dilithium and ed25519 to native or wasm variants
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
	async initialize(config) {
		return this;
	}
	async createSiteWalletInstance(config) {
		this.hdWalletInstance = await HDSeed.createSiteWallet(config);
	}
	async createSiteWallet(config) {
		this.walletSeeds = await this.hdWalletInstance.getWalletSeed();
	}
	setCBOR(useCBOR) {
		this.useCBOR = useCBOR;
		this.setAPICBORMode(useCBOR);
	}
	getFormat() {
		return this.useCBOR ? 'CBOR' : 'JSON';
	}
	/* Ed25519 helpers using @noble/curves/ed25519.js */
	/** Create a new ed25519 keypair. */
	async keypair() {
		const {
			secretKey,
			publicKey,
		} = await ed25519.keygen(this.walletSeeds.seed);
		return {
			privateKey: Buffer.from(secretKey),
			publicKey: Buffer.from(publicKey),
		};
	}
	async trapdoorKeypair() {
		const {
			secretKey,
			publicKey,
		} = await ml_dsa44.keygen(this.walletSeeds.trapdoor);
		return {
			privateKey: Buffer.from(secretKey),
			publicKey: Buffer.from(publicKey),
		};
	}
	async getTrapdoorHash() {
		const trapdoorKeypair = await this.trapdoorKeypair();
		const hash = await ml_dsa44.hash(trapdoorKeypair.publicKey);
		return Buffer.from(hash);
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
		const pub = Buffer.from(publicKey || this.wallet.publicKey);
		return Boolean(await ed25519.verify(sig, msg, pub, options));
	}
	generateLegacyAddress() {
		return generateLegacyAddress(this.wallet.publicKey, this.wallet.trapdoor);
	}
	/** Derive public key from private key using ed25519. */
	getPublicKey(privateKey, encoding = 'base64') {
		const priv = (isString(privateKey)) ? Buffer.from(privateKey, encoding) : privateKey;
		const pub = ed25519.getPublicKey(priv);
		return Buffer.from(pub);
	}
	/**
	 * Sign a transaction object using the same canonical encoding as the server.
	 * The transaction object shape matches the server: { from: base64, to: base64, amount: string }.
	 * @param {Uint8Array|Buffer|string} fromAddress - Sender address (Buffer or base64 string).
	 * @param {Uint8Array|Buffer|string} toAddress - Receiver address.
	 * @param {bigint|number|string} amount - Amount.
	 * @param {Uint8Array|Buffer} privateKey - Ed25519 private key.
	 * @returns {Promise<Buffer>} Signature.
	 */
	async signTransaction(fromAddress, toAddress, amount, privateKey) {
		const from = (isString(fromAddress)) ? fromAddress : Buffer.from(fromAddress).toString('base64');
		const to = (isString(toAddress)) ? toAddress : Buffer.from(toAddress).toString('base64');
		const amountStr = (isBigInt(amount)) ? amount.toString() : String(amount);
		const transactionData = {
			from,
			to,
			amount: amountStr,
		};
		const encoded = await encodeSync(transactionData);
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
