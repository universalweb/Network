import { logCert, imported } from '#logs';
import { read, write } from '#file';
import { keypair, signKeypair } from '#crypto';
import { signCertificate } from './sign.js';
import { saveCertificate } from './save.js';
import { assign, merge, clone } from 'Acid';
imported('Certificate Creation');
export async function createProfile(profileTemplate, certificateName, directory) {
	const {
		ephemeral: ephemeralTemplate,
		master: masterTemplate
	} = clone(profileTemplate);
	const {
		publicKey: masterKey,
		secretKey: secretKeyMaster
	} = signKeypair();
	const {
		publicKey: ephemeralKey,
		secretKey: secretKeyEphemeral
	} = signKeypair();
	const ephemeral = merge(ephemeralTemplate, {
		start: Date.now(),
		key: ephemeralKey
	});
	const master = merge(masterTemplate, {
		start: Date.now(),
		key: masterKey,
		private: secretKeyMaster
	});
	const profile = {
		ephemeral,
		master,
	};
	logCert('Certificates Built');
	ephemeral.signature = signCertificate(ephemeral, master);
	logCert('Ephemeral Certificate Signed');
	ephemeral.private = secretKeyEphemeral;
	if (directory) {
		await saveCertificate(profile, directory, certificateName);
		logCert(`Certificates Saved to ${directory}`, certificateName);
	}
	console.log('CERTIFICATE BUILT');
	return profile;
}
export async function createEphemeralCertificate(ephemeralTemplate, master, certificateName, directory) {
	const {
		publicKey,
		secretKey
	} = signKeypair();
	const ephemeral = merge(ephemeralTemplate, {
		start: Date.now(),
		key: publicKey
	});
	logCert('Ephemeral Certificate Built');
	ephemeral.signature = signCertificate(ephemeral, master);
	logCert('Ephemeral Certificate Signed');
	ephemeral.private = secretKey;
	if (directory) {
		await saveCertificate(ephemeral, directory, certificateName);
		logCert(`Certificate Saved to ${directory}`, certificateName);
	}
	return ephemeral;
}
export async function createDomainEphemeralCertificate(ephemeralTemplate, master, certificateName, directory) {
	const {
		publicKey,
		secretKey
	} = keypair();
	const ephemeral = merge(ephemeralTemplate, {
		start: Date.now(),
		key: publicKey
	});
	logCert('Ephemeral Certificate Built');
	ephemeral.signature = signCertificate(ephemeral, master);
	logCert('Ephemeral Certificate Signed');
	ephemeral.private = secretKey;
	if (directory) {
		await saveCertificate(ephemeral, directory, certificateName);
		logCert(`Certificate Saved to ${directory}`, certificateName);
	}
	return ephemeral;
}
export async function createMasterCertificate(masterTemplate, certificateName, directory) {
	const {
		publicKey,
		secretKey
	} = signKeypair();
	const master = merge(masterTemplate, {
		start: Date.now(),
		key: publicKey,
		private: secretKey
	});
	logCert('Master Certificate Built');
	if (directory) {
		await saveCertificate(master, directory, certificateName);
		logCert(`Certificate Saved to ${directory}`, certificateName);
	}
	return master;
}
