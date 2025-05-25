export const introHeaderRPC = 0;
export function isIntroHeader(id) {
	return id === introHeaderRPC;
}
export const extendedSynchronizationHeaderRPC = 1;
export function isExtendedSynchronizationHeader(id) {
	return id === extendedSynchronizationHeaderRPC;
}
export const discoveryHeaderRPC = 2;
export function isDiscoveryHeader(id) {
	return id === discoveryHeaderRPC;
}
export const endHeaderRPC = 3;
export function isEndHeader(id) {
	return id === endHeaderRPC;
}
