export const introHeaderRPC = 0;
export function isIntroHeader(id) {
	return id === introHeaderRPC;
}
export const extendedHandshakeHeaderRPC = 1;
export function isExtendedHandshakeHeader(id) {
	return id === extendedHandshakeHeaderRPC;
}
export const discoveryHeaderRPC = 2;
export function isDiscoveryHeader(id) {
	return id === discoveryHeaderRPC;
}
export const endHeaderRPC = 3;
export function isEndHeader(id) {
	return id === endHeaderRPC;
}
