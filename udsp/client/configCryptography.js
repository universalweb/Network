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
	if (noValue(this.cipherSuite)) {
		this.cipherSuite = await certificate.selectCipherSuite(cipherSuites);
	}
	// console.log(this.cipherSuite);
	assign(this, await this.cipherSuite.clientEphemeralKeypair());
	await this.cipherSuite.clientInitializeSession(this, this.destination);
}
