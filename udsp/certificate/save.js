import { normalize, resolve } from 'path';
import { encode } from '#utilities/serialize';
import { isBuffer } from '@universalweb/acid';
import { write } from '#file';
export async function saveCertificate(config) {
	const {
		certificate,
		savePath,
		certificateName,
	} = config;
	const savePathRoot = `${resolve(`${savePath}`)}/${certificateName}`;
	await write(`${savePathRoot}.cert`, isBuffer(certificate) ? certificate : encode(certificate), 'binary', true);
}
export async function saveProfile(config) {
	const {
		savePath,
		certificateName,
		profile,
		profile: {
			ephemeral: ephemeralCertificate,
			master: masterCertificate
		},
	} = config;
	// console.log(config);
	const ephemeral = {
		certificate: ephemeralCertificate,
		savePath,
		certificateName: `${certificateName}-Ephemeral`
	};
	await saveCertificate(ephemeral);
	const master = {
		certificate: masterCertificate,
		savePath,
		certificateName: `${certificateName}-Master`
	};
	await saveCertificate(master);
	const folderName = certificateName.replace(/\./g, '_');
	const savePathRoot = `${resolve(`${savePath}`)}/${folderName}-Profile/${certificateName}-Profile.cert`;
	await write(savePathRoot, encode(profile), 'binary', true);
}
