import {
	assign,
	clone,
	cloneArray,
	currentPath,
	hasValue,
	isArray,
	isBuffer,
	isPlainObject,
	isString,
	merge,
	promise
} from '@universalweb/acid';
import { decode, encode } from '#utilities/serialize';
import { getCipher, getKeyExchangeAlgorithm, getSignatureAlgorithm } from '#crypto/index.js';
import { read, readStructured, write } from '#file';
import { UWCertificate } from './UWCertificate.js';
import certificateDefaults from '../certificate/defaults.js';
import { keychainSave } from './keychain.js';
import protocolDefaults from '../udsp/defaults.js';
import { toBase64 } from '#utilities/cryptography/utils';
const { protocolVersion: currentProtocolVersion } = protocolDefaults;
const {
	certificateTypes,
	certificateVersion: currentCertificateVersion,
} = certificateDefaults;
const domainCertificateType = certificateTypes.get('domain');
// TODO: ADD IMPORT METHOD FOR KEYS TO LOAD AND SHOW CORRECTLY
// TODO: ADD EXPORT METHOD FOR KEYS TO SAVE AND SHOW CORRECTLY
// TODO: CONSIDER INT BASED RECORD TYPES INSTEAD OF STRINGS
export async function createDomainCertificateObject(config = {}, options = {}) {
	const currentDate = new Date();
	const {
		certificateType = domainCertificateType,
		entity,
		records,
		version = currentCertificateVersion,
		signatureAlgorithm = 0,
		signatureKeypair,
		contact,
		ciphers,
		keyExchangeKeypair,
		ownerHash,
		protocolOptions,
		start = currentDate.getTime(),
		end = currentDate.setUTCMonth(currentDate.getUTCMonth() + 3),
		keyExchangeAlgorithm = 0
	} = config;
	const certificate = {
		version,
		signatureKeypair,
		keyExchangeKeypair,
		start,
		end,
		certificateType,
		keyExchangeAlgorithm
	};
	if (ownerHash) {
		certificate.ownerHash = ownerHash;
	}
	if (hasValue(protocolOptions)) {
		certificate.protocolOptions = protocolOptions;
	}
	if (certificate.start > certificate.end) {
		certificate.end = currentDate.setUTCMonth(currentDate.getUTCMonth() + 3);
	}
	if (entity) {
		certificate.entity = entity;
	}
	if (records) {
		certificate.records = records;
	}
	if (contact) {
		certificate.contact = contact;
	}
	const protocolVersion = hasValue(protocolOptions?.version) ? protocolOptions.version : currentProtocolVersion;
	if (hasValue(signatureAlgorithm) && signatureAlgorithm !== 0) {
		certificate.signatureAlgorithm = signatureAlgorithm;
	}
	const signatureMethod = await getSignatureAlgorithm(certificate.signatureAlgorithm, protocolVersion);
	certificate.signatureAlgorithm = await signatureMethod.id;
	if (!signatureKeypair) {
		certificate.signatureKeypair = await signatureMethod.certificateSignatureKeypair();
	}
	const keyExchangeMethod = await getKeyExchangeAlgorithm(keyExchangeAlgorithm, protocolVersion);
	certificate.keyExchangeAlgorithm = await keyExchangeMethod.id;
	console.log('ciphers', ciphers, keyExchangeAlgorithm, keyExchangeMethod);
	if (!keyExchangeKeypair) {
		certificate.keyExchangeKeypair = await keyExchangeMethod.certificateKeyExchangeKeypair();
	}
	if (hasValue(ciphers) && ciphers !== 0) {
		certificate.ciphers = ciphers;
	} else {
		certificate.ciphers = keyExchangeMethod.ciphers;
	}
	// console.log('certificate', certificate);
	return certificate;
}
export function objectToRawDomainCertificate(certificateObject) {
	const {
		entity,
		ciphers,
		signatureKeypair,
		signatureAlgorithm = 0,
		records,
		end,
		start,
		protocolOptions,
		options,
		keyExchangeKeypair,
		contact,
		ownerHash = false,
		certificateType,
		keyExchangeAlgorithm = 0,
	} = certificateObject;
	const certificate = [];
	certificate[0] = certificateType;
	certificate[1] = currentCertificateVersion;
	certificate[2] = start;
	certificate[3] = end;
	certificate[4] = ownerHash;
	certificate[5] = [
		[
			signatureAlgorithm, signatureKeypair.publicKey, signatureKeypair.privateKey
		],
		[
			keyExchangeAlgorithm, keyExchangeKeypair.publicKey, keyExchangeKeypair.privateKey
		],
	];
	if (hasValue(ciphers)) {
		certificate[5][2] = ciphers;
	}
	if (entity) {
		certificate[6] = entity;
	}
	if (records) {
		certificate[7] = records;
	}
	if (protocolOptions) {
		certificate[8] = [protocolOptions?.version || currentProtocolVersion, protocolOptions.realtime];
	}
	if (options) {
		certificate[9] = options;
	}
	if (contact) {
		certificate[10] = contact;
	}
	return certificate;
}
export function getPublicDomainCertificate(certificate) {
	const publicCertificate = clone(certificate);
	publicCertificate[5][0] = [publicCertificate[5][0][0], publicCertificate[5][0][1]];
	publicCertificate[5][1] = [publicCertificate[5][1][0], publicCertificate[5][1][1]];
	// console.log(publicCertificate);
	return publicCertificate;
}
export async function rawToObjectDomainCertificate(rawObject, selfSignature, signatures) {
	const rawObjectLength = rawObject.length;
	const [
		certificateType,
		version,
		start,
		end,
		ownerHash,
		[
			signatureKeypair,
			keyExchangeKeypair,
			ciphers,
		],
		entity,
		records,
		protocolOptions,
		options,
		contact,
	] = rawObject;
	const certificate = {
		certificateType,
		version,
		start,
		end,
		ownerHash,
		entity,
	};
	if (isArray(signatureKeypair)) {
		certificate.signatureKeypair = {
			publicKey: signatureKeypair[1]
		};
		certificate.signatureAlgorithm = signatureKeypair[0];
		if (signatureKeypair[2]) {
			certificate.signatureKeypair.privateKey = signatureKeypair[2];
		}
	}
	if (isArray(keyExchangeKeypair)) {
		certificate.keyExchangeAlgorithm = keyExchangeKeypair[0];
		certificate.keyExchangeKeypair = {
			publicKey: keyExchangeKeypair[1],
		};
		if (keyExchangeKeypair[2]) {
			certificate.keyExchangeKeypair.privateKey = keyExchangeKeypair[2];
		}
	}
	if (selfSignature) {
		certificate.selfSignature = selfSignature;
	}
	if (signatures) {
		certificate.signatures = signatures;
	}
	if (ciphers) {
		certificate.ciphers = ciphers;
	}
	if (protocolOptions) {
		const [
			protocolVersion,
			realtime
		] = protocolOptions;
		certificate.protocolOptions = {};
		if (hasValue(protocolVersion)) {
			certificate.protocolOptions.protocolVersion = protocolVersion;
		} else {
			certificate.protocolOptions.protocolVersion = currentProtocolVersion;
		}
		if (hasValue(realtime)) {
			certificate.protocolOptions.realtime = realtime;
		}
	}
	if (records) {
		certificate.records = records;
	}
	if (contact) {
		certificate.contact = contact;
	}
	// console.log(certificate);
	return certificate;
}
export class DomainCertificate extends UWCertificate {
	async initialize(config) {
		if (isPlainObject(config)) {
			this.object = await createDomainCertificateObject(config);
			this.update();
		} else if (isString(config)) {
			const source = await readStructured(config);
			await this.processAsObject(source);
		} else if (isArray(config)) {
			this.array = config;
			this.object = await rawToObjectDomainCertificate(config);
		} else if (isBuffer(config)) {
			const source = decode(config);
			await this.processAsObject(source);
		}
		return this;
	}
	async processAsObject(source) {
		if (isPlainObject(source)) {
			this.object = source;
		} else if (isArray(source[0])) {
			this.array = source[0];
			this.object = await rawToObjectDomainCertificate(this.array, source[1]);
		} else {
			this.array = source;
			this.object = await rawToObjectDomainCertificate(source);
		}
	}
	update(config) {
		if (config) {
			assign(this.object, config);
		}
		this.array = objectToRawDomainCertificate(this.object);
	}
	generatePublic() {
		this.publicCertificate = getPublicDomainCertificate(this.array);
		// console.log(this.publicCertificate);
	}
	async getSignature() {
		if (!this.publicCertificate) {
			await this.generatePublic();
		}
		const signature = await this.selfSign();
		return signature;
	}
}
export async function domainCertificate(...args) {
	return new DomainCertificate(...args);
}
export class PublicDomainCertificate extends UWCertificate {
	async initialize(config) {
		const source = isString(config) ? await readStructured(config) : config;
		const sourceDecoded = isBuffer(source) ? await decode(source) : source;
		const [
			certificateData,
			selfSignature,
			...signatures
		] = sourceDecoded;
		console.log('sourceDecoded', sourceDecoded);
		this.array = (isBuffer(certificateData)) ? await decode(certificateData) : certificateData;
		console.log('certificateData', this.array);
		this.object = await rawToObjectDomainCertificate(this.array, selfSignature, signatures);
		await this.setCipherMethods();
		await this.setKeyExchangeAlgorithm();
		await this.setSignatureAlgorithm();
		return this;
	}
	async verifySelfSignature() {
		const signatureKeypairObject = this.get('signatureKeypair');
		// console.log('signatureKeypairObject', signatureKeypairObject);
		const signatureKeypair = this.signatureKeypairInstance || await this.signatureAlgorithm.initializeKeypair(signatureKeypairObject);
		// console.log('signatureKeypair', signatureKeypair);
		const selfSignature = this.object.selfSignature;
		const encodedCertificate = encode(this.array);
		// console.log('encodedCertificate', encodedCertificate);
		const signatureMethod = await this.signatureAlgorithm;
		const verifyStatus = await signatureMethod.verifySignature(selfSignature, encodedCertificate, signatureKeypair);
		// console.log('verifyStatus', verifyStatus);
		return verifyStatus;
	}
}
export async function publicDomainCertificate(...args) {
	return new PublicDomainCertificate(...args);
}
// const thisPath = currentPath(import.meta);
// const exampleCert = await domainCertificate({
// 	entity: 'universalweb.io',
// 	// ownerHash: profile.getSignature(),
// 	signatureAlgorithm: 6,
// 	ciphers: [
// 		0,
// 		// 1,
// 	],
// 	keyExchangeAlgorithm: 1,
// 	protocolOptions: {
// 		realtime: true,
// 	},
// 	records: [
// 		[
// 			'aaaa',
// 			'@',
// 			'::1',
// 			8888,
// 			// PRIORITY
// 			0,
// 			// GEOLOCATION FEATURE FOR GEO PRIORITIZATION
// 			// '27.950575 -82.457176'
// 		],
// 		[
// 			'a',
// 			'@',
// 			'127.0.0.1',
// 			8888,
// 			// PRIORITY
// 			0,
// 			// GEOLOCATION FEATURE FOR GEO PRIORITIZATION
// 			// '27.950575 -82.457176'
// 		],
// 	],
// });
// console.log(exampleCert);
// console.log(exampleCert.get('signatureKeypair'));
// console.log(exampleCert.get('keyExchangeKeypair'));
// const pubCert = await exampleCert.getPublic();
// console.log(pubCert);
// const pubCertLoaded = await publicDomainCertificate(pubCert);
// console.log(pubCertLoaded);
// console.log(await pubCertLoaded.verifySelfSignature());
// console.log(pubCert[1].length);
// await exampleCert.savePublic('domainPublicCert', `${thisPath}/cache/`);
// await exampleCert.save('domain', `${thisPath}/cache/`);
// console.log(exampleCert);
// console.log(await new PublicDomainCertificate(`${thisPath}/cache/domainPublicCert.cert`));
// console.log(await new DomainCertificate(`${thisPath}/cache/domain.cert`));
