import { logCert, imported } from '#logs';
import { read, write } from '#file';
import { decode, encode } from 'msgpackr';
imported('CERTIFICATE');
export async function parseCertificate(raw) {
	const certificate = decode(raw);
	return certificate;
}
export async function verifyCertificate(parentCertificate, child) {
	const parentCertificateCertificate = parentCertificate;
	const childCertificate = child;
	logCert(parentCertificateCertificate, childCertificate);
}
export async function getCertificate(filepath) {
	logCert('Get => ', filepath);
	const file = await read(filepath);
	if (file) {
		return parseCertificate(file);
	} else {
		logCert('FAILED TO LOAD CERT', filepath);
	}
}
export * from './createDomainProfile.js';
export * from './sign.js';
export * from './create.js';
export * from './save.js';
export * from './getCertificateKeys.js';
