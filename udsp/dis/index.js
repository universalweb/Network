// DOMAIN INFORMATION SYSTEM
// This module provides functions to manage and retrieve information about domain certificates.
import { currentPath } from '@universalweb/acid';
import os from 'os';
import { publicDomainCertificate } from '../certificate/domain.js';
const homeDirectory = os.homedir();
// const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
// console.log(timeZone);
// console.log(homeDirectory);
// Record Example
// 		[
// 			'a',
// 			'@',
// 			'127.0.0.1',
// 			8888
// 		],
async function findRecord(certificate, recordType, hostname) {
	const records = certificate.get('records');
	const entity = certificate.get('entity');
	const record = records.find((item) => {
		if (item[0] === recordType) {
			const recordHostname = item[1];
			if (item[1] === '@' && hostname === entity) {
				return true;
			} else if (recordHostname === hostname) {
				return true;
			}
		}
		return null;
	});
	return record;
}
const dis = {
	findRecord
};
export default dis;
// const thisPath = currentPath(import.meta);
// const certificateExample = await publicDomainCertificate(`${thisPath}/../../serverApp/certs/universalWebPublic.cert`);
// console.log(certificateExample);
// const recordFound = await findRecord(certificateExample, 'a', 'universalweb.io');
// console.log('Record Found', recordFound);
