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
	const { ciphers }	= certificate;
	this.signatureAlgorithm = await certificate.getSignatureAlgorithm();
	if (hasValue(this.options?.cipher)) {
		this.cipher = await certificate.selectCipherSuite(this.options?.cipher);
	}
	if (noValue(this.cipher)) {
		this.logInfo('CIPHER SUITES SUPPORTED', ciphers, certificate);
		this.cipher = certificate.cipherMethods[0];
	}
	if (this.keyExchangeAlgorithm) {
		if (this.keyExchange.certificateKeypairCompatabilityClient) {
			await this.keyExchange.certificateKeypairCompatabilityClient(this, this.destination);
		}
		if (this.keyExchange.initializeCertificateKeypair) {
			await this.keyExchange.initializeCertificateKeypair(this.destination, this.destination);
		}
	}
	// this.logInfo(this.cipher);
	const sessionObject = await this.keyExchange.clientEphemeralKeypair();
	assign(this, sessionObject);
	await this.keyExchange.clientInitializeSession(this, this.destination);
	this.nonce = await this.cipher.createNonce();
}
