import { getAlgorithm, processPublicKey } from '../cryptoMiddleware/index.js';
import { has, hasValue, intersection } from '@universalweb/acid';
import { success } from '#logs';
export async function configCryptography() {
	// console.log(this.cryptography);
	const { destination, } = this;
	const {
		encryptConnectionId,
		publicKeyAlgorithm,
	} = destination;
	if (!destination.cipherSuites) {
		destination.cipherSuites = this.cipherSuites;
	}
	if (destination.cipherSuites) {
		if (!has(destination.cipherSuites, this.cipherSuiteName)) {
			console.log('Default ciphersuite not available');
			this.cipherSuiteName = intersection(this.cipherSuites, destination.cipherSuites)[0];
			if (!this.cipherSuiteName) {
				console.log('No matching cipher suite found.');
				return false;
			}
		}
	}
	this.publicKeyCryptography = getAlgorithm(publicKeyAlgorithm, this.version);
	this.cipherSuite = getAlgorithm(this.cipherSuiteName, this.version);
	console.log(this.cipherSuiteName);
	if (destination.boxCryptography) {
		this.boxCryptography = getAlgorithm(destination.boxCryptography, this.version);
	}
	this.compression = destination.compression;
	this.headerCompression = destination.headerCompression;
	if (destination.autoLogin && this.autoLogin) {
		this.autoLogin = true;
	}
	if (!this.keypair) {
		this.keypair = this.cipherSuite.keypair();
		success(`Created Connection Keypair`);
	}
	if (!this.encryptionKeypair) {
		this.encryptionKeypair = this.keypair;
	}
	this.destination.encryptionKeypair = this.destination.encryptionKeypair;
	await this.setSessionKeys();
	if (encryptConnectionId) {
		const {
			server: encryptServerCid,
			client: encryptClientCid,
			keypair: connectionIdKeypair
		} = encryptConnectionId;
		let encryptServer = hasValue(encryptServerCid);
		let encryptClient = hasValue(encryptClientCid);
		if (!encryptServer && !encryptClient) {
			encryptServer = true;
			encryptClient = true;
		}
		if (encryptServer) {
			this.encryptServerConnectionId = true;
			if (connectionIdKeypair) {
				this.destination.connectionIdKeypair = connectionIdKeypair;
			} else {
				this.destination.connectionIdKeypair = this.destination.encryptionKeypair;
			}
		}
		if (encryptClient) {
			this.encryptClientConnectionId = true;
		}
		console.log(`Encrypt Connection ID Server ${encryptServer} Client ${encryptClient}`);
	}
}
