import {
	eachArray,
	get,
	hasDot,
	hasValue,
	isArray,
	isBuffer,
	isNumber,
	untilTrueArray
} from '@universalweb/acid';
import { encode, encodeStrict } from '#utilities/serialize';
import {
	getCipher,
	getCiphers,
	getKeyExchangeAlgorithm,
	getSignatureAlgorithm
} from '#crypto/index.js';
import dis from '#components/dis/index';
import { resolve } from 'path';
import { write } from '#utilities/file';
export class Certificate {
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
	getKeyExchangeAlgorithm() {
		return getKeyExchangeAlgorithm(this?.object?.keyExchangeAlgorithm, this.getCertificateVersion());
	}
	setKeyExchangeAlgorithm() {
		this.keyExchangeAlgorithm = this.getKeyExchangeAlgorithm();
	}
	setSignatureAlgorithm() {
		this.signatureAlgorithm = this.getSignatureAlgorithm();
	}
	getCipher(cipherId) {
		if (!this.cipherMethods) {
			this.setCipherMethods();
		}
		if (hasValue(cipherId)) {
			const target = this.cipherMethods.find((item) => {
				return item.id === cipherId;
			});
			return target;
		}
		return this.cipherMethods[0];
	}
	getCiphers() {
		return getCiphers(this.object.ciphers, this.getProtocolVersion());
	}
	setCipherMethods() {
		const source = this;
		this.cipherMethods = this.getCiphers();
		this.cipherMethods.forEach((item) => {
			source[item.id] = true;
		});
	}
	findCipherSuiteMethod(id) {
		if (!this.cipherMethods) {
			this.getcipherMethods();
		}
		return this.cipherMethods.find((cipher) => {
			return cipher.id === id;
		});
	}
	selectCipherSuite(id) {
		if (!this.cipherMethods) {
			this.getcipherMethods();
		}
		const cipherMethods = this.cipherMethods;
		const thisCert = this;
		if (hasValue(id)) {
			return this.findCipherSuiteMethod(id);
		}
		return this.cipherMethods[0];
	}
	getFastestCipherSuite() {
		let fastest = this.cipherMethods[0];
		eachArray(this.cipherMethods, (cipher) => {
			if (cipher.speed > fastest.speed) {
				fastest = cipher;
			}
		});
		return fastest;
	}
	getMostSecureCipherSuite() {
		let mostSecure = this.cipherMethods[0];
		eachArray(this.cipherMethods, (cipher) => {
			if (cipher.security > mostSecure.security) {
				mostSecure = cipher;
			}
		});
		return mostSecure;
	}
	getHash() {
		if (this?.object?.signature) {
			return this.object.signature;
		}
	}
	async encodeArray() {
		return [this.array, await this.getSignature()];
	}
	async encodePublic() {
		const publicCertificate = await this.getPublic();
		return encodeStrict(publicCertificate);
	}
	async encode() {
		return encodeStrict(this.object);
	}
	async save(certificateName, savePath) {
		const saved = await this.saveToFile({
			certificate: await this.encode(),
			savePath,
			certificateName
		});
		return saved;
	}
	async savePublic(certificateName, savePath) {
		const certificate = await this.encodePublic();
		const saved = await this.saveToFile({
			certificate,
			savePath,
			certificateName
		});
		return saved;
	}
	async selfSign() {
		const encodedCertificate = await encodeStrict(this.publicCertificate);
		console.log('selfSign encodedCertificate', encodedCertificate);
		const signatureAlgorithm = getSignatureAlgorithm(this.get('signatureAlgorithm'), this.get('version'));
		const signatureKeypair = this.signatureKeypairInstance || await signatureAlgorithm.initializeKeypair(this.get('signatureKeypair'));
		const signature = await signatureAlgorithm.sign(encodedCertificate, signatureKeypair);
		return signature;
	}
	async getPublic() {
		await this.generatePublic();
		const signature = await this.getSignature();
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
		const contents = isBuffer(certificate) ? certificate : await encodeStrict(certificate);
		const result = await write(fileName, contents, 'binary', true);
		return result;
	}
	async findRecord(recordType, hostname) {
		return dis.findRecord(this, recordType, hostname);
	}
	signatureKeypair() {
		const algo = this.getSignatureAlgorithm();
		const keypair = this.get('signatureKeypair');
		if (algo) {
			return algo?.exportKeypair(keypair) || keypair;
		}
	}
	keyExchangeKeypair() {
		const algo = this.getKeyExchangeAlgorithm();
		const keypair = this.get('keyExchangeAlgorithm');
		if (algo) {
			return algo?.exportKeypair(keypair) || keypair;
		}
	}
}
