import {
	construct,
	each,
	assign,
	UniqID,
	isFunction,
	currentPath,
	isTrue
} from '@universalweb/acid';
import {
	success,
	failed,
	imported,
	msgSent,
	info,
	msgReceived
} from '#logs';
import { UWCrypto } from './availableCryptography.js';
class Cryptography {
	constructor(cipherSuite, config) {
		this.config = config;
		this.cipherSuite = cipherSuite;
		return this.initialize();
	}
	initialize() {
		// console.log(config);
		const config = this.config;
		const {
			encryptClientConnectionId,
			encryptServerConnectionId,
			encryptServerKey,
			encryptClientKey,
			publicKeyAlgorithm,
			cipherSuites,
			connectionIdKeypair,
			generate,
			keypair: {
				privateKey,
				publicKey
			},
			encryptKeypair,
			encryptConnectionId
		} = config;
		const cryptoUtilities = new UWCrypto(this.cipherSuite, config);
		this.utilities = cryptoUtilities;
		const {
			signKeypairToEncryptKeypair,
			encrypt: { overhead }
		} = cryptoUtilities;
		if (!encryptKeypair && publicKeyAlgorithm === 'ed25519') {
			console.log('keypairType', config.keypairType);
			if (config.keypairType === 'ed25519') {
				if (config.privateKey) {
					this.encryptionKeypair = this.utilities.signKeypairToEncryptKeypair({
						publicKey,
						privateKey
					});
				} else {
					this.encryptionKeypair = signKeypairToEncryptKeypair({
						publicKey
					});
				}
			}
		}
		if (overhead) {
			this.encryptOverhead = overhead;
		}
	}
}
export function cryptography(...args) {
	return construct(Cryptography, args);
}
