import {
	assign,
	clone,
	cloneArray,
	hasValue,
	isArray,
	isBuffer,
	isPlainObject,
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
import { getCipherSuite, getPublicKeyAlgorithm } from '../cryptoMiddleware/index.js';
import {
	hash,
	keypair,
	signDetached,
	signKeypair,
	signVerifyDetached,
	toBase64
} from '#crypto';
import { imported, logCert } from '#logs';
import { read, write } from '#file';
import { saveCertificate, saveProfile } from './save.js';
import { blake3 } from '@noble/hashes/blake3';
import { keychainSave } from '#udsp/certificate/keychain';
export function createSignature(certificate) {
	const encodedCertificate = encode(certificate);
	const signatureMethod = getPublicKeyAlgorithm(certificate.signatureAlgorithm, certificate[10]?.[0]);
	const signature = signatureMethod.signDetached(encodedCertificate, certificate[5]);
	return signature;
}
export function createDomainCertificateObject(config = {}, options = {}) {
	const currentDate = new Date();
	const type = 0;
	const {
		entity,
		records,
		end,
		version = currentCertificateVersion,
		signatureAlgorithm,
		signatureKeypair,
		keyExchangeAlgorithm,
		contact,
		cipherSuites,
		keyExchangeKeypair,
		protocolOptions,
		hashAlgorithm
	} = config;
	const certificate = {
		version,
		signatureKeypair,
		keyExchangeKeypair,
		start: currentDate.getTime(),
		end: end || currentDate.setUTCMonth(currentDate.getUTCMonth() + 3),
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
	if (hasValue(hashAlgorithm) && hashAlgorithm !== 0) {
		certificate.hashAlgorithm = hashAlgorithm;
	}
	if (hasValue(cipherSuites) && cipherSuites !== 0) {
		certificate.cipherSuites = cipherSuites;
	}
	const signatureMethod = getPublicKeyAlgorithm(certificate.signatureAlgorithm, protocolVersion);
	if (!signatureKeypair) {
		certificate.signatureKeypair = signatureMethod.signKeypair();
	}
	const keyExchangeMethod = getCipherSuite(certificate.keyExchangeAlgorithm, protocolVersion);
	if (!keyExchangeKeypair) {
		certificate.keyExchangeKeypair = keyExchangeMethod.keypair();
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
		keyExchangeKeypair,
		contact,
		ownerHash,
		hashAlgorithm
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
	];
	if (hasValue(signatureAlgorithm)) {
		certificate[5][1] = signatureAlgorithm;
	}
	if (hasValue(hashAlgorithm)) {
		certificate[5][2] = hashAlgorithm;
	}
	certificate[6] = [
		[
			keyExchangeKeypair.publicKey,
			keyExchangeKeypair.privateKey
		],
	];
	if (hasValue(cipherSuites)) {
		certificate[6][1] = cipherSuites;
	}
	if (entity) {
		certificate[7] = entity;
	}
	if (records) {
		certificate[8] = records;
	}
	if (protocolOptions) {
		const {
			serverConnectionIdSize,
			clientConnectionIdSize,
		} = protocolOptions;
		certificate[9] = [protocolOptions?.version];
		if (hasValue(serverConnectionIdSize)) {
			certificate[9][1] = serverConnectionIdSize;
		}
		if (hasValue(clientConnectionIdSize))	{
			certificate[9][2] = clientConnectionIdSize;
		}
	}
	if (options) {
		certificate[10] = options;
	}
	if (contact) {
		certificate[11] = contact;
	}
	return certificate;
}
export function getPublicCertificate(certificate) {
	const publicCertificate = cloneArray(certificate);
	publicCertificate[5] = publicCertificate[5][0][0];
	publicCertificate[6] = publicCertificate[6][0][0];
	return certificate;
}
export function rawToObjectDomainCertificate(rawObject) {
	const rawObjectLength = rawObject.length;
	const signature = rawObject.pop();
	const [
		type,
		version,
		start,
		end,
		ownerHash,
		[
			signatureKeypair,
			signatureAlgorithm,
			hashAlgorithm,
		],
		[
			keyExchangeKeypair,
			cipherSuites,
		],
		entity,
		records,
		protocolOptions = [],
		options,
		contact,
	] = rawObject;
	const certificate = {
		type,
		version,
		start,
		end,
		signatureKeypair: {
			publicKey: signatureKeypair[0],
			privateKey: signatureKeypair[1],
		},
		keyExchangeKeypair: {
			publicKey: keyExchangeKeypair[0],
			privateKey: keyExchangeKeypair[1],
		},
		signature
	};
	if (signatureAlgorithm) {
		certificate.signatureAlgorithm = signatureAlgorithm;
	}
	if (hashAlgorithm) {
		certificate.hashAlgorithm = hashAlgorithm;
	}
	if (cipherSuites) {
		certificate.cipherSuites = cipherSuites;
	}
	if (signature) {
		certificate.signature = signature;
	}
	const [
		protocolVersion = currentProtocolVersion,
		serverConnectionIdSize = defaultServerConnectionIdSize,
		clientConnectionIdSize = defaultClientConnectionIdSize,
	] = protocolOptions;
	certificate.protocolOptions = {
		protocolVersion,
		serverConnectionIdSize,
		clientConnectionIdSize,
	};
	if (records) {
		certificate.records = records;
	}
	if (contact) {
		certificate.contact = contact;
	}
	return certificate;
}
export async function createDomainCertificate(config, options) {
	const certificateObject = objectToRawDomainCertificate(config, options);
	const certificate = rawToObjectDomainCertificate(certificateObject);
	const {
		savePath,
		certificateName
	} = config;
	if (config.savePath) {
		await saveCertificate({
			certificate,
			savePath,
			certificateName
		});
	}
	return certificate;
}
const exampleCert = createDomainCertificateObject({
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
	// records: [
	// 	'::1',
	// 	8888
	// ],
});
class DomainCertificate {
	constructor(config) {
		return this.initialize(config);
	}
	async initialize(config) {
		if (isArray(config)) {
			this.raw = config;
			this.object = await rawToObjectDomainCertificate(this.raw);
		} else if (isPlainObject(config)) {
			this.object = await createDomainCertificateObject(this.config);
			this.raw = objectToRawDomainCertificate(this.object);
		}
	}
	async update(config) {
		this.config = merge(this.config, config);
		await this.generate();
	}
	async generate() {
		this.object = await createDomainCertificateObject(this.config);
		this.raw = objectToRawDomainCertificate(this.object);
	}
	async save(certificateName, savePath) {
		const saved = await saveCertificate({
			certificate: this.certificate,
			savePath,
			certificateName
		});
		return saved;
	}
}
const exampleRawCert = objectToRawDomainCertificate(exampleCert);
const exampleCertObject = rawToObjectDomainCertificate(exampleRawCert);
console.log(exampleRawCert, exampleCertObject, encode(exampleRawCert).length - 120);
