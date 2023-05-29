import { createProfile } from '#certificate';
import { currentPath } from '#directory';
const dirname = currentPath(import.meta);
const domainCert = await createProfile({
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
console.log('DOMAIN CERTIFICATE CREATED');
const identityCert = await createProfile({
	template: {
		ephemeral: {
			version: 1,
		},
		master: {
			version: 1,
		}
	},
	savePath: `${dirname}/../profiles`,
	certificateName: 'default'
});
console.log('IDENTITY CERTIFICATE CREATED');
