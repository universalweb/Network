import {
	assign,
	clone,
	isBuffer,
	merge,
	promise
} from '@universalweb/acid';
import { decode, encode } from '#utilities/serialize';
import { imported, logCert } from '#logs';
import { read, write } from '#file';
import { saveCertificate, saveProfile } from './save.js';
import { signDetached, signKeypair, toBase64 } from '#crypto';
import { keychainSave } from '#keychain';
function certificateFactory(config, options = {}) {
	const currentDate = new Date();
	const certificate = {
		start: currentDate.toUTCString(),
	};
	if (config) {
		assign(certificate, config);
	}
	if (!certificate.end) {
		const endDate = currentDate.setUTCMonth(currentDate.getUTCMonth() + 3);
		certificate.end = currentDate.toUTCString();
	}
	const certificateWrapper = {
		certificate,
	};
	if (!certificate.publicKey) {
		const {
			publicKey,
			privateKey
		} = signKeypair();
		certificate.publicKey = publicKey;
		certificateWrapper.privateKey = privateKey;
		certificateWrapper.publicKey = publicKey;
	}
	if (options.master) {
		certificate.masterSignature = signDetached(Buffer.concat([
			Buffer.from(certificate.start),
			certificate.publicKey
		]), options.master.privateKey);
		certificate.masterPublicKey = options.master.publicKey;
	}
	certificateWrapper.certificate = encode(certificateWrapper.certificate);
	if (options.master) {
		certificateWrapper.masterSignature = signDetached(certificateWrapper.certificate, options.master.privateKey);
		console.log(`masterSignature: ${certificateWrapper.masterSignature.length}bytes`);
	}
	return certificateWrapper;
}
function createDomainCertificate(options) {
	const {
		version,
		cipherSuites,
		publicKeyAlgorithm,
		connectionIdSize,
		clientConnectionIdSize,
		url,
		ip,
		records,
		endDate,
		startDate,
		port
	} = options;
	const certificate = [];
	this.certificate = certificate;
	const keypair = options.keypair || signKeypair();
	const {
		publicKey,
		privateKey
	} = signKeypair();
	certificate[0] = version || 1;
	certificate[1] = startDate || Date.now();
	certificate[2] = keypair.publicKey;
	certificate[3] = publicKeyAlgorithm;
	certificate[4] = cipherSuites;
	certificate[5] = publicKey;
	certificate.push(privateKey);
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
