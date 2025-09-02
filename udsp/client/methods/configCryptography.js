import {
	assign,
	has,
	hasValue,
	intersection,
	noValue,
} from '@universalweb/utilitylib';
export async function configCryptography() {
	const certificate = this.destination.certificate;
	const ciphers = await certificate.getCiphers();
	this.signatureAlgorithm = await certificate.getSignatureAlgorithm();
	if (hasValue(this.options?.cipher)) {
		this.cipher = await certificate.selectCipher(this.options?.cipher);
	}
	if (noValue(this.cipher)) {
		this.logInfo('SUPPORTED CIPHER SUITES', ciphers, certificate.object);
		this.cipher = certificate.cipherMethods[0];
	}
	if (this.keyExchange) {
		if (this.keyExchange.certificateKeypairCompatabilityClient) {
			await this.keyExchange.certificateKeypairCompatabilityClient(this, this.destination);
		}
		if (this.keyExchange.initializeCertificateKeypair) {
			await this.keyExchange.initializeCertificateKeypair(this.destination, this.destination);
		}
	}
	// this.logInfo(this.cipher);
	const clientEphemeralKeypair = await this.keyExchange.clientEphemeralKeypair();
	assign(this, clientEphemeralKeypair);
	this.nonce = await this.cipher.createNonce();
	await this.keyExchange.onClientInitialization(this, this.destination);
	this.logInfo('CRYPTOGRAPHY CONFIGURED', certificate.object);
}
