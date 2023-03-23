import { write } from '../file.js';
import { encode } from '../crypto.js';
export async function saveCertificate(certificate, directory, certificateName = 'profile') {
	await write(`${directory}/${certificateName}.cert`, encode(certificate));
}
