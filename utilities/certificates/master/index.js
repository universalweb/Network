/*
  Module for quickly generating identity certificates
*/
import { createMaster } from 'utilities/certificate/create.js';
import { signCertificate } from 'utilities/certificate/sign.js';
import { signVerify } from 'utilities/crypto.js';
import { success, info, failed } from 'utilities/logs.js';
import { encode } from 'msgpackr';
import { jsonParse } from 'Acid';
import { read } from 'utilities/file.js';
async function createMasterCertificate(config) {
	const {
		template,
		templateLocation
	} = config;
	const masterTemplate = (template || jsonParse(await read(templateLocation || `${__dirname}/template.json`)));
	const masterCertificate = await createMaster(masterTemplate);
	info('------------MASTER KEY------------');
	success('Master Certificate', `SIZE: ${encode(masterCertificate).length}bytes`);
	return masterCertificate;
}
