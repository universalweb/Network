import {
	getCipherSuite,
	getCipherSuites,
	getEncryptionKeypairAlgorithm,
	getSignatureAlgorithm
} from '../cryptoMiddleware/index.js';
import { encode } from '#utilities/serialize';
import { saveCertificate } from './save.js';
export class UWCertificate {
	constructor(config) {
		return this.initialize(config);
	}
	set(key, value) {
		this.object[key] = value;
		this.update();
	}
	get(key) {
		if (key) {
			return this.object[key];
		}
		return this.object;
	}
	getProtocolVersion() {
		return this.object?.protocolOptions?.version;
	}
	getCertificateVersion() {
		return this.object?.version;
	}
	getSignatureAlgorithm() {
		return getSignatureAlgorithm(this.object.signatureAlgorithm, this.getCertificateVersion());
	}
	getEncryptionKeypairAlgorithm() {
		return getEncryptionKeypairAlgorithm(this.object.encryptionKeypairAlgorithm, this.getCertificateVersion());
	}
	getCipherSuite(suiteName) {
		return getCipherSuite(suiteName, this.getProtocolVersion());
	}
	getCipherSuites() {
		return getCipherSuites(this.object.cipherSuites, this.getProtocolVersion());
	}
	encodePublic() {
		return encode(this.getPublic());
	}
	getHash() {
		if (this?.object?.signature) {
			return this.object.signature;
		}
	}
	encodeArray() {
		return [
			this.array,
			this.getSignature()
		];
	}
	encode() {
		return encode(this.object);
	}
	async save(certificateName, savePath) {
		const saved = await saveCertificate({
			certificate: this.encode(),
			savePath,
			certificateName
		});
		return saved;
	}
	async savePublic(certificateName, savePath) {
		const saved = await saveCertificate({
			certificate: this.encodePublic(),
			savePath,
			certificateName
		});
		return saved;
	}
	getPublic() {
		this.generatePublic();
		const signature = this.getSignature();
		return [
			this.publicCertificate,
			signature
		];
	}
}
