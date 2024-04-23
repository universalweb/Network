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
	defaultClientConnectionIdSize,
	defaultServerConnectionIdSize
} from '../defaults.js';
import { decode, encode } from '#utilities/serialize';
import { getCipherSuite, getSignatureAlgorithm, getSignatureAlgorithmByCertificate } from '../cryptoMiddleware/index.js';
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
const type = certificateTypes.get('profile');
export function createUWProfileObject(config = {}, options = {}) {
	const currentDate = new Date();
	const {
		version = currentCertificateVersion,
		signatureAlgorithm,
		signatureKeypair,
		encryptionKeypairAlgorithm,
		contact,
		cipherSuites,
		encryptionKeypair,
		start = currentDate.getTime()
	} = config;
	const certificate = {
		version,
		signatureKeypair,
		encryptionKeypair,
		start,
		type
	};
	if (contact) {
		certificate.contact = contact;
	}
	const protocolVersion = hasValue(version) ? version : currentProtocolVersion;
	if (hasValue(signatureAlgorithm) && signatureAlgorithm !== 0) {
		certificate.signatureAlgorithm = signatureAlgorithm;
	}
	if (hasValue(encryptionKeypairAlgorithm) && encryptionKeypairAlgorithm !== 0) {
		certificate.encryptionKeypairAlgorithm = encryptionKeypairAlgorithm;
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
export function objectToRawUWProfile(certificateObject) {
	const currentDate = new Date();
	const {
		cipherSuites,
		signatureKeypair,
		signatureAlgorithm = 0,
		end = currentDate.setUTCMonth(currentDate.getUTCMonth() + 3),
		start,
		protocolOptions,
		options,
		encryptionKeypair,
		cipherSuite,
		contact
	} = certificateObject;
	const certificate = [];
	certificate[0] = 2;
	certificate[1] = currentCertificateVersion;
	certificate[2] = start;
	certificate[3] = end;
	certificate[4] = [
		[
			signatureKeypair.publicKey,
			signatureKeypair.privateKey
		],
		[
			encryptionKeypair.publicKey,
			encryptionKeypair.privateKey
		]
	];
	if (contact) {
		certificate[5] = contact;
	}
	if (options) {
		certificate[6] = options;
	}
	return certificate;
}
export function getPublicProfileCertificate(certificate) {
	const publicCertificate = clone(certificate);
	publicCertificate[4][0] = publicCertificate[4][0][0];
	publicCertificate[4][1] = publicCertificate[4][1][0];
	return publicCertificate;
}
export function rawToObjectUWProfile(rawObject, signature) {
	const rawObjectLength = rawObject.length;
	console.log(rawObject);
	const [
		certificateType,
		version,
		start,
		end,
		[
			signatureKeypair,
			encryptionKeypair,
			signatureAlgorithm,
			cipherSuites,
		],
		contact,
		options,
	] = rawObject;
	const certificate = {
		type,
		version,
		start,
		end,
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
	if (contact) {
		certificate.contact = contact;
	}
	return certificate;
}
export class UWProfile extends UWCertificate {
	async initialize(config = {}) {
		if (isPlainObject(config)) {
			this.object = createUWProfileObject(config);
			this.update();
		} else if (isString(config)) {
			const source = await readStructure(config);
			this.processAsObject(source);
		} else if (isArray(config)) {
			this.array = config;
			this.object = rawToObjectUWProfile(config);
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
			this.object = rawToObjectUWProfile(this.array, source[1]);
		} else {
			this.array = source;
			this.object = rawToObjectUWProfile(source);
		}
	}
	update(config) {
		this.array = objectToRawUWProfile(this.object);
	}
	getSignatureAlgorithm() {
		return getSignatureAlgorithmByCertificate(this.object.encryptionKeypairAlgorithm, this.getCertificateVersion());
	}
	generatePublic() {
		this.publicCertificate = getPublicProfileCertificate(this.array);
	}
	getSignature() {
		if (!this.publicCertificate) {
			this.generatePublic();
		}
		const signature = this.createSignature(this.publicCertificate, this.object.signatureKeypair.privateKey);
		return signature;
	}
	saveToKeychain(account) {
		const profile = this.encode();
		const keychainConfig = {
			account,
			profile
		};
		return keychainSave(keychainConfig);
	}
}
export async function uwProfile(...args) {
	return new UWProfile(...args);
}
export class UWPublicProfile extends UWCertificate {
	async initialize(config) {
		const source = isString(config) ? await readStructure(config) : config;
		this.array = source[0];
		this.object = rawToObjectUWProfile(source[0], source[1]);
		return this;
	}
}
export async function uwPublicProfile(...args) {
	return new UWPublicProfile(...args);
}
// const example = await new UWProfile();
// await example.saveToKeychain('uwProfile');
// const pubCert = example.getPublic();
// const thisPath = currentPath(import.meta);
// console.log(example);
// await example.savePublic('profilePublicCert', `${thisPath}/certificates/`);
// await example.save('profile', `${thisPath}/certificates/`);
// console.log(await new UWPublicProfile(`${thisPath}/certificates/profilePublicCert.cert`));
// console.log(await new UWProfile(`${thisPath}/certificates/profile.cert`));
