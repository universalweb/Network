import { convertToDomainCertificateObject, createDomainCertificateObject, objectToRawDomainCertificate } from './domain.js';
import { convertToProfileCertificateObject, createProfileCertificateObject, objectToRawProfileCertificate } from './profile.js';
import { decode, encode } from '#utilities/serialize';
import { imported, logCert } from '#logs';
import { read, write } from '#file';
import { assign } from '@universalweb/acid';
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
export async function createCertificate(config, options) {
	const { type } = config;
	if (type) {
		if (type === 0) {
			const certObject = createDomainCertificateObject(config, options);
			return objectToRawDomainCertificate(certObject);
		} else if (type === 1) {
			const certObject = createProfileCertificateObject(config, options);
			return objectToRawProfileCertificate(certObject);
		}
		console.log('Certificate Type Incorrect');
	} else {
		console.log('Certificate Type Required');
	}
}
export * from './save.js';
