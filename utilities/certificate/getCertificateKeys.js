import {
	keys,
	remove
} from 'Acid';
export default function getCertificateKeys(certificate, exclude) {
	const certKeys = keys(certificate);
	if (exclude) {
		remove(certKeys, exclude);
	}
	// Sort Keys in ABC order
	certKeys.sort();
	console.log('Certificate Keys Sorted for signature', certKeys);
	return certKeys;
}
