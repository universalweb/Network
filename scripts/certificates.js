import { createProfile } from '#certificate';
import { currentPath } from '@universalweb/acid';
import { decode } from '#utilities/serialize';
const dirname = currentPath(import.meta);
const domainProfile = await createProfile({
	template: {
		ephemeral: {
			// nft: {
			// 	network: 'eth',
			// 	contract: '0x0000000',
			// 	id: '0x0000000',
			// },
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
			// The purpose of encrypting connection IDs (CIDs) is to eliminate connection ID tracking and to constantly change how the connection id looks from those observing packets. This is for constant changing of the server ID and or client ID.
			// Encrypting CIDs protects against leaking smart CID routing information - Typically this is overkill and should be avoided
			// encryptConnectionId: {
			// 	size: 8, // size of the connection id in bytes
			// clientSize: 24,
			// serverSize; 24,
			// 	keypair: Buffer,  // UNIQUE KEYPAIR FOR Encrypting or none to use the certificate keypair
			// 	server: true, // or none to default to true if encryptConnectionId is defined
			// 	client: true, // or none to default to true if encryptConnectionId is defined Encrypts client with its own keypair from server side
			// },
			// Encrypt the client's public key when sending to server for handshake
			// encryptKeypair: {
			// 	size: 42,
			// 	keypair: UNIQUE KEYPAIR FOR Encrypting or none to use the certificate keypair,
			// 	server: true,
			// 	client: true,
			// }
			// Connection ID size in bytes
			connectionIdSize: 8,
			// client connection id size enforced on the server
			clientConnectionIdSize: 4,
			// Max payload (head or data) size in bytes
			// maxPacketPayloadSize: 1200,
			// Max Payload size
			// maxPacketDataSize: 1200,
			// Max size of the header payload
			// maxPacketHeadSize: 1200,
			// maxPacketPathSize: 1200,
			// maxPacketParametersSize: 1200,
			url: 'universal.web',
			// domain: 'universal',
			// extension: 'web',
			// The ip, ipv4, & ipv6 properties are used to determine the IP address of the server.
			// The ip property can be either ipv4 or ipv6.
			// ipv4/ipv6 can also be used as a form of backup ips or the primary ips for their respective versions. Similar to A & AAAA records.
			// ip: ['::1', '127.0.0.1'],
			ip: '::1',
			// This allows for IPv4 and IPv6 to use specific details that is more fitting for that endpoint.
			// This is not intended to be used when IPv6 becomes the standard.
			// ipv4: '127.0.0.1',
			// ipv6: '::1',
			// Another format for IPv4 and ipv6 is an object with specific details that can override the initial certificate's details.
			// ipv4: {
			// 	ip: '127.0.0.1',
			// 	keypair: {}
			// },
			// Records can be attached to this domain certificate in their own certificate or included in this certificate.
			// If multiple A or AAAA records are provided in addition to the ips listed above then they will be used as backup ips.
			records: {
				aaaa: [{
					name: '@',
					value: '::1',
					priority: 0,
					ttl: 'auto'
				}],
				a: [{
					name: '@',
					value: '127.0.0.1',
					priority: 0,
					ttl: 'auto'
				}],
				mx: [{
					name: '@',
					value: 'email.universal.web',
					priority: 0,
					ttl: 'auto'
				}, {
					name: '@',
					value: 'email2.universal.web',
					priority: 1,
					ttl: 'auto'
				}],
			},
			port: 8888,
			// Used when a custom Domain name server is used to resolve the domain name locations still provides valid certificates else will be warned of invalid certificate
			// domainInfoServer: {
			// 	url: 'dis.universal.web',
			// 	subdomain: 'dis',
			// 	domain: 'universal',
			// 	extension: 'web',
			// },
			// Max sizes of the body/data/payload for upload and download
			// maxUploadSize: 1024,
			// maxDownloadSize: 1024,
			// crypto: {
			// type: 'viat',
			// enable viat puzzles as a form of congestion control
			// puzzles: true,
			// When publicKey is set to true it will use the public key in the certificate as the main Viat wallet for the domain. If a string is provided then it would be the main wallet for the domain.
			// publicKey: true
			// },
			// This allows a browser or connection to use the realtime mode for the UDSP connection
			// Permits it to act similar to a web transport and or a websocket connection
			// realtime: true,
			// blocked methods mean methods the server doesn't permit
			// blockedMethods: ['delete'],
			// allowedMethods: ['get', 'connect', 'file', 'stream', 'close'],
			// deafult compression of payload data only
			// compression: true,
			// packetCompression: true,
			// headerCompression: true,
			// footerCompression: true,
			// messageCompression: true,
			// autoLogin: true,
		},
		whois: {
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
