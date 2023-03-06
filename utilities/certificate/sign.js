import cnsl from '../logs/index.js';
import { read, write } from '../file/index.js';
import { hashSign } from '../crypto/index.js';
import saveCertificate from './save.js';
import {
	assign,
	keys,
	remove,
	isNumber,
	isPlainObject
} from 'Acid';
cnsl.imported('Certificate Signing');
import pluckCertificate from './pluckCertificate.js';
export default function signCertificate(certificate, authority, exclude) {
	console.log('Sign Certificate');
	const concatValues = pluckCertificate(certificate, exclude);
	return hashSign(concatValues, authority.private);
}

