import { createDomainCertificate, createProfile } from '#udsp/certificate/index';
import { currentPath } from '@universalweb/acid';
import { decode } from '#utilities/serialize';
const dirname = currentPath(import.meta);
const domainProfile = await createDomainCertificate({
	entity: 'universalweb.io',
	records: [
		[
			'a',
			'@',
			'127.0.0.1',
			8888
		],
		[
			'a',
			'@',
			'::1',
			8888
		],
	],
	// savePath: `${dirname}/../serverApp/certs`,
	// certificateName: 'universal.web'
});
// Locality if validated via mail/phone & in person
// locality: [
// 	'Universal Web',
// 	'US',
// 	'FL',
// 	'UW Township',
// 	'UW County',
// 	'00000'
// ],
console.log('DOMAIN Profile created (Master & IDENTITY CERTIFICATEs)', decode(domainProfile.ephemeral.certificate));
const profile = await createProfile({
	savePath: `${dirname}/../profiles/default`,
	folder: 'default',
	certificateName: 'default',
	saveToKeychain: {
		account: 'Default Profile'
	}
});
console.log('Profile created (Master & IDENTITY CERTIFICATEs)', decode(domainProfile.ephemeral.certificate));
