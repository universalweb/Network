import { createProfile } from '#certificate';
import { currentPath } from '@universalweb/acid';
import { decode } from 'msgpackr';
const dirname = currentPath(import.meta);
const domainProfile = await createProfile({
	template: {
		ephemeral: {
			nft: {
				network: 'eth',
				contract: '0x0000000',
				id: '0x0000000',
			},
			// version is the version number of uw://
			// certificate version
			version: 1,
			// Crypto can be explicit or use shorthand like this algo: 'default' The default is listed below
			// Encryption algorithm must be an AEAD algorithm (Authenticated Encryption with Associated Data) such as xchacha20poly1305
			// AES (please God no, xchacha exists), SHA, MD5 (Not for crypto), RSA (Just stop using RSA TY) are not permitted
			// The default option is the first option listed in cipherSuites
			// There is however a default ciphersuite assigned to each version of UW://
			cipherSuites: ['x25519-xchacha20-poly1305'],
			publicKeyAlgorithm: 'ed25519',
			// The purpose of encrypting connection IDs (CIDs) is to eliminate connection ID tracking and to constantly change how the connection id looks from those observing packets.
			// Encrypting CIDs protects against leaking smart CID routing information which show the endpoint server/process.
			// boxCryptography: 'xsalsa20',
			// encryptConnectionId: true, Applies to both client and server connection ID
			// encryptClientConnectionId: true,
			// encryptServerConnectionId: true,
			// connectionIdKeypair: UNIQUE KEYPAIR FOR CONNECTION IDs,
			// Encrypt public key sent in the packet
			// encryptClientKey: true,
			// encryptServerKey: true,
			// encryptKeypair: true
			// Max connection id size in bytes usually randomly generated and checked but used to calculate max packet payload size
			connectionIdSize: 8,
			// Max payload (head or data) size in bytes
			// maxPayloadSize: 1200,
			// Max Payload size
			// maxDataSize: 1200,
			// Max size of the header payload
			// maxHeadSize: 1200,
			// maxPathSize: 1200,
			// maxParametersSize: 1200,
			// heartbeat is an interval check for when a client must send something to the server to remain connected
			heartbeat: 30000,
			url: 'universal.web',
			domain: 'universal',
			extension: 'web',
			ip: '::1',
			port: 8888,
			// Used when a custom Domain name server is used to resolve the domain name locations still provides valid certificates else will be warned of invalid certificate
			// domainInfoServer: {
			// 	url: 'dis.universal.web',
			// 	subdomain: 'dis',
			// 	domain: 'universal',
			// 	extension: 'web',
			// },
			// Shows the browser how to display the domain name for humans correctly
			encoding: 'utf8',
			entity: {
				name: 'Universal Web',
			},
			locality: {
				state: 'FL',
				country: 'US',
				zip: '00000',
				town: 'UW Township',
				county: 'UW County',
			},
			crypto: {
				type: 'viat',
				// enable viat puzzles as a form of congestion control
				puzzles: true,
				// When publicKey is set to true it will use the public key in the certificate as the main Viat wallet for the domain. If a string is provided then it would be the main wallet for the domain.
				publicKey: true
			},
			// This allows a browser or connection to use the realtime mode for the UDSP connection
			// Allowing it to act like a webtransport, websocket, and or traditional HTTP like connection
			realtime: true,
			// blocked methods mean methods the server doesn't permit
			// blockedMethods: ['open'],
			allowedMethods: ['get', 'connect', 'open', 'file', 'stream', 'close'],
			// deafult compression of payload data only
			compression: true,
			// packetCompression: true,
			// headerCompression: true,
			// footerCompression: true,
			// pathCompression: true,
			// parameterCompression: true,
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
			viat: true
		}
	},
	savePath: `${dirname}/../profiles`,
	certificateName: 'default',
	saveToKeychain: {
		account: 'Universal Web Profile'
	}
});
console.log('Profile created (Master & IDENTITY CERTIFICATEs)', decode(domainProfile.ephemeral.certificate));
