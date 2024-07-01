import * as dilithium from '../utilities/cryptoMiddleware/dilithium.js';
import * as ed25519 from '../utilities/cryptoMiddleware/ed25519.js';
import { decode, encode } from '#utilities/serialize';
import { blake3Hash } from '../utilities/cryptoMiddleware/blake3.js';
import { currentCertificateVersion } from '../defaults.js';
import { initialize } from '#server/clients/initialize';
import { isBuffer } from '@universalweb/acid';
const defaultEncryptionAlgorithm = 1;
const defaultSignatureAlgorithm = 1;
export class ViatWallet {
	constructor(config = {}) {
		return this.initialize(config);
	}
	async initialize(config) {
		if (isBuffer(config)) {
			this.importFromBinary(config);
		} else if (config.publicKey || config.privateKey) {
			const {
				version,
				publicKey,
				privateKey
			} = config;
			if (publicKey) {
				this.publicKey = publicKey;
			}
			if (privateKey) {
				this.privateKey = privateKey;
			}
			if (version) {
				this.version = version;
			}
		} else {
			await this.generate(config);
		}
		return this;
	}
	async generate(config) {
		const {
			signatureAlgorithm = defaultSignatureAlgorithm,
			encryptionAlgorithm = defaultEncryptionAlgorithm,
			version,
		} = config;
		this.version = version || currentCertificateVersion;
		const ed25519NewKeypair = await ed25519.signatureKeypair();
		const dilithiumNewKeypair =	await dilithium.signatureKeypair();
		console.log(ed25519NewKeypair.publicKey, ed25519NewKeypair.privateKey);
		this.publicKey = Buffer.concat([ed25519NewKeypair.publicKey, dilithiumNewKeypair.publicKey]);
		this.privateKey = Buffer.concat([ed25519NewKeypair.privateKey, dilithiumNewKeypair.privateKey]);
	}
	get ed25519PublicKey() {
		return this.publicKey.slice(0, 32);
	}
	get ed25519PrivateKey() {
		return this.privateKey.slice(0, 64);
	}
	get dilithiumPublicKey() {
		return this.publicKey.slice(32);
	}
	get dilithiumPrivateKey() {
		return this.privateKey.slice(64);
	}
	async sign(message) {
		const ed25519Signature = await ed25519.signDetached(message, this.ed25519PrivateKey);
		console.log(ed25519Signature.length);
		const dilithiumSignature = await dilithium.sign(message, this.dilithiumPrivateKey);
		console.log(dilithiumSignature.length);
		const signature = Buffer.concat([ed25519Signature, dilithiumSignature]);
		return signature;
	}
	async verifySignature(signature, message) {
		const ed25519Signature = signature.slice(0, 64);
		const dilithiumSignature = signature.slice(64);
		const ed25519Verify = ed25519.verifySignatureDetached(ed25519Signature, this.ed25519PublicKey, message);
		const dilithiumVerify = await dilithium.verifySignature(dilithiumSignature, this.dilithiumPublicKey, message);
		console.log(ed25519Verify, dilithiumVerify);
		return (ed25519Verify === dilithiumVerify) ? ed25519Verify : false;
	}
	async hash(message) {
		const hashedMessage = blake3Hash.hash(message);
		return hashedMessage;
	}
	async importFromBinary(data) {
		const decodedData = decode(data);
		this.version = decodedData.version;
		this.publicKey = decodedData.publicKey;
		this.privateKey = decodedData.privateKey;
		return this;
	}
	async exportAsBinary() {
		const data = {
			version: this.version,
			publicKey: this.publicKey,
			privateKey: this.privateKey,
		};
		const dataEncoded = encode(data);
		return dataEncoded;
	}
	async saveToFile() {
		const dataEncoded = await this.exportAsBinary();
	}
}
export function viatWallet(config) {
	const wallet = new ViatWallet();
	return wallet;
}
// const viatWalletExample = await viatWallet();
// console.log(viatWalletExample);
// console.log(`Version: ${viatWalletExample.version}`);
// console.log(`Public Key Size: ${viatWalletExample.publicKey.length}`);
// console.log(`Private Key Size: ${viatWalletExample.privateKey.length}`);
// console.log(viatWalletExample.ed25519PublicKey);
// console.log(viatWalletExample.ed25519PrivateKey);
// const messageExample = Buffer.from('Hello, World!');
// const sig = await viatWalletExample.sign(messageExample);
// console.log(sig);
// console.log(await viatWalletExample.verifySignature(sig, messageExample));
