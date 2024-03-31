import { encode } from '#utilities/serialize';
import { saveCertificate } from './save.js';
export class UWCertificate {
	constructor(config) {
		return this.initialize(config);
	}
	encodePublic() {
		return encode(this.getPublic());
	}
	encode() {
		return encode(this.array);
	}
	encodeStructured() {
		return encode(this.object);
	}
	async save(certificateName, savePath) {
		const saved = await saveCertificate({
			certificate: this.certificate,
			savePath,
			certificateName
		});
		return saved;
	}
	async savePublic(certificateName, savePath) {
		const saved = await saveCertificate({
			certificate: this.publicCertificate,
			savePath,
			certificateName
		});
		return saved;
	}
}
