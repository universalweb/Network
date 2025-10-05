/** VIAT Cryptocurrency API Client */
import { decode, encodeSync } from './cbor.js';
import { ed25519 } from '@noble/curves/ed25519.js';
import { generateAddress } from './generateAddress.js';
import { shake256 } from '@noble/hashes/sha3.js';
function isString(source) {
	return source && typeof source === 'string';
}
function ensureBase64(source) {
	if (source && isString(source)) {
		return source;
	}
	return Buffer.from(source).toString('base64');
}
function ensureBase64URL(source) {
	if (source && isString(source)) {
		return source;
	}
	return Buffer.from(source).toString('base64url');
}
function base64orBuffer(source) {
	if (source && isString(source)) {
		return source;
	}
	return Buffer.from(source);
}
class VIATClient {
	constructor(baseURL, options = {}) {
		const href = baseURL || window.location.origin;
		this.baseURL = `${href.replace(/\/$/, '')}/api`;
		this.useCBOR = options.useCBOR || false;
		this.defaultHeaders = {
			'Content-Type': this.useCBOR ? 'application/cbor' : 'application/json',
			Accept: this.useCBOR ? 'application/cbor' : 'application/json',
		};
	}
	async request(method, endpoint, data = null) {
		const url = `${this.baseURL}${endpoint}`;
		const config = {
			method,
			headers: {
				...this.defaultHeaders,
			},
		};
		if (data && (method === 'POST' || method === 'PUT')) {
			config.body = this.useCBOR ? encodeSync(data) : JSON.stringify(data);
		}
		const response = await fetch(url, config);
		if (!response.ok) {
			const errorData = await this.parseResponse(response);
			throw new Error(`API Error: ${response.status} - ${errorData.error || 'Unknown error'}`);
		}
		return this.parseResponse(response);
	}
	async parseResponse(response) {
		const contentType = response.headers.get('content-type');
		if (contentType && contentType.includes('application/cbor')) {
			const buffer = await response.arrayBuffer();
			return decode(Buffer.from(buffer));
		}
		return response.json();
	}
	async health() {
		return this.request('GET', '/health');
	}
	async createAccount(publicKey, address = null) {
		const data = {
			publicKey: ensureBase64(publicKey),
		};
		if (address) {
			data.address = ensureBase64(address);
		}
		return this.request('POST', '/accounts', data);
	}
	async getAccount(address) {
		const addressStr = ensureBase64(address);
		return this.request('GET', `/accounts/${encodeURIComponent(addressStr)}`);
	}
	async getAccountTransactions(address, options = {}) {
		const addressStr = ensureBase64(address);
		const params = new URLSearchParams();
		if (options.page) {
			params.append('page', options.page.toString());
		}
		if (options.limit) {
			params.append('limit', options.limit.toString());
		}
		const query = params.toString();
		const endpoint = `/accounts/${encodeURIComponent(addressStr)}/transactions${query ? `?${query}` : ''}`;
		return this.request('GET', endpoint);
	}
	async createTransaction(fromAddress, toAddress, amount, signature, publicKey) {
		if (!publicKey) {
			throw new Error('Public key is required for transaction creation');
		}
		const data = {
			from: ensureBase64(fromAddress),
			to: ensureBase64(toAddress),
			amount: amount.toString(),
			signature: ensureBase64(signature),
			publicKey: ensureBase64(publicKey),
		};
		return this.request('POST', '/transactions', data);
	}
	async mintFunds(toAddress, amount) {
		const data = {
			to: ensureBase64(toAddress),
		};
		return this.request('POST', '/transactions/mint', data);
	}
	setCBOR(useCBOR) {
		this.useCBOR = useCBOR;
		this.defaultHeaders = {
			'Content-Type': this.useCBOR ? 'application/cbor' : 'application/json',
			Accept: this.useCBOR ? 'application/cbor' : 'application/json',
		};
	}
	getFormat() {
		return this.useCBOR ? 'CBOR' : 'JSON';
	}
	/* Ed25519 helpers using @noble/curves/ed25519.js */
	/** Create a new ed25519 keypair. */
	createKeypair() {
		if (typeof ed25519.keygen === 'function') {
			const {
				secretKey,
				publicKey,
			} = ed25519.keygen();
			return {
				privateKey: Buffer.from(secretKey),
				publicKey: Buffer.from(publicKey),
			};
		}
		let priv;
		if (ed25519.utils && typeof ed25519.utils.randomPrivateKey === 'function') {
			priv = ed25519.utils.randomPrivateKey();
		} else {
			priv = undefined;
		}
		if (!priv) {
			throw new Error('ed25519: no key generation available');
		}
		const pub = ed25519.getPublicKey(priv);
		return {
			privateKey: Buffer.from(priv),
			publicKey: Buffer.from(pub),
		};
	}
	/** Sign a message with a private key. */
	async signMessage(message, privateKey) {
		const msg = typeof message === 'string' ? new TextEncoder().encode(message) : Buffer.from(message);
		const priv = Buffer.from(privateKey);
		const sig = await ed25519.sign(msg, priv);
		return Buffer.from(sig);
	}
	/** Verify a signature for a message and public key. */
	async verifySignature(signature, message, publicKey, options = undefined) {
		const sig = Buffer.from(signature);
		const msg = typeof message === 'string' ? new TextEncoder().encode(message) : Buffer.from(message);
		const pub = Buffer.from(publicKey);
		if (typeof ed25519.verify === 'function') {
			if (options !== undefined) {
				return Boolean(await ed25519.verify(sig, msg, pub, options));
			}
			return Boolean(await ed25519.verify(sig, msg, pub));
		}
		throw new Error('ed25519.verify is not available');
	}
	generateAddress(publicKeyBuffer) {
		const addressStr = typeof publicKeyBuffer === 'string' ? Buffer.from(publicKeyBuffer).toString('base64') : publicKeyBuffer;
		return generateAddress(addressStr);
	}
	/** Derive public key from private key using ed25519. */
	derivePublicKey(privateKey, encoding = 'base64') {
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
		const from = typeof fromAddress === 'string' ? fromAddress : Buffer.from(fromAddress).toString('base64');
		const to = typeof toAddress === 'string' ? toAddress : Buffer.from(toAddress).toString('base64');
		const amountStr = (typeof amount === 'bigint') ? amount.toString() : String(amount);
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
	/**
	 * Verify a transaction signature using the server's canonical encoding.
	 * @param {Uint8Array|Buffer} signature
	 * @param {Uint8Array|Buffer|string} fromAddress
	 * @param {Uint8Array|Buffer|string} toAddress
	 * @param {bigint|number|string} amount
	 * @param {Uint8Array|Buffer} publicKey
	 * @param {Object} [options] - Optional verify options for noble.
	 * @returns {Promise<boolean>} True if valid.
	 */
	async verifyTransactionSignature(signature, fromAddress, toAddress, amount, publicKey, options = undefined) {
		const from = typeof fromAddress === 'string' ? fromAddress : Buffer.from(fromAddress).toString('base64');
		const to = typeof toAddress === 'string' ? toAddress : Buffer.from(toAddress).toString('base64');
		const amountStr = (typeof amount === 'bigint') ? amount.toString() : String(amount);
		const transactionData = {
			from,
			to,
			amount: amountStr,
		};
		const encoded = await encodeSync(transactionData);
		const msg = Buffer.from(encoded);
		const sig = Buffer.from(signature);
		const pub = Buffer.from(publicKey);
		if (typeof ed25519.verify === 'function') {
			if (options !== undefined) {
				return Boolean(await ed25519.verify(sig, msg, pub, options));
			}
			return Boolean(await ed25519.verify(sig, msg, pub));
		}
		throw new Error('ed25519.verify is not available');
	}
}
const viatClient = new VIATClient();
/**
 * Generate an ed25519 keypair using the client helper.
 * @param {string} [format] - 'buffer' (default) or 'base64'.
 * @returns {{privateKey: Buffer|string, publicKey: Buffer|string}}
 */
export function generateKeypair(format = 'buffer') {
	const {
		privateKey,
		publicKey,
	} = viatClient.createKeypair();
	if (format === 'base64') {
		return {
			privateKey: privateKey.toString('base64'),
			publicKey: publicKey.toString('base64'),
		};
	}
	return {
		privateKey,
		publicKey,
	};
}
/**
 * Derive public key from private key using ed25519.
 * @param {Uint8Array|Buffer} privateKey - Ed25519 private key.
 * @param {string} [format] - 'buffer' (default) or 'base64'.
 * @returns {Buffer|string} The derived public key.
 */
export function derivePublicKey(privateKey, format = 'buffer') {
	const publicKey = viatClient.derivePublicKey(privateKey);
	if (format === 'base64') {
		return publicKey.toString('base64');
	}
	return publicKey;
}
// CHANGE THIS FROM DEFAULT
export default viatClient;
export { VIATClient, generateAddress };
