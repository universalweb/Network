export const introRPC = 0;
export function isIntro(id) {
	return id === introRPC;
}
export const extendedSynchronizationRPC = 1;
export function isExtendedSynchronization(id) {
	return id === extendedSynchronizationRPC;
}
export const discoveryRPC = 2;
export function isDiscovery(id) {
	return id === discoveryRPC;
}
export const endRPC = 3;
export function isEnd(id) {
	return id === endRPC;
}
