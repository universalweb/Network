import {
	assign,
	has,
	hasValue,
	intersection
} from '@universalweb/acid';
import { success } from '#logs';
import { x25519_kyber768_xchacha20 } from '../cryptoMiddleware/kyber';
export async function configCryptography() {
	const certificate = this.destination.certificate;
	const { cipherSuites }	= certificate;
	this.signatureAlgorithm = await certificate.getSignatureAlgorithm();
	this.cipherSuite = await certificate.selectCipherSuite(cipherSuites);
	// console.log(this.cipherSuite);
	assign(this, await this.cipherSuite.ephemeralKeypair());
	await this.cipherSuite.clientInitialSession(this, this.destination);
}
