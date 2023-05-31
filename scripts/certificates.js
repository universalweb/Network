import { createProfile } from '#certificate';
import { currentPath } from '#directory';
import { decode } from 'msgpackr';
const dirname = currentPath(import.meta);
const domainProfile = await createProfile({
	template: {
		ephemeral: {
			version: 1,
			ip: '::1',
			algo: 'default',
			port: 8888,
			host: 'universal.web',
			entity: {
				name: 'Universal Web',
			},
			locality: {
				state: 'FL',
				country: 'US'
			},
			encryptConnectionId: true,
			compression: true,
			headerCompression: true,
		},
		master: {},
	},
	savePath: `${dirname}/../services`,
	certificateName: 'universal.web'
});
console.log('DOMAIN Profile created (Master & IDENTITY CERTIFICATEs)', decode(domainProfile.ephemeral.certificate));
const profile = await createProfile({
	template: {
		ephemeral: {
			version: 1,
		},
		master: {
			version: 1,
		}
	},
	savePath: `${dirname}/../profiles`,
	certificateName: 'default',
	saveToKeychain: {
		account: 'Universal Web Profile'
	}
});
console.log('Profile created (Master & IDENTITY CERTIFICATEs)', decode(profile.ephemeral.certificate));
