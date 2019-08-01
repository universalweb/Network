/*
  Module for only signing certificates
*/
module.exports = async (state) => {
	const {
		certificate: {
			sign
		},
		utility: {
			omit
		}
	} = state;
	state.signCertificate = async (certificate, signer, propertyName) => {
		const certificateSigned = await sign(omit(certificate, 'private'), signer);
		certificate[propertyName] = certificateSigned;
		certificate.data[propertyName] = certificate[propertyName];
		return certificateSigned;
	};
};
