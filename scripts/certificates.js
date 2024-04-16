import { DomainCertificate, createDomainCertificate, createProfile } from '#udsp/certificate/index';
import { currentPath } from '@universalweb/acid';
import { decode } from '#utilities/serialize';
const dirname = currentPath(import.meta);
const profile = new UWProfile();
profile.save('profile', `${dirname}/../profiles/default`);
const domainCertificate = new DomainCertificate({
	entity: 'universalweb.io',
	owner: profile.getSignature(),
	records: [
		[
			'aaaa',
			'@',
			'::1',
			8888,
			0, // PRIORITY
			'27.950575 -82.457176' // GEOLOCATION FEATURE
		],
		[
			'a',
			'@',
			'127.0.0.1',
			8888,
			0, // PRIORITY
			'27.950575 -82.457176' // GEOLOCATION FEATURE
		],
	],
});
domainCertificate.save('universal.web', `${dirname}/../serverApp/certs`);
console.log(domainCertificate);
const profile = await createProfile({
	savePath: `${dirname}/../profiles/default`,
	folder: 'default',
	certificateName: 'default',
	saveToKeychain: {
		account: 'Default Profile'
	}
});
console.log('Profile created (Master & IDENTITY CERTIFICATEs)', decode(domainProfile.ephemeral.certificate));
