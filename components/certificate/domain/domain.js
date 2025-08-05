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
	promise,
} from '@universalweb/utilitylib';
import { decode, encodeStrict } from '#utilities/serialize';
import { getCipher, getKeyExchangeAlgorithm, getSignatureAlgorithm } from '#crypto/index.js';
import { read, readStructured, write } from '#file';
import { Certificate } from '../certificate.js';
import certificateDefaults from '../defaults.js';
import { keychainSave } from '#components/certificate/keychain';
import protocolDefaults from '../../../udsp/defaults.js';
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
		keyExchangeAlgorithm = 0,
	} = config;
	const certificate = {
		version,
		signatureKeypair,
		keyExchangeKeypair,
		start,
		end,
		certificateType,
		keyExchangeAlgorithm,
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
	if (!keyExchangeKeypair) {
		certificate.keyExchangeKeypair = await keyExchangeMethod.certificateKeyExchangeKeypair();
	}
	if (hasValue(ciphers)) {
		certificate.ciphers = ciphers;
	} else {
		certificate.ciphers = keyExchangeMethod.ciphers;
	}
	// console.log('certificate', certificate);
	return {
		data: certificate,
	};
}
export class DomainCertificate extends Certificate {
	async generate(config) {
		await this.merge(await createDomainCertificateObject(config));
		return this;
	}
}
export async function domainCertificate(...args) {
	return new DomainCertificate(...args);
}
export class PublicDomainCertificate extends Certificate {
	async initialize(source) {
		await super.initialize(source);
		await this.loadCryptography();
		return this;
	}
}
export async function publicDomainCertificate(...args) {
	return new PublicDomainCertificate(...args);
}
// const thisPath = currentPath(import.meta);
// const exampleCert = await domainCertificate();
// await exampleCert.generate({
// 	entity: 'universalweb.io',
// 	// ownerHash: profile.getSignature(),
// 	signatureAlgorithm: 0,
// 	ciphers: [
// 		0,
// 		// 1,
// 	],
// 	keyExchangeAlgorithm: 0,
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
// await exampleCert.savePublic(`${thisPath}/cache/`);
// const pubCertLoaded = await publicDomainCertificate(`${thisPath}/cache/public.cert`);
// console.log(pubCertLoaded.object);
// console.log(await pubCertLoaded.verifySelfSignature());
// console.log(pubCert[1].length);
// await exampleCert.save('domain', `${thisPath}/cache/`);
// console.log(exampleCert);
// console.log(await new PublicDomainCertificate(`${thisPath}/cache/domainPublicCert.cert`));
// console.log(await new DomainCertificate(`${thisPath}/cache/domain.cert`));
