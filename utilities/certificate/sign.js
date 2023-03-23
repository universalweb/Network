import cnsl from '../logs.js';
import { read, write } from '../file.js';
import { hashSign } from '../crypto.js';
import saveCertificate from './save.js';
import {
	assign,
	keys,
	remove,
	isNumber,
	isPlainObject
} from 'Acid';
cnsl.imported('Certificate Signing');
import pluckCertificate from '../pluckCertificate.js';
export function signCertificate(certificate, authority, exclude) {
	console.log('Sign Certificate');
	const concatValues = pluckCertificate(certificate, exclude);
	return hashSign(concatValues, authority.private);
}

