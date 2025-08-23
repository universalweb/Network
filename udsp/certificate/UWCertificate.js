import {
	eachArray,
	get,
	hasDot,
	hasValue,
	isArray,
	isBuffer,
	isNumber,
	untilTrueArray
} from '@universalweb/utilitylib';
import {
	getCipherSuite,
	getCipherSuites,
	getEncryptionKeypairAlgorithm,
	getSignatureAlgorithm
} from '../cryptoMiddleware/index.js';
import { encode } from '#utilities/serialize';
import { findRecord } from '../dis/index.js';
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
		return getEncryptionKeypairAlgorithm(this?.object?.encryptionKeypairAlgorithm, this.getCertificateVersion());
	}
	setEncryptionKeypairAlgorithm() {
		this.encryptionKeypairAlgorithm = this.getEncryptionKeypairAlgorithm();
		if (this.encryptionKeypairAlgorithm?.prepareKeypair) {
			this.encryptionKeypairAlgorithm.prepareKeypair(this);
		}
	}
	getCipherSuite(suiteID) {
		if (!this.cipherSuiteMethods) {
			this.setCipherSuiteMethods();
		}
		if (hasValue(suiteID)) {
			const target = this.cipherSuiteMethods.find((item) => {
				return item.id === suiteID;
			});
			return target;
		}
		return this.cipherSuiteMethods[0];
	}
	getCipherSuites() {
		return getCipherSuites(this.object.cipherSuites, this.getProtocolVersion());
	}
	setCipherSuiteMethods() {
		const source = this;
		this.cipherSuiteMethods = this.getCipherSuites();
		this.cipherSuiteMethods.forEach((item) => {
			source[`hashCipherSuite${item.id}`] = true;
		});
	}
	findCipherSuiteMethod(id) {
		if (!this.cipherSuiteMethods) {
			this.getCipherSuiteMethods();
		}
		return this.cipherSuiteMethods.find((cipherSuite) => {
			return cipherSuite.id === id;
		});
	}
	selectCipherSuite(id) {
		if (!this.cipherSuiteMethods) {
			this.getCipherSuiteMethods();
		}
		const cipherSuiteMethods = this.cipherSuiteMethods;
		const thisCert = this;
		if (hasValue(id)) {
			return this.findCipherSuiteMethod(id);
		}
		return this.cipherSuiteMethods[0];
	}
	getFastestCipherSuite() {
		let fastest = this.cipherSuiteMethods[0];
		eachArray(this.cipherSuiteMethods, (cipherSuite) => {
			if (cipherSuite.speed > fastest.speed) {
				fastest = cipherSuite;
			}
		});
		return fastest;
	}
	getMostSecureCipherSuite() {
		let mostSecure = this.cipherSuiteMethods[0];
		eachArray(this.cipherSuiteMethods, (cipherSuite) => {
			if (cipherSuite.security > mostSecure.security) {
				mostSecure = cipherSuite;
			}
		});
		return mostSecure;
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
		const signature = signatureMethod.sign(encodedCertificate, this.get('signatureKeypair'));
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
