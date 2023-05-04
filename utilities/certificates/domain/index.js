/*
  Module for quickly generating domain certificates you must contact the team for official registration/signing.
*/
import { read } from '#utilities/file/index';
import { signVerify, encode } from '#utilities/crypto/index';
import { jsonParse } from 'Acid';
import { createDomainProfile } from '#utilities/certificate/createDomainProfile';
import { signCertificate } from '#utilities/certificate/sign';
import { success, cnsl } from '#logs';
export async function createDomainCertificate(config) {
	const {
		template,
		templateLocation
	} = config;
	const profileTemplate = (template || jsonParse(await read(templateLocation || `${__dirname}/template.json`)));
	const domainCertificate = await createDomainProfile(profileTemplate);
	const {
		ephemeral,
		master
	} = domainCertificate;
	cnsl('------------EPHEMERAL KEY------------');
	const getSignature = signCertificate(ephemeral, master, ['private', 'signature']);
	const checkSignature = Buffer.compare(getSignature, ephemeral.signature);
	console.log('Compare Signature', checkSignature);
	const signature = signVerify(ephemeral.signature, master.key);
	if (signature && checkSignature === 0) {
		cnsl.success('Ephemeral Signature is valid');
	} else {
		return cnsl.failed('Ephemeral Signature is invalid');
	}
	cnsl.success('Ephemeral Certificate', `SIZE: ${encode(ephemeral).length}bytes`);
	cnsl.success('Master Certificate', `SIZE: ${encode(master).length}bytes`);
	cnsl.success(`TOTAL KEYPAIR SIZE: ${encode(ephemeral).length + encode(master).length}bytes`);
	return domainCertificate;
}
export async function createDomainEphemeral(config) {
	const {
		template,
		templateLocation,
		master
	} = config;
	console.log(master);
	const ephemeralTemplate = (template || jsonParse(await read(templateLocation || `${__dirname}/template.json`)));
	const ephemeral = await createDomainEphemeral(ephemeralTemplate, master);
	cnsl('------------MASTER KEY------------');
	success('Ephemeral Certificate', `SIZE: ${encode(master).length}bytes`);
	return ephemeral;
}
