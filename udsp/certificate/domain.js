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
	currentCertificateVersion,
	currentProtocolVersion,
	defaultClientConnectionIdSize,
	defaultServerConnectionIdSize
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
import { saveCertificate, saveProfile } from './save.js';
import { UWCertificate } from './UWCertificate.js';
import { blake3 } from '@noble/hashes/blake3';
import { keychainSave } from '#udsp/certificate/keychain';
export function createSignature(certificate, privateKey) {
	const encodedCertificate = encode(certificate);
	const signatureMethod = getSignatureAlgorithm(certificate.signatureAlgorithm, certificate[10]?.[0]);
	const signature = signatureMethod.signDetached(encodedCertificate, privateKey);
	return signature;
}
export function createDomainCertificateObject(config = {}, options = {}) {
	const currentDate = new Date();
	const type = 0;
	const {
		entity,
		records,
		version = currentCertificateVersion,
		signatureAlgorithm,
		signatureKeypair,
		keyExchangeAlgorithm,
		contact,
		cipherSuites,
		encryptionKeypair,
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
		protocolOptions
	};
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
	if (hasValue(keyExchangeAlgorithm) && keyExchangeAlgorithm !== 0) {
		certificate.keyExchangeAlgorithm = keyExchangeAlgorithm;
	}
	if (hasValue(cipherSuites) && cipherSuites !== 0) {
		certificate.cipherSuites = cipherSuites;
	}
	const signatureMethod = getSignatureAlgorithm(certificate.signatureAlgorithm, protocolVersion);
	if (!signatureKeypair) {
		certificate.signatureKeypair = signatureMethod.signKeypair();
	}
	const keyExchangeMethod = getCipherSuite(certificate.keyExchangeAlgorithm, protocolVersion);
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
		ownerHash
	} = certificateObject;
	const certificate = [];
	certificate[0] = 0;
	certificate[1] = currentCertificateVersion;
	certificate[2] = start;
	certificate[3] = end;
	certificate[4] = ownerHash;
	certificate[5] = [
		[
			signatureKeypair.publicKey,
			signatureKeypair.privateKey
		],
		[
			encryptionKeypair.publicKey,
			encryptionKeypair.privateKey
		],
	];
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
		const {
			serverConnectionIdSize,
			clientConnectionIdSize,
		} = protocolOptions;
		certificate[8] = [protocolOptions?.version];
		if (hasValue(serverConnectionIdSize)) {
			certificate[8][1] = serverConnectionIdSize;
		}
		if (hasValue(clientConnectionIdSize))	{
			certificate[8][2] = clientConnectionIdSize;
		}
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
		type,
		version,
		start,
		end,
		ownerHash,
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
		type,
		version,
		start,
		end,
		encryptionKeypair: {
			publicKey: encryptionKeypair[0],
			privateKey: encryptionKeypair[1],
		}
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
		const [
			protocolVersion,
			serverConnectionIdSize,
			clientConnectionIdSize,
		] = protocolOptions;
		certificate.protocolOptions = {};
		if (protocolVersion) {
			certificate.protocolOptions.protocolVersion = protocolVersion;
		}
		if (serverConnectionIdSize) {
			certificate.protocolOptions.serverConnectionIdSize = serverConnectionIdSize;
		}
		if (clientConnectionIdSize) {
			certificate.protocolOptions.clientConnectionIdSize = clientConnectionIdSize;
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
class DomainCertificate extends UWCertificate {
	async initialize(config) {
		if (isPlainObject(config)) {
			this.object = createDomainCertificateObject(config);
			this.update();
		} else if (isString(config)) {
			const source = await readStructure(config);
			this.array = source[0];
			this.object = rawToObjectDomainCertificate(source[0], source[1]);
		} else if (isArray(config)) {
			this.array = config;
			this.object = rawToObjectDomainCertificate(config);
		}
		return this;
	}
	update(config) {
		this.array = objectToRawDomainCertificate(this.object);
	}
	set(key, value) {
		this.object[key] = value;
		this.update();
	}
	generatePublicCertificate() {
		this.publicCertificate = getPublicDomainCertificate(this.array);
	}
	getPublic() {
		this.generatePublicCertificate();
		const signature = this.getSignature();
		return [
			this.publicCertificate,
			signature
		];
	}
	getSignature() {
		const signature = createSignature(this.publicCertificate, this.object.signatureKeypair.privateKey);
		return signature;
	}
}
async function domainCertificate(...args) {
	return new DomainCertificate(...args);
}
class PublicDomainCertificate extends UWCertificate {
	async initialize(config) {
		const source = isString(config) ? await readStructure(config) : config;
		this.array = source[0];
		this.object = rawToObjectDomainCertificate(source[0], source[1]);
		return this;
	}
	get(key) {
		return this.object[key];
	}
	getSignatureAlgorithm() {
		return getSignatureAlgorithm(this.object.signatureAlgorithm);
	}
	getCipherSuite() {
		return getCipherSuite(this.object.cipherSuites);
	}
}
async function publicDomainCertificate(...args) {
	return new PublicDomainCertificate(...args);
}
const exampleCert = await new DomainCertificate({
	entity: 'universalweb.io',
	records: [
		[
			'a',
			'@',
			'127.0.0.1',
			8888
		],
		[
			'aaaa',
			'@',
			'::1',
			8888
		],
	],
});
const pubCert = exampleCert.getPublic();
const thisPath = currentPath(import.meta);
await exampleCert.savePublic('examplePublicCert', `${thisPath}/certificates/`);
await exampleCert.save('exampleCert', `${thisPath}/certificates/`);
console.log(await new PublicDomainCertificate(`${thisPath}/certificates/exampleCert.cert`));
console.log(await new DomainCertificate(`${thisPath}/certificates/exampleCert.cert`));
