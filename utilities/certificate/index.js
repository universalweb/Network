import { logCert, imported } from '#logs';
import { read, write } from '#file';
import { decode, encode } from 'msgpackr';
import { assign } from 'Acid';
imported('CERTIFICATE');
// Add certificate verification via DIS
export async function verifyCertificate(parentCertificate, childCertificate) {
	logCert(parentCertificate, childCertificate);
}
export async function getCertificate(filepath) {
	logCert('Get => ', filepath);
	const original = await read(filepath);
	if (original) {
		const certificate = {
			original,
		};
		assign(certificate, decode(original));
		if (certificate.certificate) {
			assign(certificate, decode(certificate.certificate));
		}
		return certificate;
	} else {
		logCert('FAILED TO LOAD CERT', filepath);
	}
}
export async function parseCertificate(filepath) {
	logCert('Get => ', filepath);
	const certificate = await getCertificate(filepath);
	if (certificate) {
		const {
			ephemeral,
			master,
			decoded
		} = certificate;
		if (ephemeral) {
			certificate.ephemeral = decode(ephemeral);
		}
		if (master) {
			certificate.master = decode(master);
		}
		return certificate;
	} else {
		logCert('FAILED TO LOAD CERT', filepath);
	}
}
export * from './create.js';
export * from './save.js';
