import {
	assign,
	clone,
	isBuffer,
	merge,
	promise
} from '@universalweb/acid';
import { certificateVersion, currentVersion } from '../defaults.js';
import { decode, encode } from '#utilities/serialize';
import { getCipherSuite, getPublicKeyAlgorithm } from '../cryptoMiddleware/index.js';
import { imported, logCert } from '#logs';
import {
	keypair,
	signDetached,
	signKeypair,
	toBase64
} from '#crypto';
import { read, write } from '#file';
import { saveCertificate, saveProfile } from './save.js';
import { keychainSave } from '#udsp/certificate/keychain';
function certificateObjectCreate(config, options = {}) {
	const currentDate = new Date();
	const {
		domain,
		records,
		end,
		version = certificateVersion,
		signatureAlgorithm = 0,
		keyExchangeAlgorithm = 0,
		contact,
		protocolInfo = [config.protocolVersion || currentVersion],
		cipherSuites,
		encryptPublicKeypair,
		serverConnectionIdSize,
		clientConnectionIdSize
	} = config;
	const certificate = {
		protocolInfo,
		version,
		signatureAlgorithm,
		keyExchangeAlgorithm,
		cipherSuites,
		encryptPublicKeypair,
		start: currentDate.toUTCString(),
		end: end || currentDate.setUTCMonth(currentDate.getUTCMonth() + 3)
	};
	if (domain) {
		certificate.domain = domain;
	}
	if (records) {
		certificate.records = records;
	}
	if (contact) {
		certificate.contact = contact;
	}
	if (protocolInfo) {
		certificate.protocolInfo = protocolInfo;
	}
	const signatureMethod = getPublicKeyAlgorithm(certificate.signatureAlgorithm, certificate.protocolVersion);
	if (!certificate.signatureKeypair) {
		certificate.signatureKeypair = signatureMethod();
	}
	const keyExchangeMethod = getPublicKeyAlgorithm(certificate.signatureMethodAlgorithm, certificate.protocolVersion);
	if (!certificate.keyExchangeKeypair) {
		certificate.keyExchangeKeypair = keyExchangeMethod();
	}
	return certificate;
}
export function ObjectToRawCertificate(certificateObject) {
	const {
		keyExchangeAlgorithm,
		domain,
		cipherSuites,
		keyExchangeKeypair,
		signatureKeypair,
		protocolInfo,
		records,
		endDate,
		startDate,
		protocolVersion,
		options,
		encryptPublicKeypair,
		serverConnectionIdSize,
		clientConnectionIdSize,
		contact,
	} = certificateObject;
	const certificate = [];
	this.certificate = certificate;
	certificate[0] = certificateVersion;
	certificate[1] = startDate || Date.now();
	certificate[2] = endDate;
	certificate[3] = signatureKeypair;
	certificate[4] = domain;
	certificate[5] = records;
	certificate[6] = [
		protocolVersion,
		keyExchangeKeypair,
		keyExchangeAlgorithm,
		cipherSuites,
		encryptPublicKeypair,
	];
	certificate[7] = contact;
	if (serverConnectionIdSize) {
		certificate[6].push(serverConnectionIdSize);
	}
	if (clientConnectionIdSize) {
		certificate[6].push(clientConnectionIdSize);
	}
	if (options) {
		certificate[8] = options;
	}
}
export async function createProfile(config) {
	const {
		template: {
			ephemeral: ephemeralTemplate,
			master: masterTemplate
		},
		savePath,
		certificateName,
		saveProfileToKeychain,
		saveEphemeralToKeychain,
		saveToKeychain,
	} = config;
	const master = certificateObjectCreate(masterTemplate);
	const ephemeral = certificateObjectCreate(ephemeralTemplate, {
		master
	});
	const profile = {
		ephemeral,
		master,
	};
	console.log(`ephemeral: ${ephemeral.certificate.length}bytes`);
	console.log(`master: ${master.certificate.length}bytes`);
	if (config.savePath) {
		await saveProfile({
			profile,
			savePath,
			certificateName,
			saveProfileToKeychain,
			saveEphemeralToKeychain
		});
	}
	if (saveToKeychain) {
		console.log('Saving to Keychain');
		await keychainSave({
			certificate: profile,
			account: saveToKeychain?.account || certificateName,
		});
	}
	console.log('CERTIFICATE BUILT');
	return profile;
}
export async function createCertificate(config, options) {
	const certificate = certificateObjectCreate(config.template, options);
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