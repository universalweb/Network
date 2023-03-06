import cnsl from '../logs/index.js';
import { read, write } from '../file/index.js';
import { keypair, signKeypair } from '../crypto/index.js';
import { sign } from './sign.js';
import { save } from './save.js';
import { assign, assignDeep } from 'Acid';
cnsl.imported('Certificate Creation');
export async function createProfile(profileTemplate, certificateName, directory) {
	const {
		ephemeral: ephemeralTemplate,
		master: masterTemplate
	} = profileTemplate;
	const {
		publicKey: masterKey,
		secretKey: secretKeyMaster
	} = signKeypair();
	const {
		publicKey: ephemeralKey,
		secretKey: secretKeyEphemeral
	} = signKeypair();
	const ephemeral = assignDeep({
		start: Date.now(),
		key: ephemeralKey
	}, ephemeralTemplate);
	const master = assignDeep({
		start: Date.now(),
		key: masterKey,
		private: secretKeyMaster
	}, masterTemplate);
	const profile = {
		ephemeral,
		master,
	};
	cnsl.warning('Certificates Built');
	ephemeral.signature = sign(ephemeral, master);
	cnsl.warning('Ephemeral Certificate Signed');
	ephemeral.private = secretKeyEphemeral;
	if (directory) {
		await save(profile, directory, certificateName);
		cnsl.warning(`Certificates Saved to ${directory}`, certificateName);
	}
	console.log('CERTIFICATE BUILT');
	return profile;
}
export async function createEphemeralCertificate(ephemeralTemplate, master, certificateName, directory) {
	const {
		publicKey,
		secretKey
	} = signKeypair();
	const ephemeral = assignDeep({
		start: Date.now(),
		key: publicKey
	}, ephemeralTemplate);
	cnsl.warning('Ephemeral Certificate Built');
	ephemeral.signature = sign(ephemeral, master);
	cnsl.warning('Ephemeral Certificate Signed');
	ephemeral.private = secretKey;
	if (directory) {
		await save(ephemeral, directory, certificateName);
		cnsl.warning(`Certificate Saved to ${directory}`, certificateName);
	}
	return ephemeral;
}
export async function createDomainEphemeralCertificate(ephemeralTemplate, master, certificateName, directory) {
	const {
		publicKey,
		secretKey
	} = keypair();
	const ephemeral = assignDeep({
		start: Date.now(),
		key: publicKey
	}, ephemeralTemplate);
	cnsl.warning('Ephemeral Certificate Built');
	ephemeral.signature = sign(ephemeral, master);
	cnsl.warning('Ephemeral Certificate Signed');
	ephemeral.private = secretKey;
	if (directory) {
		await save(ephemeral, directory, certificateName);
		cnsl.warning(`Certificate Saved to ${directory}`, certificateName);
	}
	return ephemeral;
}
export async function createMasterCertificate(masterTemplate, certificateName, directory) {
	const {
		publicKey,
		secretKey
	} = signKeypair();
	const master = assignDeep({
		start: Date.now(),
		key: publicKey,
		private: secretKey
	}, masterTemplate);
	cnsl.warning('Master Certificate Built');
	if (directory) {
		await save(master, directory, certificateName);
		cnsl.warning(`Certificate Saved to ${directory}`, certificateName);
	}
	return master;
}
