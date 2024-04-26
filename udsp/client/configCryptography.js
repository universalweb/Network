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
	this.signatureAlgorithm = await certificate.getSignatureAlgorithm();
	this.cipherSuite = await certificate.selectCipherSuite(cipherSuites);
	console.log(this.cipherSuite);
	this.encryptionKeypair = await this.cipherSuite.keypair(this.destination);
	await this.setSessionKeys();
}
