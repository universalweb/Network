import {
	get,
	hasDot,
	hasValue,
	isArray,
	isBuffer,
	isNumber,
	untilTrueArray
} from '@universalweb/acid';
import {
	getCipherSuite,
	getCipherSuites,
	getEncryptionKeypairAlgorithm,
	getSignatureAlgorithm
} from '../cryptoMiddleware/index.js';
import { encode } from '#utilities/serialize';
import { findRecord } from '../../udsp/dis/index.js';
import { resolve } from 'path';
import { write } from '#utilities/file';
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
			return get(key, this.object);
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
	getCipherSuiteMethods() {
		this.cipherSuiteMethods = this.getCipherSuites();
	}
	selectCipherSuite(indexes) {
		const cipherSuiteMethods = this.cipherSuiteMethods;
		const thisCert = this;
		if (isArray(indexes)) {
			let selected;
			untilTrueArray(indexes, (index) => {
				selected = this.getCipherSuite(index);
				return hasValue(selected);
			});
			return selected;
		}
		return this.getCipherSuite(indexes);
	}
	getHash() {
		if (this?.object?.signature) {
			return this.object.signature;
		}
	}
	encodeArray() {
		return [this.array, this.getSignature()];
	}
	encodePublic() {
		return encode(this.getPublic());
	}
	encode() {
		return encode(this.object);
	}
	async save(certificateName, savePath) {
		const saved = await this.saveToFile({
			certificate: this.encode(),
			savePath,
			certificateName
		});
		return saved;
	}
	async savePublic(certificateName, savePath) {
		const saved = await this.saveToFile({
			certificate: this.encodePublic(),
			savePath,
			certificateName
		});
		return saved;
	}
	createSignature() {
		const encodedCertificate = encode(this.array);
		const signatureMethod = getSignatureAlgorithm(this.get('signatureAlgorithm'), this.get('version'));
		const signature = signatureMethod.signDetached(encodedCertificate, this.get('signatureKeypair'));
		return signature;
	}
	getPublic() {
		this.generatePublic();
		const signature = this.getSignature();
		return [this.publicCertificate, signature];
	}
	async saveToFile(config) {
		const {
			certificate,
			savePath,
			certificateName,
		} = config;
		const savePathRoot = `${resolve(`${savePath}`)}/${certificateName}`;
		const fileName = hasDot(savePathRoot) ? savePathRoot : `${savePathRoot}.cert`;
		const result = await write(fileName, isBuffer(certificate) ? certificate : encode(certificate), 'binary', true);
		return result;
	}
	async findRecord(recordType, hostname) {
		return findRecord(this, recordType, hostname);
	}
}
