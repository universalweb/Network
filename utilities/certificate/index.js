import cnsl from '../logs/index.js';
import { read, write } from '../file/index.js';
import { decode, encode } from '../crypto/index.js';
cnsl.imported('CERTIFICATE');
export async function parseCertificate(raw) {
	const certificate = decode(raw);
	return certificate;
}
export async function verifyCertificate(parentCertificate, child) {
	const parentCertificateCertificate = parentCertificate;
	const childCertificate = child;
	cnsl.info(parentCertificateCertificate, childCertificate);
}
export async function getCertificate(filepath) {
	cnsl.certificate('Get => ', filepath);
	const file = await read(filepath);
	if (file) {
		return parseCertificate(file);
	} else {
		cnsl.failed('FAILED TO LOAD CERT', filepath);
	}
}
export * from './sign.js';
export * from './create.js';
