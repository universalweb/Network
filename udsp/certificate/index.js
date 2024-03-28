import { decode, encode } from '#utilities/serialize';
import { imported, logCert } from '#logs';
import { read, write } from '#file';
import { assign } from '@universalweb/acid';
import { convertToDomainCertificateObject } from './domain.js';
import { convertToProfileCertificateObject } from './profile.js';
// Add certificate verification via DIS
export async function verifyCertificate(parentCertificate, childCertificate) {
	logCert(parentCertificate, childCertificate);
}
export async function getCertificate(filepath) {
	logCert('Get => ', filepath);
	const original = await read(filepath);
	if (original) {
		return decode(original);
	} else {
		logCert('FAILED TO GET CERT', filepath);
	}
}
export async function loadCertificate(filepath) {
	logCert('Get => ', filepath);
	const certificate = await read(filepath);
	if (certificate) {
		return certificate;
	} else {
		logCert('FAILED TO LOAD CERT', filepath);
	}
}
export async function parseCertificate(filepath) {
	logCert('Get => ', filepath);
	const certificate = await getCertificate(filepath);
	if (certificate) {
		const [type,] = certificate;
		if (type === 0) {
			return convertToDomainCertificateObject(certificate);
		} else if (type === 1) {
			return convertToProfileCertificateObject(certificate);
		}
		return certificate;
	} else {
		logCert('FAILED TO PARSE CERT', filepath);
	}
}
export * from './domain.js';
export * from './save.js';
