/*
  Module for quickly generating identity certificates
*/
import { createProfile } from 'utilities/certificate/create.js';
import { signCertificate } from 'utilities/certificate/sign.js';
import { signVerify } from 'utilities/crypto.js';
import { success, info, failed } from 'utilities/logs.js';
import { encode } from 'msgpackr';
import { jsonParse } from 'Acid';
import { read } from 'utilities/file.js';
async function createIdentityCertificate(config) {
	const {
		template,
		templateLocation
	} = config;
	const profileTemplate = (template || jsonParse(await read(templateLocation || `${__dirname}/template.json`)));
	const identityCertificate = await createProfile(profileTemplate);
	const {
		ephemeral,
		master
	} = identityCertificate;
	info('------------EPHEMERAL KEY------------');
	const getSignature = signCertificate(ephemeral, master, ['private', 'signature']);
	const checkSignature = Buffer.compare(getSignature, ephemeral.signature);
	console.log('Compare Signature', checkSignature);
	const signature = signVerify(ephemeral.signature, master.key);
	console.log('SIGNATURE OPENED', signature);
	if (signature && checkSignature === 0) {
		success('Ephemeral Signature is valid');
	} else {
		return failed('Ephemeral Signature is invalid');
	}
	success('Ephemeral Certificate', `SIZE: ${encode(ephemeral).length}bytes`);
	success('Master Certificate', `SIZE: ${encode(master).length}bytes`);
	success(`TOTAL KEYPAIR SIZE: ${encode(ephemeral).length + encode(master).length}bytes`);
	return identityCertificate;
}

