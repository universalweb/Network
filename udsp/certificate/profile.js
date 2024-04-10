import {
	assign,
	clone,
	hasValue,
	isBuffer,
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
import { read, write } from '#file';
import { saveCertificate, saveProfile } from './save.js';
import { blake3 } from '@noble/hashes/blake3';
import { keychainSave } from '#udsp/certificate/keychain';
export function createProfileCertificateObject(config = {}, options = {}) {
	const currentDate = new Date();
	const type = 1;
	const {
		end,
		version = currentCertificateVersion,
		signatureAlgorithm,
		signatureKeypair,
		keyExchangeAlgorithm,
		cipherSuites,
		keyExchangeKeypair,
		protocolOptions,
		account,
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
	if (account) {
		certificate.account = account;
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
	const signatureMethod = getSignatureAlgorithm(certificate.signatureAlgorithm, protocolVersion);
	if (!signatureKeypair) {
		certificate.signatureKeypair = signatureMethod.signKeypair();
	}
	const keyExchangeMethod = getCipherSuite(certificate.keyExchangeAlgorithm, protocolVersion);
	if (!keyExchangeKeypair) {
		certificate.keyExchangeKeypair = keyExchangeMethod.keypair();
	}
	return certificate;
}
export function objectToRawProfileCertificate(certificateObject) {
	const {
		account,
		cipherSuites,
		signatureKeypair,
		signatureAlgorithm,
		protocol,
		end,
		start,
		protocolOptions,
		hashAlgorithm,
		keyExchangeKeypair,
	} = certificateObject;
	const certificate = [];
	certificate[0] = 0;
	certificate[1] = currentCertificateVersion;
	certificate[2] = start;
	certificate[3] = end;
	certificate[4] = [
		[
			signatureKeypair.publicKey,
			signatureKeypair.privateKey
		],
	];
	if (hasValue(signatureAlgorithm)) {
		certificate[4][1] = signatureAlgorithm;
	}
	if (hasValue(hashAlgorithm)) {
		certificate[4][2] = hashAlgorithm;
	}
	certificate[5] = [
		[
			keyExchangeKeypair.publicKey,
			keyExchangeKeypair.privateKey
		],
	];
	if (hasValue(cipherSuites)) {
		certificate[5][1] = cipherSuites;
	}
	if (account) {
		certificate[6] = account;
	}
	const protocolVersion = hasValue(protocolOptions?.version) ? protocolOptions.version : currentProtocolVersion;
	if (protocolOptions) {
		const {
			serverConnectionIdSize,
			clientConnectionIdSize,
		} = protocolOptions;
		certificate[10] = [protocolVersion];
		if (hasValue(serverConnectionIdSize)) {
			certificate[10][1] = serverConnectionIdSize;
		}
		if (hasValue(clientConnectionIdSize))	{
			certificate[10][2] = clientConnectionIdSize;
		}
	}
	const encodedCertificate = encode(certificate);
	const signatureMethod = getSignatureAlgorithm(certificate.signatureAlgorithm, protocolVersion);
	const signature = signatureMethod.signDetached(encodedCertificate, signatureKeypair);
	console.log(signature.length);
	certificate.push(signature);
	return certificate;
}
export function convertToProfileCertificateObject(rawObject) {
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
			signatureAlgorithm = 0,
			hashAlgorithm = 0,
		],
		[
			keyExchangeKeypair,
			cipherSuites = 0,
		],
		entity,
		records,
		contact,
		protocolOptions = []
	] = rawObject;
	const certificate = {
		type,
		version,
		start,
		end,
		signatureKeypair: {
			publicKey: signatureKeypair[0],
			privateKey: signatureKeypair[1],
			signatureAlgorithm,
			hashAlgorithm,
		},
		keyExchangeKeypair: {
			publicKey: keyExchangeKeypair[0],
			privateKey: keyExchangeKeypair[1],
			cipherSuites,
		},
		signature
	};
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
export async function createProfileCertificate(config, options) {
	const certificateObject = objectToRawProfileCertificate(config, options);
	const certificate = convertToProfileCertificateObject(certificateObject);
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
const exampleCert = createProfileCertificateObject({
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
const exampleRawCert = objectToRawProfileCertificate(exampleCert);
const exampleCertObject = convertToProfileCertificateObject(exampleRawCert);
console.log(exampleRawCert, exampleCertObject, encode(exampleRawCert).length - 120);
