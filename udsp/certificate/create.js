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
import { keychainSave } from '#udsp/certificate/keychain';
// Types: 0: domain, 1: client,  ?2: dis, 3: email, 4: store, 5: product, 6: school, 7: government?
// TODO: Change Public Cert to remove private keys and replace array with publickey?
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
		keyExchangeAlgorithm,
		entity,
		cipherSuites,
		signatureKeypair,
		signatureAlgorithm,
		protocol,
		records,
		end,
		start,
		protocolOptions,
		options,
		keyExchangeKeypair,
		contact,
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
	certificate[5] = [
		[
			keyExchangeKeypair.publicKey,
			keyExchangeKeypair.privateKey
		],
	];
	if (hasValue(keyExchangeAlgorithm)) {
		certificate[5][1] = keyExchangeAlgorithm;
	}
	if (hasValue(cipherSuites)) {
		certificate[5][2] = cipherSuites;
	}
	if (entity) {
		certificate[6] = entity;
	}
	if (records) {
		certificate[7] = records;
	}
	if (contact) {
		certificate[8] = contact;
	}
	const protocolVersion = hasValue(protocolOptions?.version) ? protocolOptions.version : currentProtocolVersion;
	if (protocolOptions) {
		const {
			serverConnectionIdSize,
			clientConnectionIdSize,
		} = protocolOptions;
		certificate[9] = [protocolVersion];
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
	// const encodedCertificate = encode(certificate);
	// const signatureMethod = getPublicKeyAlgorithm(certificate.signatureAlgorithm, protocolVersion);
	// const signature = signatureMethod.signDetached(encodedCertificate, signatureKeypair);
	// console.log(certificate[6], signVerifyDetached(certificate[6], encodedCertificate, signatureKeypair));
	return [certificate];
	// Certificate Blockchain
	// [raw, [CA-certificate , signature], rawSignature]
}
export function convertToDomainCertificateObject(rawObject) {
	const [
		type,
		version,
		start,
		end,
		[
			signatureKeypair,
			signatureAlgorithm = 0,
		],
		[
			keyExchangeKeypair,
			keyExchangeAlgorithm = 0,
			cipherSuites = 0,
		],
		entity,
		records,
		contact,
		protocolOptions = []
	] = rawObject[0];
	const certificate = {
		type,
		version,
		start,
		end,
		signatureKeypair: {
			publicKey: signatureKeypair[0],
			privateKey: signatureKeypair[1],
			signatureAlgorithm,
			cipherSuites,
		},
		keyExchangeKeypair: {
			publicKey: keyExchangeKeypair[0],
			privateKey: keyExchangeKeypair[1],
			keyExchangeAlgorithm,
		},
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
export async function parseRawCertificate(rawCertificate) {
	const [type,] = rawCertificate;
	if (type === 0) {
		return convertToDomainCertificateObject(rawCertificate);
	}
}
export async function createProfile(config) {
	// const {
	// 	template: {
	// 		ephemeral: ephemeralTemplate,
	// 		master: masterTemplate
	// 	},
	// 	savePath,
	// 	certificateName,
	// 	saveProfileToKeychain,
	// 	saveEphemeralToKeychain,
	// 	saveToKeychain,
	// } = config;
	// const master = certificateObjectCreate(masterTemplate);
	// const ephemeral = certificateObjectCreate(ephemeralTemplate, {
	// 	master
	// });
	// const profile = {
	// 	ephemeral,
	// 	master,
	// };
	// console.log(`ephemeral: ${ephemeral.certificate.length}bytes`);
	// console.log(`master: ${master.certificate.length}bytes`);
	// if (config.savePath) {
	// 	await saveProfile({
	// 		profile,
	// 		savePath,
	// 		certificateName,
	// 		saveProfileToKeychain,
	// 		saveEphemeralToKeychain
	// 	});
	// }
	// if (saveToKeychain) {
	// 	console.log('Saving to Keychain');
	// 	await keychainSave({
	// 		certificate: profile,
	// 		account: saveToKeychain?.account || certificateName,
	// 	});
	// }
	// console.log('CERTIFICATE BUILT');
	// return profile;
}
export async function createDomainCertificate(config, options) {
	const certificateObject = objectToRawDomainCertificate(config, options);
	const certificate = convertToDomainCertificateObject(certificateObject);
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
const exampleRawCert = objectToRawDomainCertificate(exampleCert);
const exampleCertObject = convertToDomainCertificateObject(exampleRawCert);
console.log(exampleRawCert, exampleCertObject, encode(exampleRawCert).length - 120);
