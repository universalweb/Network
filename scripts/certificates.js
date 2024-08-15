import { currentPath } from '@universalweb/acid';
import { decode } from '#utilities/serialize';
import { domainCertificate } from '#utilities/certificate/index';
const dirname = currentPath(import.meta);
// Consider not having UWProfile Certificate in favor of UWProfile/Viat version folder
// const profile = await uwProfile();
// await profile.save('profile', `${dirname}/../profiles/default`);
const UWCertificate = await domainCertificate({
	entity: 'universalweb.io',
	// ownerHash: profile.getSignature(),
	signatureAlgorithm: 0,
	cipherSuites: [0, 1],
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
