/*
  Module for quickly generating identity certificates
*/
import { createMaster } from '#utilities/certificate/create';
import { signCertificate } from '#utilities/certificate/sign';
import { signVerify } from '#crypto';
import { success, info, failed } from '#logs';
import { encode } from 'msgpackr';
import { jsonParse } from 'Acid';
import { read } from '#utilities/file';
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
