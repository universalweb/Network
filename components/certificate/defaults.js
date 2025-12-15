// Profile -> Signature Cert -> Domain Cert
// Profile -> Wallet Cert -> Domain Cert
// HD Profile Seed -> (Wallet Cert -> (Signature Cert -> Domain Cert))
export const certificateVersion = 1;
export const certificateTypes = new Map();
certificateTypes.set('domain', 0);
certificateTypes.set('signature', 1);
certificateTypes.set('wallet', 2);
certificateTypes.set('profile', 3);
certificateTypes.set('dis', 4);
const certificateDefaults = {
	certificateVersion,
	certificateTypes,
};
export default certificateDefaults;
