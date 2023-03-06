import cnsl from '../logs/index.js';
import { read, write } from '../file/index.js';
import { keypair, signKeypair } from '../crypto/index.js';
import { sign } from './sign.js';
import { save } from './save.js';
import { assign, assignDeep } from 'Acid';
export async function createDomainProfile(profileTemplate, certificateName, directory) {
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
	} = keypair();
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
