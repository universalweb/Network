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
	constructor(config) {
		this.config = config;
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
		const cryptoUtilities = new UWCrypto(config);
		this.utilities = cryptoUtilities;
		const { signKeypairToEncryptKeypair } = cryptoUtilities;
		if (!encryptKeypair && publicKeyAlgorithm === 'ed25519') {
			console.log('keypairType', config.keypairType);
			if (config.keypairType === 'ed25519') {
				if (config.privateKey) {
					this.encryptionKeypair = this.utilities.signKeypairToEncryptKeypair({
						publicKey: config.publicKey,
						privateKey: config.privateKey
					});
				} else {
					this.encryptionKeypair = signKeypairToEncryptKeypair({
						publicKey: config.publicKey
					});
				}
			}
		}
		if (encryptClientConnectionId || encryptServerConnectionId || encryptConnectionId) {
			if (isTrue(connectionIdKeypair)) {
				this.connectionIdKeypair = this.encryptionKeypair;
			} else if (connectionIdKeypair) {
				this.connectionIdKeypair = connectionIdKeypair;
			}
		}
		if (generate?.keypair) {
			this.generated.keypair = this.keypair();
			this.generated.connectionIdKeypair = this.generated.keypair;
			this.generated.encryptKeypair = this.generated.keypair;
		}
		console.log(this.encryptionKeypair);
		if (generate?.clientSessionKeys && this.encryptionKeypair.publicKey) {
			this.generated.sessionKeys = this.clientSessionKeys(this.generated.keypair, this.encryptionKeypair.publicKey);
		}
		if (this.encryptMethod.overhead) {
			this.encryptOverhead = this.encryptMethod.overhead;
		}
	}
	generated = {
		destination: {}
	};
}
export function cryptography(...args) {
	return construct(Cryptography, args);
}
