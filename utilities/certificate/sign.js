import { logCert, imported } from '#logs';
import { read, write } from '#file';
import { hashSign } from '#crypto';
import { saveCertificate } from './save.js';
import {
	assign,
	keys,
	remove,
	isNumber,
	isPlainObject
} from 'Acid';
imported('Certificate Signing');
import pluckCertificate from '../pluckCertificate.js';
export function signCertificate(certificate, authority, exclude) {
	logCert('Sign Certificate');
	const concatValues = pluckCertificate(certificate, exclude);
	return hashSign(concatValues, authority.private);
}

