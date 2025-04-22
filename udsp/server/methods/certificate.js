import { DomainCertificate, PublicDomainCertificate } from '../../../components/certificate/domain.js';
export async function setCertificate() {
	const {
		options,
		options: {
			certificatePath,
			publicCertificatePath
		}
	} = this;
	if (certificatePath) {
		this.certificate = await new DomainCertificate(certificatePath);
		this.logInfo('Domain Certificate Loaded', this.certificate);
	}
	if (publicCertificatePath) {
		this.certificatePublic = await new PublicDomainCertificate(publicCertificatePath);
		this.logInfo('Public Domain Certificate Loaded', this.certificatePublic);
	}
}
//  TODO: Consider renaming or combining into setCertificate function maybe split function?
export async function configureCertificateCryptography() {
	if (this.certificate) {
		this.logInfo('CERTIFICATE CRYPTO CONFIG STARTING');
		const keyExchangeKeypair = this.certificate.get('keyExchangeKeypair');
		this.version = this.certificate.get('version');
		await this.certificate.setCipherMethods();
		await this.certificate.setKeyExchangeAlgorithm();
		await this.certificate.setSignatureAlgorithm();
		if (this.certificate.keyExchangeAlgorithm.initializeCertificateKeypair) {
			await this.certificate.keyExchangeAlgorithm.initializeCertificateKeypair(keyExchangeKeypair, this);
		}
		this.logInfo('CERTIFICATE CRYPTO CONFIG COMPLETE');
	} else {
		this.logInfo('NO CERTIFICATE CRYPTO CONFIG');
	}
}
