import { logCert } from '#logs';
import { read, write } from '#file';
import { keypair, signKeypair } from '#crypto';
import { signCertificate } from './sign.js';
import { saveCertificate } from './save.js';
import { assign, merge, clone } from 'Acid';
export async function createDomainProfile(profileTemplate, certificateName, directory) {
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
	} = keypair();
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
	logCert.warning('Certificates Built');
	ephemeral.signature = signCertificate(ephemeral, master);
	logCert.warning('Ephemeral Certificate Signed');
	ephemeral.private = secretKeyEphemeral;
	if (directory) {
		await saveCertificate(profile, directory, certificateName);
		logCert.warning(`Certificates Saved to ${directory}`, certificateName);
	}
	console.log('CERTIFICATE BUILT');
	return profile;
}
export default createDomainProfile;
