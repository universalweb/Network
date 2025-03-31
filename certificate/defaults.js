export const certificateVersion = 1;
export const certificateTypes = new Map();
certificateTypes.set('domain', 0);
certificateTypes.set('profile', 1);
certificateTypes.set('dis', 2);
const certificateDefaults = {
	certificateVersion,
	certificateTypes,
};
export default certificateDefaults;
