import { write } from '../file/index.js';
import { encode } from '../crypto/index.js';
export default async function saveCertificate(certificate, directory, certificateName = 'profile') {
	await write(`${directory}/${certificateName}.cert`, encode(certificate));
}
