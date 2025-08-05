import { publicDomainCertificate } from '#components/certificate/domain/domain';
export async function loadCertificate() {
	// this.logInfo(this);
	const { options: { destinationCertificate } } = this;
	this.destination.certificate = await publicDomainCertificate(destinationCertificate);
	this.logInfo(this.destination.certificate);
	await this.processCertificate();
	await this.configCryptography();
	await this.discovered();
}
export async function processCertificate() {
	const { destination } = this;
	const { certificate } = destination;
	const {
		keyExchangeKeypair,
		signatureKeypair,
		version: certificateVersion,
		encryptConnectionId,
		protocolOptions,
		ciphers,
	} = certificate.get();
	const version = certificate.getProtocolVersion();
	// Need function that can assign to source and decide publicKey or other properties
	destination.publicKey = keyExchangeKeypair?.publicKey || keyExchangeKeypair;
	this.keyExchange = certificate.keyExchangeAlgorithm;
	// this.logInfo(destination);
	destination.signatureKeypair = signatureKeypair?.publicKey || signatureKeypair;
	destination.protocolOptions = protocolOptions;
}
export async function onCertificateChunk(message) {
}
