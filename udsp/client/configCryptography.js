import {
	assign,
	has,
	hasValue,
	intersection,
	noValue
} from '@universalweb/acid';
import { success } from '#logs';
export async function configCryptography() {
	const certificate = this.destination.certificate;
	const { cipherSuites }	= certificate;
	this.signatureAlgorithm = await certificate.getSignatureAlgorithm();
	if (hasValue(this.options?.cipherSuite)) {
		this.cipherSuite = await certificate.selectCipherSuite(this.options?.cipherSuite);
	}
	if (noValue(this.cipherSuite)) {
		console.log('CIPHER SUITES SUPPORTED', cipherSuites, certificate);
		this.cipherSuite = certificate.cipherSuiteMethods[0];
	}
	// console.log(this.cipherSuite);
	assign(this, await this.cipherSuite.clientEphemeralKeypair());
	await this.cipherSuite.clientInitializeSession(this, this.destination);
}
