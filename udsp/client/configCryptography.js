import {
	assign,
	has,
	hasValue,
	intersection
} from '@universalweb/acid';
import { getAlgorithm, processPublicKey } from '../cryptoMiddleware/index.js';
import { success } from '#logs';
export async function configCryptography() {
	const certificate = this.certificate;
	const { cipherSuites }	= certificate;
	// console.log(this.cryptography);
	this.signatureAlgorithm = certificate.getSignatureAlgorithm();
	this.cipherSuite = certificate.selectCipherSuite(cipherSuites);
	this.encryptionKeypair = this.cipherSuite.keypair();
	await this.setSessionKeys();
}
