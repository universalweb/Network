import { domainCertificate, uwProfile } from '#utilities/certificate/index';
import { currentPath } from '@universalweb/acid';
import { decode } from '#utilities/serialize';
const dirname = currentPath(import.meta);
const profile = await uwProfile();
await profile.save('profile', `${dirname}/../profiles/default`);
const UWCertificate = await domainCertificate({
	entity: 'universalweb.io',
	backupHash: profile.getSignature(),
	signatureAlgorithm: 0,
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
