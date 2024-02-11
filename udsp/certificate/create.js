import {
	assign,
	clone,
	isBuffer,
	merge,
	promise
} from '@universalweb/acid';
import { certificateVersion, currentVersion } from '../defaults.js';
import { decode, encode } from '#utilities/serialize';
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
	const certificate = {
		protocolVersion: currentVersion,
		certificateVersion,
		start: currentDate.toUTCString(),
	};
	if (config) {
		assign(certificate, config);
	}
	if (!certificate.end) {
		const endDate = currentDate.setUTCMonth(currentDate.getUTCMonth() + 3);
		certificate.end = currentDate.toUTCString();
	}
	if (!certificate.signPublicKey) {
		const {
			publicKey,
			privateKey
		} = signKeypair();
		certificate.signPublicKey = publicKey;
		certificate.signPrivateKey = privateKey;
	}
	if (!certificate.encryptPublicKey) {
		const {
			publicKey,
			privateKey
		} = keypair();
		certificate.encryptPublicKey = publicKey;
		certificate.encryptPrivateKey = privateKey;
	}
	if (!certificate.signatureAlgorithm) {
		certificate.signatureAlgorithm = 0;
	}
	if (!certificate.keyExchangeAlgorithm) {
		certificate.keyExchangeAlgorithm = 0;
	}
	if (!certificate.cipherSuites) {
		certificate.cipherSuites = 0;
	}
	return certificate;
}
// Only send cipher suite if you already have a certificate
export function convertObjectCertificate(certificateObject) {
	const {
		domain,
		cipherSuites,
		keyExchangeAlgorithm,
		signatureAlgorithm,
		publicKeyAlgorithm,
		connectionIdSize,
		clientConnectionIdSize,
		records,
		endDate,
		startDate,
		protocolVersion,
		encryptPublicKeypair,
		signPublicKeypair,
		options
	} = certificateObject;
	const certificate = [];
	this.certificate = certificate;
	const {
		publicKey,
		privateKey
	} = signKeypair();
	certificate[0] = certificateVersion;
	certificate[1] = startDate || Date.now();
	certificate[2] = endDate;
	certificate[3] = protocolVersion;
	certificate[4] = [
		signPublicKeypair.publicKey,
		encryptPublicKeypair.publicKey
	];
	certificate[5] = [
		signatureAlgorithm,
		keyExchangeAlgorithm
	];
	certificate[6] = cipherSuites;
	certificate[7] = domain;
	certificate[8] = records;
	if (options) {
		certificate[9] = options;
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
	const master = certificateFactory(masterTemplate);
	const ephemeral = certificateFactory(ephemeralTemplate, {
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
	const certificate = certificateFactory(config.template, options);
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
