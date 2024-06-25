import * as dilithium from '../utilities/cryptoMiddleware/dilithium.js';
import * as ed25519 from '../utilities/cryptoMiddleware/ed25519.js';
import { currentCertificateVersion } from '../defaults.js';
const defaultEncryptionAlgorithm = 1;
const defaultSignatureAlgorithm = 1;
export class ViatWallet {
	constructor(config = {}) {
		return this.initialize(config);
	}
	async initialize(config) {
		const {
			signatureAlgorithm = defaultSignatureAlgorithm,
			encryptionAlgorithm = defaultEncryptionAlgorithm,
			version,
		} = config;
		this.version = version || currentCertificateVersion;
		const ed25519NewKeypair = await ed25519.signatureKeypair();
		const dilithiumNewKeypair =	await dilithium.signatureKeypair();
		this.ed25519Keypair = ed25519NewKeypair;
		this.dilithiumKeypair = dilithiumNewKeypair;
		this.publicKey = Buffer.concat([ed25519NewKeypair.publicKey, dilithiumNewKeypair.publicKey]);
		this.privateKey = Buffer.concat([ed25519NewKeypair.privateKey, dilithiumNewKeypair.privateKey]);
		return this;
	}
}
export function viatWallet(config) {
	const wallet = new ViatWallet();
	return wallet;
}
// const viatWalletExample = await viatWallet();
// console.log(viatWalletExample);
// console.log(`Public Key Size: ${viatWalletExample.publicKey.length}`);
// console.log(`Private Key Size: ${viatWalletExample.privateKey.length}`);
