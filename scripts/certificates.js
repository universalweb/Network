import { domainCertificate, uwProfile } from '#udsp/certificate/index';
import { currentPath } from '@universalweb/acid';
import { decode } from '#utilities/serialize';
const dirname = currentPath(import.meta);
const profile = uwProfile();
profile.save('profile', `${dirname}/../profiles/default`);
const UWCertificate = domainCertificate({
	entity: 'universalweb.io',
	backupHash: profile.getSignature(),
	records: [
		[
			'aaaa',
			'@',
			'::1',
			8888,
			// PRIORITY
			0,
			// GEOLOCATION FEATURE
			'27.950575 -82.457176'
		],
		[
			'a',
			'@',
			'127.0.0.1',
			8888,
			// PRIORITY
			0,
			// GEOLOCATION FEATURE
			'27.950575 -82.457176'
		],
	],
});
domainCertificate.save('universal.web', `${dirname}/../serverApp/certs`);
console.log(domainCertificate);
