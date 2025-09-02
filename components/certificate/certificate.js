import {
	assign,
	clone,
	eachArray,
	get,
	hasDot,
	hasValue,
	isArray,
	isBuffer,
	isNumber,
	isPlainObject,
	isString,
	last,
	merge,
	untilTrueArray,
} from '@universalweb/utilitylib';
import { decode, encodeStrict } from '#utilities/serialize';
import {
	getCipher,
	getCiphers,
	getKeyExchangeAlgorithm,
	getSignatureAlgorithm,
} from '#crypto/index.js';
import { hash256, hash512 } from '#utilities/cryptography/hash/shake256';
import dis from '#components/dis/index';
import { readStructured } from '#file';
import { resolve } from 'path';
import { write } from '#utilities/file';
export class Certificate {
	constructor(config) {
		return this.initialize(config);
	}
	async initialize(source) {
		if (isPlainObject(source)) {
			await this.merge(source);
		} else if (isString(source)) {
			const sourceDecoded = await readStructured(source);
			await this.merge(sourceDecoded);
		} else if (isBuffer(source)) {
			const sourceDecoded = await decode(source);
			await this.merge(sourceDecoded);
		}
		return this;
	}
	async loadCryptography() {
		await this.setCipherMethods();
		await this.setKeyExchangeAlgorithm();
		await this.setSignatureAlgorithm();
		return this;
	}
	merge(source) {
		if (source) {
			merge(this.object, source);
		}
		return this;
	}
	set(key, value) {
		this.object.data[key] = value;
	}
	get(key) {
		if (key) {
			return get(key, this.object.data);
		}
		return this.object.data;
	}
	getProtocolVersion() {
		return this.object?.data.protocolOptions?.version;
	}
	getCertificateVersion() {
		return this.object?.data.version;
	}
	getSignatureAlgorithm() {
		return getSignatureAlgorithm(this.object.data.signatureAlgorithm, this.getCertificateVersion());
	}
	getKeyExchangeAlgorithm() {
		return getKeyExchangeAlgorithm(this?.object?.data.keyExchangeAlgorithm, this.getCertificateVersion());
	}
	setKeyExchangeAlgorithm() {
		this.keyExchangeAlgorithm = this.getKeyExchangeAlgorithm();
	}
	setSignatureAlgorithm() {
		this.signatureAlgorithm = this.getSignatureAlgorithm();
	}
	async getCiphers() {
		return getCiphers(this.object.data.ciphers, this.getProtocolVersion());
	}
	async setCipherMethods() {
		const source = this;
		this.cipherMethods = await this.getCiphers();
		this.cipherMethods.forEach((item) => {
			source.availableCiphers[item.id] = item;
		});
		this.maxCipherId = last(this.cipherMethods)?.id;
	}
	getCipher(id = 0) {
		if (isNumber(id) && id >= 0 && id <= this.maxCipherId) {
			return this.availableCiphers[id];
		}
	}
	selectCipher(id) {
		if (hasValue(id)) {
			return this.getCipher(id);
		}
		return this.cipherMethods[0];
	}
	// TODO: ADD FOR MOBILE/EMBED CIPHER CHOICE AS FUNCTION INSTEAD OF FIND
	getFastestCipher() {
		let fastest = this.cipherMethods[0];
		eachArray(this.cipherMethods, (cipher) => {
			if (cipher.speed > fastest.speed) {
				fastest = cipher;
			}
		});
		return fastest;
	}
	getMostSecureCipher() {
		let mostSecure = this.cipherMethods[0];
		eachArray(this.cipherMethods, (cipher) => {
			if (cipher.security > mostSecure.security) {
				mostSecure = cipher;
			}
		});
		return mostSecure;
	}
	async getHash() {
		return hash512(await this.encodePublic());
	}
	async encodePublic() {
		await this.getPublic();
		return encodeStrict(this.publicCertificate);
	}
	async encode() {
		return encodeStrict(this.object);
	}
	async save(savePath, certificateName = 'private') {
		const saved = await this.saveToFile(savePath, certificateName);
		return saved;
	}
	async savePublic(savePath, certificateName = 'public') {
		const saved = await this.saveToFile(savePath, certificateName, await this.encodePublic());
		return saved;
	}
	async getSignature() {
		if (!this.publicCertificate) {
			await this.generatePublic();
		}
		const encodedCertificate = await encodeStrict(this.publicCertificate);
		console.log('selfSign encodedCertificate', encodedCertificate);
		const signatureAlgorithm = await getSignatureAlgorithm(await this.get('signatureAlgorithm'), await this.get('version'));
		const signatureKeypair = this.signatureKeypairInstance || await signatureAlgorithm.initializeKeypair(await this.get('signatureKeypair'));
		const signature = await signatureAlgorithm.sign(encodedCertificate, signatureKeypair);
		return signature;
	}
	async selfSign() {
		const signature = await this.getSignature();
		this.object.selfSignature = signature;
		return signature;
	}
	async verifyOwnerSignature() {
		const signatureKeypairObject = await this.get('signatureKeypair');
		// console.log('signatureKeypairObject', signatureKeypairObject);
		const signatureKeypair = this.signatureKeypairInstance || await this.signatureAlgorithm.initializeKeypair(signatureKeypairObject);
		// console.log('signatureKeypair', signatureKeypair);
		const selfSignature = this.object.selfSignature;
		const encodedCertificate = await encodeStrict(this.object);
		// console.log('encodedCertificate', encodedCertificate);
		const signatureMethod = await this.signatureAlgorithm;
		const verifyStatus = await signatureMethod.verifySignature(selfSignature, encodedCertificate, signatureKeypair);
		// console.log('verifyStatus', verifyStatus);
		return verifyStatus;
	}
	async getPublicDomainCertificate() {
		const publicCertificate = clone(this.object);
		publicCertificate.data.signatureKeypair = publicCertificate.data.signatureKeypair.publicKey;
		publicCertificate.data.keyExchangeKeypair = publicCertificate.data.keyExchangeKeypair.publicKey;
		// console.log(publicCertificate);
		return publicCertificate;
	}
	async generatePublic() {
		this.publicCertificate = await this.getPublicDomainCertificate();
		return this.publicCertificate;
	}
	async getPublic() {
		await this.selfSign();
		await this.generatePublic();
		return this.publicCertificate;
	}
	async saveToFile(savePath, certificateName, contents) {
		const savePathRoot = `${resolve(`${savePath}`)}/${certificateName}`;
		const fileName = hasDot(savePathRoot) ? savePathRoot : `${savePathRoot}.cert`;
		const result = await write(fileName, contents || await this.encode(), 'binary', true);
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
	availableCiphers = {};
	object = {
		data: {},
	};
}
export default Certificate;
