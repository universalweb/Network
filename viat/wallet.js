import { getEncryptionKeypairAlgorithm, getSignatureAlgorithmByCertificate } from '../utilities/cryptoMiddleware/index.js';
import { currentCertificateVersion } from '../defaults.js';
export class ViatWallet {
	constructor(config = {}) {
		return this.initialize(config);
	}
	async initialize(config) {
		const {
			signatureAlgorithm,
			encryptionAlgorithm,
			version,
		} = config;
		this.version = version || currentCertificateVersion;
		const encryptionSuite = getEncryptionKeypairAlgorithm(encryptionAlgorithm, version);
		const signatureSuite = getSignatureAlgorithmByCertificate(signatureAlgorithm, version);
		console.log(encryptionSuite, signatureSuite);
		this.signature = await signatureSuite.signKeypair();
		this.encryption = await encryptionSuite.keypair();
		return this;
	}
}
export function viatWallet(config) {
	const wallet = new ViatWallet();
	return wallet;
}
console.log(await viatWallet());
