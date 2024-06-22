import { getEncryptionKeypairAlgorithm, getSignatureAlgorithmByCertificate } from '../utilities/cryptoMiddleware/index.js';
import { currentCertificateVersion } from '../defaults.js';
import { signatureKeypair } from '../utilities/cryptoMiddleware/ed25519';
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
		const encryptionSuite = getEncryptionKeypairAlgorithm(encryptionAlgorithm, version);
		const signatureSuite = getSignatureAlgorithmByCertificate(signatureAlgorithm, version);
		console.log(encryptionSuite, signatureSuite);
		this.signature = await signatureSuite.signatureKeypair();
		this.encryption = await encryptionSuite.encryptionKeypair();
		return this;
	}
}
export function viatWallet(config) {
	const wallet = new ViatWallet();
	return wallet;
}
console.log(await viatWallet());
