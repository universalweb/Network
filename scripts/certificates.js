import { createProfile } from '#certificate';
import { currentPath } from '@universalweb/acid';
import { decode } from 'msgpackr';
const dirname = currentPath(import.meta);
const domainProfile = await createProfile({
	template: {
		ephemeral: {
			version: 1,
			// Crypto can be explicit or use shorthand like this algo: 'default' The default is listed below
			// Encryption algorithm must be an AEAD algorithm (Authenticated Encryption with Associated Data) such as xchacha20poly1305
			// AES (please God no xchacha exists), SHA (fine if found essential to an existing algorithm but not as a standalone function), MD5 (Not for crypto), RSA (Just stop using RSA) are not permitted
			cryptography: {
				// below is the default algorithm options
				// alias: 'default',
				// default and only currently supported/allowed
				aead: 'xchacha20poly1305',
				hash: 'blake2b',
				signature: 'ed25519',
				exchange: 'x25519',
				connectionID: {
					// anonymous encryption
					encrypt: 'sealedbox',
				}
			},
			ip: '::1',
			port: 8888,
			host: 'universal.web',
			entity: {
				name: 'Universal Web',
			},
			locality: {
				state: 'FL',
				country: 'US'
			},
			crypto: {
				type: 'viat',
				puzzles: 'enabled',
				// When publicKey is set to true it will use the public key in the certificate as the main Viat wallet for the domain. If a string is provided then it would be the main wallet for the domain.
				publicKey: true
			},
			// Must use either encryptConnectionId or (encryptClientId & encryptServerConnectionId)
			encryptConnectionId: true,
			encryptClientConnectionId: true,
			encryptServerConnectionId: true,
			encryptKeypair: true,
			compression: true,
			headerCompression: true,
			autoLogin: true,
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
			// Setting Viat to true means this certificate is being used as a viat wallet
			viat: true
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
console.log('Profile created (Master & IDENTITY CERTIFICATEs)', decode(domainProfile.ephemeral.certificate));
