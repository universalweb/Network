import {
	isNumber,
	isPlainObject
} from 'Acid';
import { getCertificateKeys } from '#certificate';
export default function pluckCertificate(certificate, exclude, pluckedValuesArray = []) {
	const certKeys = getCertificateKeys(certificate, exclude);
	const certKeysLength = certKeys.length;
	let pluckedValuesLength = 0;
	for (let index = 0; index < certKeysLength; index++) {
		const item = certificate[certKeys[index]];
		let buffered;
		if (Buffer.isBuffer(item)) {
			buffered = item;
		} else if (isNumber(item)) {
			buffered = Buffer.from(`${item}`);
		} else if (isPlainObject(item)) {
			buffered = pluckCertificate(item);
		} else {
			buffered = Buffer.from(item);
		}
		pluckedValuesArray.push(buffered);
		pluckedValuesLength += buffered.length;
	}
	const pluckedValues = Buffer.concat([pluckedValuesArray, pluckedValuesLength]);
	return pluckedValues;
}
