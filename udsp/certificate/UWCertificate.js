import { encode } from '#utilities/serialize';
import { saveCertificate } from './save.js';
export class UWCertificate {
	constructor(config) {
		return this.initialize(config);
	}
	encodePublic() {
		return encode(this.getPublic());
	}
	getCertificate() {
		return [
			this.array,
			this.getSignature()
		];
	}
	encode() {
		return encode(this.getCertificate());
	}
	encodeStructured() {
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
}
