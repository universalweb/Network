import { write } from '#file';
import { encode } from 'msgpackr';
import { resolve, normalize } from 'path';
export async function saveCertificate(config) {
	const {
		certificate,
		savePath,
		certificateName
	} = config;
	const savePathRoot = `${resolve(`${savePath}`)}/${certificateName}`;
	const publicCertificate = certificate.certificate;
	const encodedCertificate = encode(certificate);
	await write(`${savePathRoot}-Public.cert`, publicCertificate);
	await write(`${savePathRoot}.cert`, encodedCertificate);
}
export async function saveProfile(config) {
	const {
		savePath,
		certificateName,
		profile,
		profile: {
			ephemeral: ephemeralCertificate,
			master: masterCertificate
		}
	} = config;
	console.log(config);
	const ephemeral = {
		certificate: ephemeralCertificate,
		savePath,
		certificateName: `${certificateName}Ephemeral`
	};
	await saveCertificate(ephemeral);
	const master = {
		certificate: masterCertificate,
		savePath,
		certificateName: `${certificateName}Master`
	};
	await saveCertificate(master);
	const savePathRoot = `${resolve(`${savePath}`)}/${certificateName}-Profile.cert`;
	await write(savePathRoot, encode(profile));
}
