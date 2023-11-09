import { write } from '#file';
import { encode } from '#utilities/serialize';
import { resolve, normalize } from 'path';
export async function saveCertificate(config) {
	const {
		certificate,
		savePath,
		certificateName,
	} = config;
	const folderName = certificateName.replace(/\./g, '_');
	const savePathRoot = `${resolve(`${savePath}`)}/${folderName}/${certificateName}`;
	const publicCertificate = certificate.certificate;
	const encodedCertificate = encode(certificate);
	await write(`${savePathRoot}Public.cert`, publicCertificate, 'binary', true);
	await write(`${savePathRoot}.cert`, encodedCertificate, 'binary', true);
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
