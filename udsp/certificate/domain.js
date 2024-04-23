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
import {
	certificateTypes,
	currentCertificateVersion,
	currentProtocolVersion,
} from '../defaults.js';
import { decode, encode } from '#utilities/serialize';
import { getCipherSuite, getSignatureAlgorithm } from '../cryptoMiddleware/index.js';
import {
	hash,
	keypair,
	signDetached,
	signKeypair,
	signVerifyDetached,
	toBase64
} from '#crypto';
import { imported, logCert } from '#logs';
import { read, readStructure, write } from '#file';
import { UWCertificate } from './UWCertificate.js';
import { blake3 } from '@noble/hashes/blake3';
import { keychainSave } from '#udsp/certificate/keychain';
import { uwProfile } from './profile.js';
const type = certificateTypes.get('domain');
export function createDomainCertificateObject(config = {}, options = {}) {
	const currentDate = new Date();
	const {
		entity,
		records,
		version = currentCertificateVersion,
		signatureAlgorithm,
		signatureKeypair,
		encryptionKeypairAlgorithm,
		contact,
		cipherSuites,
		encryptionKeypair,
		backupHash,
		protocolOptions,
		start = currentDate.getTime(),
		end = currentDate.setUTCMonth(currentDate.getUTCMonth() + 3)
	} = config;
	const certificate = {
		version,
		signatureKeypair,
		encryptionKeypair,
		start,
		end,
		type,
		backupHash
	};
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
	if (hasValue(encryptionKeypairAlgorithm) && encryptionKeypairAlgorithm !== 0) {
		certificate.encryptionKeypairAlgorithm = encryptionKeypairAlgorithm;
	}
	if (hasValue(cipherSuites) && cipherSuites !== 0) {
		certificate.cipherSuites = cipherSuites;
	}
	const signatureMethod = getSignatureAlgorithm(certificate.signatureAlgorithm, protocolVersion);
	if (!signatureKeypair) {
		certificate.signatureKeypair = signatureMethod.signKeypair();
	}
	const keyExchangeMethod = getCipherSuite(certificate.encryptionKeypairAlgorithm, protocolVersion);
	if (!encryptionKeypair) {
		certificate.encryptionKeypair = keyExchangeMethod.keypair();
	}
	return certificate;
}
export function objectToRawDomainCertificate(certificateObject) {
	const {
		entity,
		cipherSuites,
		signatureKeypair,
		signatureAlgorithm,
		records,
		end,
		start,
		protocolOptions,
		options,
		encryptionKeypair,
		contact,
		backupHash
	} = certificateObject;
	const certificate = [];
	certificate[0] = 0;
	certificate[1] = currentCertificateVersion;
	certificate[2] = start;
	certificate[3] = end;
	certificate[4] = backupHash;
	certificate[5] = [[signatureKeypair.publicKey, signatureKeypair.privateKey], [encryptionKeypair.publicKey, encryptionKeypair.privateKey],];
	if (hasValue(cipherSuites)) {
		certificate[5][2] = cipherSuites;
	}
	if (hasValue(signatureAlgorithm)) {
		certificate[5][3] = signatureAlgorithm;
	}
	if (entity) {
		certificate[6] = entity;
	}
	if (records) {
		certificate[7] = records;
	}
	if (protocolOptions) {
		certificate[8] = [protocolOptions?.version || currentProtocolVersion];
		// Connection ID size Sent to server
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
	publicCertificate[5][0] = publicCertificate[5][0][0];
	publicCertificate[5][1] = publicCertificate[5][1][0];
	return publicCertificate;
}
export function rawToObjectDomainCertificate(rawObject, signature) {
	const rawObjectLength = rawObject.length;
	const [
		certificateType,
		version,
		start,
		end,
		backupHash,
		[
			signatureKeypair,
			encryptionKeypair,
			signatureAlgorithm,
			cipherSuites,
		],
		entity,
		records,
		protocolOptions,
		options,
		contact,
	] = rawObject;
	const certificate = {
		type: certificateType,
		version,
		start,
		end,
		backupHash,
		entity,
	};
	if (isArray(signatureKeypair)) {
		certificate.signatureKeypair = {
			publicKey: signatureKeypair[0],
			privateKey: signatureKeypair[1],
		};
	} else {
		certificate.signatureKeypair = signatureKeypair;
	}
	if (isArray(encryptionKeypair)) {
		certificate.encryptionKeypair = {
			publicKey: encryptionKeypair[0],
			privateKey: encryptionKeypair[1],
		};
	} else {
		certificate.encryptionKeypair = encryptionKeypair;
	}
	if (signature) {
		certificate.signature = signature;
	}
	if (signatureAlgorithm) {
		certificate.signatureAlgorithm = signatureAlgorithm;
	}
	if (cipherSuites) {
		certificate.cipherSuites = cipherSuites;
	}
	if (signature) {
		certificate.signature = signature;
	}
	if (protocolOptions) {
		const [protocolVersion] = protocolOptions;
		certificate.protocolOptions = {};
		if (protocolVersion) {
			certificate.protocolOptions.protocolVersion = protocolVersion;
		}
	}
	if (records) {
		certificate.records = records;
	}
	if (contact) {
		certificate.contact = contact;
	}
	return certificate;
}
export class DomainCertificate extends UWCertificate {
	async initialize(config) {
		if (isPlainObject(config)) {
			this.object = createDomainCertificateObject(config);
			this.update();
		} else if (isString(config)) {
			const source = await readStructure(config);
			this.processAsObject(source);
		} else if (isArray(config)) {
			this.array = config;
			this.object = rawToObjectDomainCertificate(config);
		} else if (isBuffer(config)) {
			const source = decode(config);
			this.processAsObject(source);
		}
		return this;
	}
	processAsObject(source) {
		if (isPlainObject(source)) {
			this.object = source;
		} else if (isArray(source[0])) {
			this.array = source[0];
			this.object = rawToObjectDomainCertificate(this.array, source[1]);
		} else {
			this.array = source;
			this.object = rawToObjectDomainCertificate(source);
		}
	}
	update(config) {
		this.array = objectToRawDomainCertificate(this.object);
	}
	generatePublic() {
		this.publicCertificate = getPublicDomainCertificate(this.array);
	}
	getSignature() {
		if (!this.publicCertificate) {
			this.generatePublic();
		}
		const signature = this.createSignature();
		return signature;
	}
}
export async function domainCertificate(...args) {
	return new DomainCertificate(...args);
}
export class PublicDomainCertificate extends UWCertificate {
	async initialize(config) {
		const source = isString(config) ? await readStructure(config) : config;
		this.array = source[0];
		this.object = rawToObjectDomainCertificate(source[0], source[1]);
		this.getCipherSuiteMethods();
		return this;
	}
}
export async function publicDomainCertificate(...args) {
	return new PublicDomainCertificate(...args);
}
// const thisPath = currentPath(import.meta);
// const profileCert = await uwProfile(`${thisPath}/certificates/profilePublicCert.cert`);
// const exampleCert = await new DomainCertificate({
// 	backupHash: profileCert.get('signature'),
// 	entity: 'universalweb.io',
// 	records: [
// 		[
// 			'a',
// 			'@',
// 			'127.0.0.1',
// 			8888
// 		],
// 		[
// 			'aaaa',
// 			'@',
// 			'::1',
// 			8888
// 		],
// 	],
// });
// const pubCert = exampleCert.getPublic();
// console.log(profileCert, profileCert.get('signature').length);
// await exampleCert.savePublic('domainPublicCert', `${thisPath}/certificates/`);
// await exampleCert.save('domain', `${thisPath}/certificates/`);
// console.log(exampleCert);
// console.log(await new PublicDomainCertificate(`${thisPath}/certificates/domainPublicCert.cert`));
// console.log(await new DomainCertificate(`${thisPath}/certificates/domain.cert`));
