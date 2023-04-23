/*
  Module for quickly generating identity certificates
*/
import { createEphemeral } from '#utilities/certificate/create.js';
import { signCertificate } from '#utilities/certificate/sign.js';
import { signVerify } from '#utilities/crypto.js';
import { success, info, failed } from '#logs';
import { encode } from 'msgpackr';
import { jsonParse } from 'Acid';
import { read } from '#utilities/file.js';
async function createEphemeralCertificate(config) {
	const {
		template,
		templateLocation,
		master
	} = config;
	console.log(master);
	const ephemeralTemplate = (template || jsonParse(await read(templateLocation || `${__dirname}/template.json`)));
	const ephemeral = await createEphemeral(ephemeralTemplate, master);
	info('------------MASTER KEY------------');
	success('Ephemeral Certificate', `SIZE: ${encode(master).length}bytes`);
	return ephemeral;
}
