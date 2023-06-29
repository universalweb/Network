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
			// AES (please God no xchacha exists), MD5 (Not for crypto), RSA (Just stop using RSA TY) are not permitted
			// There are better options than SHA nothing below 3 is permitted as a standalone hash function.
			cryptography: {
				// below is the default algorithm options
				// alias: 'default',
				// default and only currently supported/allowed
				aead: 'xchacha20poly1305',
				hash: 'blake3',
				signature: 'ed25519',
				exchange: 'x25519',
				curve: '25519',
				// The cryptographic algo used, intended, and or generated with the provided public key
				publicKeyType: 'ed25519',
				// The purpose of encrypting connection IDs is to eliminate CID tracking and to constantly change how the CID looks.
				// Encrypting CIDs protects against leaking smart CID routing information which show the endpoint server/process.
				// encryptConnectionId: 'sealedbox', Applies to both client and server connection ID
				// encryptClientConnectionId: 'sealedbox',
				// encryptServerConnectionId: 'sealedbox',
				// connectionIdKeypair: true,
				// Encrypt public key sent in the packet
				// encryptClientKey: 'sealedbox',
				// encryptServerKey: 'sealedbox',
				encryptKeypair: true
			},
			// Max connection id size in bytes
			// connectionIdSize: 56,
			// Max Payload size
			maxPayloadSize: 900,
			ip: '::1',
			port: 8888,
			domain: 'universal.web',
			hostname: 'universal',
			extension: 'web',
			// Shows the browser how to display the domain name for humans correctly
			encoding: 'utf8',
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
				curve: '25519',
				// When publicKey is set to true it will use the public key in the certificate as the main Viat wallet for the domain. If a string is provided then it would be the main wallet for the domain.
				publicKey: true
			},
			// This allows a browser or connection to use the realtime mode for the UDSP connection
			realtime: true,
			// blocked methods mean methods the server doesn't permit
			// blockedMethods: ['open'],
			allowedMethods: ['get', 'connect', 'open', 'close'],
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
