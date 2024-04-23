import {
	assign,
	has,
	hasValue,
	intersection
} from '@universalweb/acid';
import { success } from '#logs';
export async function configCryptography() {
	const certificate = this.destination.certificate;
	const { cipherSuites }	= certificate;
	// console.log(this.cryptography);
	this.signatureAlgorithm = certificate.getSignatureAlgorithm();
	this.cipherSuite = certificate.selectCipherSuite(cipherSuites);
	console.log(this.cipherSuite);
	this.encryptionKeypair = this.cipherSuite.keypair();
	await this.setSessionKeys();
}
