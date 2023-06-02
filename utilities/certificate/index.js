import { logCert, imported } from '#logs';
import { read, write } from '#file';
import { decode, encode } from 'msgpackr';
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
			decoded: decode(original)
		};
		return certificate;
	} else {
		logCert('FAILED TO LOAD CERT', filepath);
	}
}
export async function parseCertificate(filepath) {
	logCert('Get => ', filepath);
	const original = getCertificate(filepath);
	if (original) {
		const decoded = decode(original);
		const certificate = {
			original,
			decoded
		};
		const {
			ephemeral,
			master
		} = decoded;
		if (ephemeral) {
			decoded.ephemeral = decode(ephemeral);
		}
		if (master) {
			decoded.master = decode(master);
		}
		return certificate;
	} else {
		logCert('FAILED TO LOAD CERT', filepath);
	}
}
export * from './create.js';
export * from './save.js';
