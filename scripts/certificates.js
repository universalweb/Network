import { currentPath } from '@universalweb/acid';
import { decode } from '#utilities/serialize';
import { domainCertificate } from '#utilities/certificate/index';
import { uwProfile } from '../UWProfile/index.js';
const dirname = currentPath(import.meta);
const profile = await uwProfile();
await profile.saveToFile('profile.cert', `${dirname}/../profiles`, 'password');
await profile.saveToKeychain('profile.cert', `${dirname}/../profiles`, 'password');
const UWCertificate = await domainCertificate({
	entity: 'universalweb.io',
	// ownerHash: profile.getSignature(),
	signatureAlgorithm: 0,
	cipherSuites: 1,
	records: [
		[
			'aaaa',
			'@',
			'::1',
			8888,
			// PRIORITY
			0,
			// GEOLOCATION FEATURE FOR GEO PRIORITIZATION
			// '27.950575 -82.457176'
		],
		[
			'a',
			'@',
			'127.0.0.1',
			8888,
			// PRIORITY
			0,
			// GEOLOCATION FEATURE FOR GEO PRIORITIZATION
			// '27.950575 -82.457176'
		],
	],
});
await UWCertificate.save('universalWeb.cert', `${dirname}/../serverApp/certs`);
await UWCertificate.savePublic('universalWebPublic.cert', `${dirname}/../udsp/dis/cache`);
