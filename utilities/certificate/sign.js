import { logCert, imported } from '#logs';
import { read, write } from '#file';
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
import { hashSignDetached } from '#crypto';
export function signCertificate(certificate, authority, exclude) {
	logCert('Sign Certificate');
	const concatValues = pluckCertificate(certificate, exclude);
	return hashSignDetached(concatValues, authority.private);
}

