/*
  Module for generating a root certificates for the root Identity Registrar servers.
*/
import { createProfile } from '#utilities/certificate/create.js';
import { signCertificate } from '#utilities/certificate/sign.js';
import { signVerify } from '#utilities/crypto.js';
import { success, info, failed } from '#logs';
import { encode } from 'msgpackr';
async function createRootCertificate(config) {
	const template = config.template;
	const rootCertificate = await createProfile(template);
	const {
		ephemeral,
		master
	} = rootCertificate;
	console.log(ephemeral);
	console.log(master);
	info('------------EPHEMERAL KEY------------');
	const getSignature = signCertificate(ephemeral, master, ['private', 'signature']);
	console.log('Compare Signature', Buffer.compare(getSignature, ephemeral.signature), getSignature, ephemeral.signature);
	const signature = signVerify(ephemeral.signature, master.key);
	if (signature) {
		success('Ephemeral Signature is valid');
	} else {
		return failed('Ephemeral Signature is invalid');
	}
	success('Ephemeral Certificate', `SIZE: ${encode(ephemeral).length}bytes`);
	success('Master Certificate', `SIZE: ${encode(master).length}bytes`);
	success(`TOTAL KEYPAIR SIZE: ${encode(ephemeral).length + encode(master).length}bytes`);
	return rootCertificate;
}
