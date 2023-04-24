import { write } from '#file';
import { encode } from 'msgpackr';
export async function saveCertificate(certificate, directory, certificateName = 'profile') {
	await write(`${directory}/${certificateName}.cert`, encode(certificate));
}
export default saveCertificate;
