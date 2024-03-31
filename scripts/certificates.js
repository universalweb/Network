import { DomainCertificate, createDomainCertificate, createProfile } from '#udsp/certificate/index';
import { currentPath } from '@universalweb/acid';
import { decode } from '#utilities/serialize';
const dirname = currentPath(import.meta);
const profile = new UWProfile({
	savePath: `${dirname}/../profiles/default`,
	certificateName: 'default',
	saveToKeychain: {
		account: 'Default Profile'
	}
});
const domainCertificate = new DomainCertificate({
	entity: 'universalweb.io',
	owner: profile.getSignature(),
	records: [
		[
			'a',
			'@',
			'127.0.0.1',
			8888
		],
		[
			'aaaa',
			'@',
			'::1',
			8888
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
