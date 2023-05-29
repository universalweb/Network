import { logCert, imported } from '#logs';
import { read, write } from '#file';
import { decode, encode } from 'msgpackr';
imported('CERTIFICATE');
// Add certificate verification
export async function verifyCertificate(parentCertificate, childCertificate) {
	logCert(parentCertificate, childCertificate);
}
export async function getCertificate(filepath) {
	logCert('Get => ', filepath);
	const file = await read(filepath);
	if (file) {
		const certificateDecoded = decode(file);
		const {
			ephemeral,
			master
		} = certificateDecoded;
		if (ephemeral) {
			ephemeral.certificateDecoded = decode(ephemeral.certificate);
		}
		if (master) {
			master.certificateDecoded = decode(master.certificate);
		}
		if (certificateDecoded.certificate) {
			certificateDecoded.certificateDecoded = decode(certificateDecoded.certificate);
		}
		return certificateDecoded;
	} else {
		logCert('FAILED TO LOAD CERT', filepath);
	}
}
export * from './create.js';
export * from './save.js';
