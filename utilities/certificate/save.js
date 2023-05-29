import { write } from '#file';
import { encode } from 'msgpackr';
import { resolve } from 'path';
export async function saveCertificate(certificate, directory, certificateName = 'profile') {
	const savePath = resolve(`${directory}/${certificateName}.cert`);
	const encodedCertificate = encode(certificate);
	await write(savePath, encodedCertificate);
	console.log(savePath, `${encodedCertificate.length} bytes`);
}
