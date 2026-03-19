/**
 * Configures the types of generalized software services/topologies that nodes,
 * wallets, or applications align with across the Universal/Network structure.
 */
export const SERVICE_TYPES = {
	APP: 0,
	WEBSITE: 1,
	UNIVERSAL: 3,
	NETWORK: 4,
	WALLET: 5,
};
/**
 * Specifies the underlying target network type for the derived application
 * profile mapping, distinguishing between blockchain usage and other constructs.
 */
export const SERVICE_NETWORK_TYPES = {
	CRYPTOCURRENCY: 0,
	AI: 1,
};
/**
 * Specifies the broader host application hardware environments or platform
 * classifications supported when deriving deterministic nodes or configurations.
 */
export const APP_PLATFORMS = {
	DESKTOP: 0,
	MOBILE: 1,
	UNIVERSAL: 2,
};
/**
 * Specifies the underlying nature or framework implementation style of
 * an application running on an APP_PLATFORM, useful for environment isolation.
 */
export const APP_TYPES = {
	NATIVE: 0,
	WEB: 1,
	HYBRID: 2,
};
/**
 * Distinct mapping for known operating systems interacting with the
 * networking features for specific node mapping or configurations.
 */
export const OPERATING_SYSTEMS = {
	UNIX: 0,
	BSD: 1,
	MACOS: 2,
	WINDOWS: 3,
	LINUX: 4,
	ANDROID: 5,
	IOS: 6,
	OTHER: 7,
};
/**
 * Dictates general brandings or manufacturer classes corresponding to
 * mobile operational states, typically for analytic or feature flags.
 */
export const MOBILE_BRANDS = {
	APPLE: 0,
	SAMSUNG: 1,
	GOOGLE: 2,
	OTHER: 3,
	ASUS: 4,
	ACER: 5,
};
export default {
	SERVICE_TYPES,
	SERVICE_NETWORK_TYPES,
	APP_PLATFORMS,
	APP_TYPES,
	OPERATING_SYSTEMS,
	MOBILE_BRANDS,
};
